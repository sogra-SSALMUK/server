# NoSQL 인젝션 (NoSQL Injection) 설명

## 기본 개념

**NoSQL 인젝션**은 SQL 인젝션과 유사하지만, MongoDB 같은 NoSQL 데이터베이스를 대상으로 하는 공격입니다.

### SQL 인젝션과의 차이

**SQL 인젝션**:
```sql
-- 악의적인 입력
username: "admin' OR '1'='1"
-- 결과 쿼리
SELECT * FROM users WHERE username = 'admin' OR '1'='1'
```

**NoSQL 인젝션**:
```javascript
// 악의적인 입력
username: { "$ne": null }
// 결과 쿼리
User.findOne({ username: { "$ne": null } })
```

---

## 실제 공격 예시

### 예시 1: 로그인 우회

**현재 코드**:
```javascript
// routes/auth.js
const { username, password } = value;
const user = await User.findOne({ username });
```

**공격 시도**:
```json
POST /api/auth/login
{
  "username": { "$ne": null },
  "password": { "$ne": null }
}
```

**문제**: 
- Joi 검증을 통과하면 안 되지만, 만약 검증이 없다면?
- `User.findOne({ username: { "$ne": null } })`는 null이 아닌 모든 사용자를 찾음
- 첫 번째 사용자가 반환될 수 있음

**현재 상태**: ✅ **안전함** - Joi가 문자열만 허용하므로 객체는 거부됨

---

### 예시 2: 회원가입 중복 체크 우회

**현재 코드**:
```javascript
// routes/auth.js
const existingUser = await User.findOne({ $or: [{ username }, { user_id }] });
```

**공격 시도** (만약 검증이 없다면):
```json
POST /api/auth/register
{
  "username": { "$ne": null },
  "user_id": "test123",
  ...
}
```

**문제**:
- `User.findOne({ $or: [{ username: { "$ne": null } }, { user_id: "test123" }] })`
- 거의 모든 사용자와 매칭될 수 있음

**현재 상태**: ✅ **안전함** - Joi가 문자열만 허용

---

### 예시 3: Place 조회 시 인젝션

**현재 코드**:
```javascript
// routes/places.js
router.get('/:id', async (req, res) => {
  const place = await Place.findById(req.params.id);
});
```

**공격 시도**:
```
GET /api/places/507f1f77bcf86cd799439011' || '1'=='1
```

**문제**:
- `findById()`는 ObjectId만 받으므로 안전함
- 하지만 만약 `findOne({ _id: req.params.id })`였다면?

**현재 상태**: ✅ **안전함** - `findById()`는 ObjectId 검증을 함

---

### 예시 4: Queue 조회 시 인젝션

**현재 코드**:
```javascript
// routes/queue.js
const queues = await Queue.find({ user: user_id })
```

**공격 시도** (만약 user_id가 쿼리 파라미터였다면):
```
GET /api/queue?user_id={"$ne":null}
```

**문제**:
- 하지만 현재는 `req.session.user.id`를 사용하므로 안전함

**현재 상태**: ✅ **안전함** - 세션에서 가져옴

---

## MongoDB 쿼리 연산자 악용

### 위험한 연산자들

1. **`$ne`** (not equal): 특정 값이 아닌 모든 것
   ```javascript
   { username: { "$ne": null } }  // null이 아닌 모든 사용자
   { age: { "$ne": 0 } }           // 0이 아닌 모든 나이
   ```

2. **`$gt`, `$gte`, `$lt`, `$lte`** (비교 연산자)
   ```javascript
   { age: { "$gt": 0 } }  // 0보다 큰 모든 나이
   ```

3. **`$in`** (배열 매칭)
   ```javascript
   { username: { "$in": ["admin", "user"] } }
   ```

4. **`$regex`** (정규식)
   ```javascript
   { username: { "$regex": ".*" } }  // 모든 사용자
   ```

5. **`$where`** (JavaScript 실행) - 매우 위험!
   ```javascript
   { "$where": "this.username == 'admin'" }
   ```

---

## 실제 공격 시나리오

### 시나리오 1: 로그인 우회 시도

**공격자가 시도할 수 있는 것들**:

```javascript
// 1. 모든 사용자 찾기
{ username: { "$ne": null } }

// 2. 정규식으로 매칭
{ username: { "$regex": ".*" } }

// 3. 배열로 여러 사용자 시도
{ username: { "$in": ["admin", "user", "test"] } }

// 4. JavaScript 실행 (매우 위험)
{ "$where": "this.username == 'admin' && this.password == '1234'" }
```

**현재 코드의 보호**:
- ✅ Joi가 문자열만 허용하므로 객체는 거부됨
- ✅ Mongoose의 타입 체크

---

### 시나리오 2: 데이터 추출

**공격자가 시도할 수 있는 것들**:

```javascript
// 1. 모든 데이터 조회
GET /api/places?category={"$ne":null}

// 2. 조건 우회
GET /api/match/me?status={"$in":["pending","both_agreed","rejected"]}
```

**현재 코드의 보호**:
- ✅ 쿼리 파라미터를 직접 사용하지 않음
- ✅ Joi 검증 사용

---

## 방어 방법

### 1. 입력 검증 (현재 적용됨) ✅

```javascript
// Joi로 타입 검증
const loginSchema = Joi.object({
  username: Joi.string()  // 문자열만 허용
    .trim()
    .required()
});
```

**효과**: 객체나 배열이 들어오면 거부됨

---

### 2. Mongoose의 타입 체크 (현재 적용됨) ✅

```javascript
// 스키마 정의
username: {
  type: String,  // 문자열만 허용
  required: true
}
```

**효과**: Mongoose가 자동으로 타입 변환/검증

---

### 3. ObjectId 검증 (일부 적용됨) ⚠️

```javascript
// 현재
router.get('/:id', async (req, res) => {
  const place = await Place.findById(req.params.id);
  // CastError로 잡히지만 명시적 검증 없음
});

// 개선안
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({ error: '올바른 ID 형식이 아닙니다.' });
}
```

---

### 4. 쿼리 파라미터 직접 사용 금지 (현재 적용됨) ✅

```javascript
// 나쁜 예 (하지 않음)
const user = await User.findOne(req.query);

// 좋은 예 (현재)
const user = await User.findOne({ username: req.body.username });
```

---

### 5. `sanitize()` 함수 사용 (추가 가능)

```javascript
const mongoSanitize = require('express-mongo-sanitize');

app.use(mongoSanitize());
```

**효과**: 요청에서 MongoDB 연산자 제거

---

## 현재 코드의 보안 상태

### ✅ 안전한 부분

1. **로그인/회원가입**: Joi 검증으로 문자열만 허용
2. **Queue 조회**: 세션에서 user_id 가져옴
3. **Match 조회**: 세션에서 user_id 가져옴
4. **Place 조회**: `findById()` 사용 (ObjectId 검증)

### ⚠️ 개선 가능한 부분

1. **ObjectId 검증**: 명시적 검증 미들웨어 추가
2. **쿼리 파라미터**: 만약 나중에 필터링 기능 추가 시 주의
3. **mongo-sanitize**: 추가 보안 레이어

---

## 테스트 방법

### 안전한 입력 (통과해야 함)
```json
{
  "username": "testuser",
  "password": "password123"
}
```

### 위험한 입력 (거부되어야 함)
```json
{
  "username": { "$ne": null },
  "password": { "$ne": null }
}
```

**현재 상태**: ✅ 위험한 입력은 Joi에 의해 거부됨

---

## 결론

**현재 코드는 NoSQL 인젝션에 대해 비교적 안전합니다:**

1. ✅ Joi 검증으로 타입 체크
2. ✅ Mongoose 스키마 타입 체크
3. ✅ 쿼리 파라미터 직접 사용 안 함
4. ✅ 세션에서 user_id 가져옴

**추가 보안 강화 가능:**
- `express-mongo-sanitize` 패키지 추가
- ObjectId 검증 미들웨어 추가
- 쿼리 파라미터 사용 시 주의

