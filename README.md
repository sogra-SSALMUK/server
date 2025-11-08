# Express 여행지 매칭 서버

Node.js, Express, Mongoose를 사용한 여행지 기반 사용자 매칭 서버입니다. 사용자들이 지도에서 여행지를 선택하고, 큐에 추가한 후 랜덤 매칭을 통해 상호 동의 시 연락처를 공유할 수 있는 시스템입니다.

## 설치 방법

```bash
npm install
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/login-app
SESSION_SECRET=your-secret-key-change-this
NODE_ENV=development
```

## 실행 방법

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

## Place 더미 데이터 입력

```bash
node scripts/seedPlaces.js
```

대화형 인터페이스로 Place 데이터를 직접 입력할 수 있습니다.

---

# API 명세서

## 기본 정보

- **Base URL**: `http://localhost:3000`
- **인증 방식**: 세션 기반 (express-session)
- **Content-Type**: `application/json`

---

## 1. 인증 API (`/api/auth`)

### 1.1 회원가입

**엔드포인트**: `POST /api/auth/register`

**인증**: 불필요

**요청 Body**:
```json
{
  "username": "string (3-30자)",
  "user_id": "string (필수, unique)",
  "password": "string (최소 6자)",
  "nationality": "string (필수)",
  "gender": "string (필수, 'male' 또는 'female')",
  "age": "number (1-150)",
  "contact_method": "string (필수, 연락수단)"
}
```

**요청 예시**:
```json
{
  "username": "홍길동",
  "user_id": "hong123",
  "password": "password123",
  "nationality": "한국",
  "gender": "male",
  "age": 25,
  "contact_method": "010-1234-5678"
}
```

**성공 응답** (201 Created):
```json
{
  "message": "회원가입이 완료되었습니다.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "홍길동",
    "user_id": "hong123",
    "nationality": "한국",
    "gender": "male",
    "age": 25,
    "contact_method": "010-1234-5678"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 입력 검증 실패 또는 중복 사용자
  ```json
  { "error": "이미 존재하는 사용자명입니다." }
  ```
- `500 Internal Server Error`: 서버 오류

---

### 1.2 로그인

**엔드포인트**: `POST /api/auth/login`

**인증**: 불필요

**요청 Body**:
```json
{
  "username": "string (필수)",
  "password": "string (필수)"
}
```

**요청 예시**:
```json
{
  "username": "홍길동",
  "password": "password123"
}
```

**성공 응답** (200 OK):
```json
{
  "message": "로그인 성공",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "홍길동"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 입력 검증 실패
  ```json
  { "error": "사용자명을 입력해주세요." }
  ```
- `401 Unauthorized`: 잘못된 사용자명 또는 비밀번호
  ```json
  { "error": "사용자명 또는 비밀번호가 올바르지 않습니다." }
  ```

---

### 1.3 로그인 상태 확인

**엔드포인트**: `GET /api/auth/me`

**인증**: 불필요 (로그인 여부만 확인)

**성공 응답** (200 OK):
```json
{
  "loggedIn": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "홍길동"
  }
}
```

**로그인 안 된 경우**:
```json
{
  "loggedIn": false
}
```

---

### 1.4 로그아웃

**엔드포인트**: `POST /api/auth/logout`

**인증**: 불필요

**성공 응답** (200 OK):
```json
{
  "message": "로그아웃 성공"
}
```

**에러 응답**:
- `500 Internal Server Error`: 로그아웃 실패
  ```json
  { "error": "로그아웃 실패" }
  ```

---

## 2. Place API (`/api/places`)

### 2.1 전체 Place 조회

**엔드포인트**: `GET /api/places`

**인증**: 불필요

**성공 응답** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "서울 봄 축제",
    "addr": "서울특별시 종로구 세종대로 175",
    "date": "2024-04-15T10:00:00.000Z",
    "lat": 37.5665,
    "lng": 126.9780,
    "category": "축제",
    "image": "/uploads/1234567890-123456789.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**참고**: `image` 필드는 선택사항입니다.

---

### 2.2 특정 Place 조회

**엔드포인트**: `GET /api/places/:id`

**인증**: 불필요

**URL 파라미터**:
- `id`: Place ID (MongoDB ObjectId)

**성공 응답** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "서울 봄 축제",
  "addr": "서울특별시 종로구 세종대로 175",
  "date": "2024-04-15T10:00:00.000Z",
  "lat": 37.5665,
  "lng": 126.9780,
  "category": "축제",
  "image": "/uploads/1234567890-123456789.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 ID 형식
  ```json
  { "error": "올바른 ID 형식이 아닙니다." }
  ```
- `404 Not Found`: Place를 찾을 수 없음
  ```json
  { "error": "Place를 찾을 수 없습니다." }
  ```

---

### 2.3 이미지 업로드

**엔드포인트**: `POST /api/places/upload-image`

**인증**: 불필요

**Content-Type**: `multipart/form-data`

**요청 Body**:
- `image`: 이미지 파일 (필수)
  - 허용 형식: jpeg, jpg, png, gif, webp
  - 최대 크기: 5MB

**요청 예시** (curl):
```bash
curl -X POST http://localhost:3000/api/places/upload-image \
  -F "image=@/path/to/image.jpg"
```

**요청 예시** (JavaScript/FormData):
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('/api/places/upload-image', {
  method: 'POST',
  body: formData
});
```

**성공 응답** (200 OK):
```json
{
  "message": "이미지가 업로드되었습니다.",
  "imageUrl": "/uploads/1234567890-123456789.jpg",
  "filename": "1234567890-123456789.jpg"
}
```

**에러 응답**:
- `400 Bad Request`: 이미지 파일이 없음
  ```json
  { "error": "이미지 파일을 업로드해주세요." }
  ```
- `400 Bad Request`: 지원하지 않는 파일 형식
  ```json
  { "error": "이미지 파일만 업로드 가능합니다. (jpeg, jpg, png, gif, webp)" }
  ```
- `400 Bad Request`: 파일 크기 초과
  ```json
  { "error": "파일 크기는 5MB를 초과할 수 없습니다." }
  ```

**참고**:
- 업로드된 이미지는 `/uploads/파일명` 경로로 접근 가능
- 예: `http://localhost:3000/uploads/1234567890-123456789.jpg`
- 반환된 `imageUrl`을 Place 데이터의 `image` 필드에 저장하여 사용

---

## 3. Queue API (`/api/queue`)

### 3.1 Queue에 Place 추가

**엔드포인트**: `POST /api/queue`

**인증**: **필수** (로그인 필요)

**요청 Body**:
```json
{
  "place_id": "string (필수, Place의 MongoDB ObjectId)"
}
```

**요청 예시**:
```json
{
  "place_id": "507f1f77bcf86cd799439011"
}
```

**성공 응답** (201 Created):
```json
{
  "message": "Queue에 추가되었습니다.",
  "queue": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439013",
    "place": "507f1f77bcf86cd799439011",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 입력 검증 실패 또는 중복
  ```json
  { "error": "이미 Queue에 추가된 Place입니다." }
  ```
- `401 Unauthorized`: 로그인 필요
  ```json
  { "error": "로그인이 필요합니다." }
  ```
- `404 Not Found`: Place를 찾을 수 없음
  ```json
  { "error": "Place를 찾을 수 없습니다." }
  ```

---

### 3.2 내 Queue 조회

**엔드포인트**: `GET /api/queue/me`

**인증**: **필수** (로그인 필요)

**성공 응답** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439013",
    "place": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**에러 응답**:
- `401 Unauthorized`: 로그인 필요
  ```json
  { "error": "로그인이 필요합니다." }
  ```

---

### 3.3 Queue에서 삭제

**엔드포인트**: `DELETE /api/queue/:id`

**인증**: **필수** (로그인 필요)

**URL 파라미터**:
- `id`: Queue ID (MongoDB ObjectId)

**성공 응답** (200 OK):
```json
{
  "message": "Queue에서 삭제되었습니다.",
  "queue": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439013",
    "place": "507f1f77bcf86cd799439011",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 ID 형식
  ```json
  { "error": "올바른 ID 형식이 아닙니다." }
  ```
- `401 Unauthorized`: 로그인 필요
- `404 Not Found`: Queue를 찾을 수 없음
  ```json
  { "error": "Queue를 찾을 수 없습니다." }
  ```

---

## 4. Match API (`/api/match`)

### 4.1 매칭 생성 (랜덤 매칭)

**엔드포인트**: `POST /api/match/create`

**인증**: **필수** (로그인 필요)

**설명**: 특정 Place에 대해 Queue에 있는 다른 사용자와 랜덤 매칭을 생성합니다. 같은 Place의 active queue에서 랜덤으로 선택하며, 이미 매칭된 사용자는 제외됩니다.

**요청 Body**:
```json
{
  "place_id": "string (필수, Place의 MongoDB ObjectId)"
}
```

**요청 예시**:
```json
{
  "place_id": "507f1f77bcf86cd799439011"
}
```

**성공 응답** (201 Created):
```json
{
  "message": "매칭이 생성되었습니다.",
  "match": {
    "_id": "507f1f77bcf86cd799439014",
    "user1": {
      "_id": "507f1f77bcf86cd799439013",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439015",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23
    },
    "place": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제"
    },
    "status": "pending",
    "user1_agreed": false,
    "user2_agreed": false,
    "matchedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답**:
- `400 Bad Request`: Place ID 누락 또는 이미 매칭됨
  ```json
  { "error": "해당 Place가 Queue에 없습니다." }
  ```
- `401 Unauthorized`: 로그인 필요
- `404 Not Found`: 매칭 가능한 사용자 없음
  ```json
  { "error": "매칭 가능한 사용자가 없습니다." }
  ```

---

### 4.2 내 매칭 목록 조회

**엔드포인트**: `GET /api/match/me`

**인증**: **필수** (로그인 필요)

**설명**: 현재 로그인한 사용자의 모든 매칭 목록을 조회합니다. 상태에 따라 연락처 정보가 필터링됩니다.

**성공 응답** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "user1": {
      "_id": "507f1f77bcf86cd799439013",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25,
      "contact_method": "010-1234-5678"
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439015",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23
      // pending 상태면 contact_method 없음
    },
    "place": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제"
    },
    "status": "pending",
    "user1_agreed": false,
    "user2_agreed": false,
    "matchedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**상태별 연락처 표시 규칙**:
- `pending`: 상대방 연락처 정보 제거
- `both_agreed`: 상대방 연락처 정보 포함

**에러 응답**:
- `401 Unauthorized`: 로그인 필요

---

### 4.3 특정 매칭 조회

**엔드포인트**: `GET /api/match/:id`

**인증**: **필수** (로그인 필요)

**URL 파라미터**:
- `id`: Match ID (MongoDB ObjectId)

**성공 응답** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "user1": {
    "_id": "507f1f77bcf86cd799439013",
    "username": "홍길동",
    "user_id": "hong123",
    "nationality": "한국",
    "gender": "male",
    "age": 25,
    "contact_method": "010-1234-5678"
  },
  "user2": {
    "_id": "507f1f77bcf86cd799439015",
    "username": "김영희",
    "user_id": "kim456",
    "nationality": "한국",
    "gender": "female",
    "age": 23
    // pending 상태면 contact_method 없음
  },
  "place": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "서울 봄 축제",
    "addr": "서울특별시 종로구 세종대로 175",
    "date": "2024-04-15T10:00:00.000Z",
    "lat": 37.5665,
    "lng": 126.9780,
    "category": "축제"
  },
  "status": "pending",
  "user1_agreed": false,
  "user2_agreed": false,
  "matchedAt": "2024-01-01T00:00:00.000Z"
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 ID 형식
- `401 Unauthorized`: 로그인 필요
- `403 Forbidden`: 본인의 매칭이 아님
- `404 Not Found`: Match를 찾을 수 없음

---

### 4.4 매칭 동의

**엔드포인트**: `POST /api/match/:id/agree`

**인증**: **필수** (로그인 필요)

**설명**: 매칭에 대해 동의합니다. 둘 다 동의하면 `both_agreed` 상태로 변경되고 연락처가 자동으로 공개됩니다.

**URL 파라미터**:
- `id`: Match ID (MongoDB ObjectId)

**성공 응답** (200 OK):

**첫 번째 동의 (아직 상대방 미동의)**:
```json
{
  "message": "동의가 완료되었습니다.",
  "match": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "pending",
    "user1_agreed": true,
    "user2_agreed": false
  }
}
```

**둘 다 동의 완료 (상호 동의)**:
```json
{
  "message": "상호 동의가 완료되어 연락처가 공개되었습니다.",
  "match": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "both_agreed",
    "user1_agreed": true,
    "user2_agreed": true,
    "contactSharedAt": "2024-01-01T12:00:00.000Z"
  },
  "contact": {
    "username": "김영희",
    "user_id": "kim456",
    "contact_method": "010-9876-5432"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 이미 동의함 또는 잘못된 ID 형식
  ```json
  { "error": "이미 동의하셨습니다." }
  ```
- `401 Unauthorized`: 로그인 필요
- `403 Forbidden`: 본인의 매칭이 아님
- `404 Not Found`: Match를 찾을 수 없음

---

### 4.5 연락처 조회

**엔드포인트**: `GET /api/match/:id/contact`

**인증**: **필수** (로그인 필요)

**설명**: `both_agreed` 상태인 매칭의 상대방 연락처를 조회합니다.

**URL 파라미터**:
- `id`: Match ID (MongoDB ObjectId)

**성공 응답** (200 OK):
```json
{
  "contact": {
    "username": "김영희",
    "user_id": "kim456",
    "contact_method": "010-9876-5432"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 상호 동의 미완료 또는 잘못된 ID 형식
  ```json
  { "error": "상호 동의가 완료되지 않았습니다." }
  ```
- `401 Unauthorized`: 로그인 필요
- `403 Forbidden`: 본인의 매칭이 아님
- `404 Not Found`: Match를 찾을 수 없음

---

## 매칭 상태 설명

### 상태 종류

1. **`pending`** (대기 중)
   - 매칭 생성 직후 상태
   - `user1_agreed = false`, `user2_agreed = false`
   - 상대방 연락처 정보는 표시되지 않음

2. **`both_agreed`** (상호 동의 완료)
   - `user1_agreed = true` && `user2_agreed = true`일 때 자동 전환
   - `contactSharedAt` 필드에 공개 시간 기록
   - 상대방 연락처 정보가 자동으로 공개됨

3. **`rejected`** (거절)
   - 현재 구현되지 않음 (향후 추가 가능)

### 매칭 플로우

```
1. 사용자가 Place를 Queue에 추가
   → POST /api/queue

2. 매칭 생성 요청
   → POST /api/match/create
   → status: 'pending'

3. 사용자1 동의
   → POST /api/match/:id/agree
   → user1_agreed: true
   → status: 여전히 'pending' (user2 아직 안 함)

4. 사용자2 동의
   → POST /api/match/:id/agree
   → user2_agreed: true
   → status: 'both_agreed' (자동 변경)
   → contactSharedAt: 현재 시간 기록
   → 상대방 연락처 자동 공개

5. 연락처 조회 (선택사항)
   → GET /api/match/:id/contact
   → both_agreed 상태에서만 가능
```

---

## 데이터 모델

### User
- `username`: 사용자명 (3-30자, unique)
- `user_id`: 사용자 ID (unique)
- `password`: 비밀번호 (해싱됨, 최소 6자)
- `nationality`: 국적
- `gender`: 성별 ('male' 또는 'female')
- `age`: 나이 (1-150)
- `contact_method`: 연락수단
- `createdAt`: 생성 시간

### Place
- `title`: 행사 제목
- `addr`: 주소
- `date`: 행사 날짜
- `lat`: 위도 (-90 ~ 90)
- `lng`: 경도 (-180 ~ 180)
- `category`: 카테고리
- `image`: 이미지 URL (선택사항)
- `createdAt`: 생성 시간
- `updatedAt`: 수정 시간

### Queue
- `user`: User 참조 (ObjectId)
- `place`: Place 참조 (ObjectId)
- `status`: 상태 ('active', 'matched', 'removed')
- `createdAt`: 생성 시간
- **제약**: user+place 조합은 unique

### Match
- `user1`: User 참조 (ObjectId)
- `user2`: User 참조 (ObjectId)
- `place`: Place 참조 (ObjectId)
- `status`: 상태 ('pending', 'both_agreed', 'rejected')
- `user1_agreed`: user1 동의 여부 (boolean)
- `user2_agreed`: user2 동의 여부 (boolean)
- `matchedAt`: 매칭된 시간
- `contactSharedAt`: 연락처 공개된 시간
- **제약**: user1 < user2로 정렬, user1+user2+place 조합은 unique

---

## 사용 기술

- **Express.js**: 웹 프레임워크
- **Mongoose**: MongoDB ODM
- **express-session**: 세션 관리
- **bcrypt**: 비밀번호 해싱 (salt rounds: 15)
- **Joi**: 입력 검증
- **express-rate-limit**: Rate Limiting (브루트포스 방지)
- **multer**: 파일 업로드 (이미지)
- **MongoDB**: 데이터베이스

---

## 에러 코드

- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청 (입력 검증 실패 등)
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

## 주의사항

1. **세션 관리**: 로그인 후 세션 쿠키가 자동으로 설정됩니다. 클라이언트에서 쿠키를 포함하여 요청해야 합니다.

2. **비밀번호 보안**: 비밀번호는 bcrypt로 해싱되며, salt rounds는 15로 설정되어 있습니다 (약 2-4초 소요).

3. **중복 방지**: 
   - User: `username`과 `user_id`는 unique
   - Queue: 같은 user+place 조합은 중복 불가
   - Match: 같은 user1+user2+place 조합은 중복 불가

4. **매칭 로직**: 같은 Place의 active queue에서 랜덤 선택하며, 이미 매칭된 사용자는 제외됩니다.
