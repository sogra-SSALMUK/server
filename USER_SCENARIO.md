# 사용자 시나리오 및 API 호출 흐름

## 전체 시나리오 개요

1. **회원가입** → 사용자 계정 생성
2. **로그인** → 세션 생성
3. **Place 조회** → 지도에서 여행지 확인
4. **Queue에 추가** → 관심 있는 행사를 큐에 추가
5. **매칭 생성** → 같은 Place의 다른 사용자와 랜덤 매칭
6. **매칭 조회** → 매칭된 상대방 정보 확인
7. **매칭 동의** → 양쪽 모두 동의
8. **연락처 확인** → 상호 동의 후 연락처 공개

---

## 시나리오 1: 사용자 A의 전체 플로우

### 1단계: 회원가입

**API**: `POST /api/auth/register`

**요청**:
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

**응답** (201):
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

---

### 2단계: 로그인

**API**: `POST /api/auth/login`

**요청**:
```json
{
  "username": "홍길동",
  "password": "password123"
}
```

**응답** (200):
```json
{
  "message": "로그인 성공",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "홍길동"
  }
}
```

**중요**: 이 시점부터 세션 쿠키가 설정됩니다. 이후 모든 요청에 쿠키가 자동으로 포함됩니다.

---

### 3단계: Place 목록 조회 (지도에서 여행지 확인)

**API**: `GET /api/places`

**요청**: (쿠키 포함)

**응답** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "title": "서울 봄 축제",
    "addr": "서울특별시 종로구 세종대로 175",
    "date": "2024-04-15T10:00:00.000Z",
    "lat": 37.5665,
    "lng": 126.9780,
    "category": "축제",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439021",
    "title": "부산 해변 콘서트",
    "addr": "부산광역시 해운대구 해운대해변로 264",
    "date": "2024-05-20T19:00:00.000Z",
    "lat": 35.1587,
    "lng": 129.1604,
    "category": "음악",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4단계: 특정 Place 상세 조회

**API**: `GET /api/places/:id`

**요청**: `GET /api/places/507f1f77bcf86cd799439020` (쿠키 포함)

**응답** (200):
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "title": "서울 봄 축제",
  "addr": "서울특별시 종로구 세종대로 175",
  "date": "2024-04-15T10:00:00.000Z",
  "lat": 37.5665,
  "lng": 126.9780,
  "category": "축제",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5단계: Queue에 Place 추가

**API**: `POST /api/queue`

**요청** (쿠키 포함):
```json
{
  "place_id": "507f1f77bcf86cd799439020"
}
```

**응답** (201):
```json
{
  "message": "Queue에 추가되었습니다.",
  "queue": {
    "_id": "507f1f77bcf86cd799439030",
    "user": "507f1f77bcf86cd799439011",
    "place": "507f1f77bcf86cd799439020",
    "status": "active",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

---

### 6단계: 내 Queue 확인

**API**: `GET /api/queue/me`

**요청**: (쿠키 포함)

**응답** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439030",
    "user": "507f1f77bcf86cd799439011",
    "place": {
      "_id": "507f1f77bcf86cd799439020",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제"
    },
    "status": "active",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

### 7단계: 매칭 생성 (랜덤 매칭)

**API**: `POST /api/match/create`

**요청** (쿠키 포함):
```json
{
  "place_id": "507f1f77bcf86cd799439020"
}
```

**응답** (201):
```json
{
  "message": "매칭이 생성되었습니다.",
  "match": {
    "_id": "507f1f77bcf86cd799439040",
    "user1": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23
    },
    "place": {
      "_id": "507f1f77bcf86cd799439020",
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
    "matchedAt": "2024-01-01T10:05:00.000Z",
    "createdAt": "2024-01-01T10:05:00.000Z",
    "updatedAt": "2024-01-01T10:05:00.000Z"
  }
}
```

**참고**: 
- Queue 상태가 자동으로 'matched'로 변경됨
- user1 < user2로 자동 정렬됨 (중복 방지)

---

### 8단계: 내 매칭 목록 조회

**API**: `GET /api/match/me`

**요청**: (쿠키 포함)

**응답** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439040",
    "user1": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25,
      "contact_method": "010-1234-5678"
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23
      // contact_method 없음 (pending 상태)
    },
    "place": {
      "_id": "507f1f77bcf86cd799439020",
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
    "matchedAt": "2024-01-01T10:05:00.000Z",
    "createdAt": "2024-01-01T10:05:00.000Z",
    "updatedAt": "2024-01-01T10:05:00.000Z"
  }
]
```

**중요**: `pending` 상태이므로 상대방(user2)의 `contact_method`는 표시되지 않습니다.

---

### 9단계: 매칭 동의 (사용자 A)

**API**: `POST /api/match/:id/agree`

**요청**: `POST /api/match/507f1f77bcf86cd799439040/agree` (쿠키 포함)

**응답** (200):
```json
{
  "message": "동의가 완료되었습니다.",
  "match": {
    "_id": "507f1f77bcf86cd799439040",
    "status": "pending",
    "user1_agreed": true,
    "user2_agreed": false
  }
}
```

**참고**: 아직 user2가 동의하지 않았으므로 status는 여전히 'pending'입니다.

---

## 시나리오 2: 사용자 B (매칭된 상대방)의 동의

### 1단계: 로그인 (사용자 B)

**API**: `POST /api/auth/login`

**요청**:
```json
{
  "username": "김영희",
  "password": "password456"
}
```

**응답** (200):
```json
{
  "message": "로그인 성공",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "김영희"
  }
}
```

---

### 2단계: 내 매칭 목록 조회 (사용자 B)

**API**: `GET /api/match/me`

**요청**: (쿠키 포함)

**응답** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439040",
    "user1": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25
      // contact_method 없음 (pending 상태)
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23,
      "contact_method": "010-9876-5432"
    },
    "place": {
      "_id": "507f1f77bcf86cd799439020",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제"
    },
    "status": "pending",
    "user1_agreed": true,
    "user2_agreed": false,
    "matchedAt": "2024-01-01T10:05:00.000Z",
    "createdAt": "2024-01-01T10:05:00.000Z",
    "updatedAt": "2024-01-01T10:10:00.000Z"
  }
]
```

**참고**: user1_agreed가 true인 것을 확인할 수 있습니다 (사용자 A가 이미 동의함).

---

### 3단계: 매칭 동의 (사용자 B)

**API**: `POST /api/match/:id/agree`

**요청**: `POST /api/match/507f1f77bcf86cd799439040/agree` (쿠키 포함)

**응답** (200):
```json
{
  "message": "상호 동의가 완료되어 연락처가 공개되었습니다.",
  "match": {
    "_id": "507f1f77bcf86cd799439040",
    "status": "both_agreed",
    "user1_agreed": true,
    "user2_agreed": true,
    "contactSharedAt": "2024-01-01T10:15:00.000Z"
  },
  "contact": {
    "username": "홍길동",
    "user_id": "hong123",
    "contact_method": "010-1234-5678"
  }
}
```

**중요**: 
- 둘 다 동의했으므로 status가 'both_agreed'로 변경됨
- `contactSharedAt`이 기록됨
- 상대방(user1)의 연락처가 자동으로 반환됨

---

### 4단계: 매칭 목록 재조회 (사용자 B)

**API**: `GET /api/match/me`

**요청**: (쿠키 포함)

**응답** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439040",
    "user1": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25,
      "contact_method": "010-1234-5678"  // 이제 표시됨!
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23,
      "contact_method": "010-9876-5432"
    },
    "place": {
      "_id": "507f1f77bcf86cd799439020",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제"
    },
    "status": "both_agreed",
    "user1_agreed": true,
    "user2_agreed": true,
    "matchedAt": "2024-01-01T10:05:00.000Z",
    "contactSharedAt": "2024-01-01T10:15:00.000Z",
    "createdAt": "2024-01-01T10:05:00.000Z",
    "updatedAt": "2024-01-01T10:15:00.000Z"
  }
]
```

**중요**: `both_agreed` 상태이므로 이제 상대방의 `contact_method`가 표시됩니다.

---

### 5단계: 연락처 조회 (선택사항)

**API**: `GET /api/match/:id/contact`

**요청**: `GET /api/match/507f1f77bcf86cd799439040/contact` (쿠키 포함)

**응답** (200):
```json
{
  "contact": {
    "username": "홍길동",
    "user_id": "hong123",
    "contact_method": "010-1234-5678"
  }
}
```

---

## 시나리오 3: 사용자 A가 다시 조회

### 1단계: 매칭 목록 재조회 (사용자 A)

**API**: `GET /api/match/me`

**요청**: (쿠키 포함)

**응답** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439040",
    "user1": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "홍길동",
      "user_id": "hong123",
      "nationality": "한국",
      "gender": "male",
      "age": 25,
      "contact_method": "010-1234-5678"
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "김영희",
      "user_id": "kim456",
      "nationality": "한국",
      "gender": "female",
      "age": 23,
      "contact_method": "010-9876-5432"  // 이제 표시됨!
    },
    "place": {
      "_id": "507f1f77bcf86cd799439020",
      "title": "서울 봄 축제",
      "addr": "서울특별시 종로구 세종대로 175",
      "date": "2024-04-15T10:00:00.000Z",
      "lat": 37.5665,
      "lng": 126.9780,
      "category": "축제"
    },
    "status": "both_agreed",
    "user1_agreed": true,
    "user2_agreed": true,
    "matchedAt": "2024-01-01T10:05:00.000Z",
    "contactSharedAt": "2024-01-01T10:15:00.000Z",
    "createdAt": "2024-01-01T10:05:00.000Z",
    "updatedAt": "2024-01-01T10:15:00.000Z"
  }
]
```

**중요**: 이제 양쪽 모두 상대방의 연락처를 확인할 수 있습니다.

---

## 코드 검증 결과

### ✅ 정상 작동 확인

1. **인증 플로우**: 회원가입 → 로그인 → 세션 관리 정상
2. **Place 조회**: 전체 조회 및 특정 조회 정상
3. **Queue 관리**: 추가, 조회, 삭제 정상
4. **매칭 생성**: 랜덤 매칭 로직 정상 (중복 방지 포함)
5. **매칭 동의**: 단계별 동의 처리 정상
6. **연락처 공개**: 상호 동의 시 자동 공개 정상
7. **상태별 정보 필터링**: pending/both_agreed 상태에 따른 연락처 표시 정상

### ✅ 수정 완료

1. **User 모델**: gender enum 추가 ('male', 'female')
2. **모든 모델**: timestamps 옵션으로 createdAt/updatedAt 자동 생성

### ⚠️ 주의사항

1. **세션 쿠키**: 모든 인증이 필요한 API는 세션 쿠키를 포함해야 합니다.
2. **중복 방지**: 
   - 같은 user+place는 Queue에 중복 추가 불가
   - 같은 user1+user2+place는 Match에 중복 생성 불가
3. **매칭 로직**: 같은 Place의 active queue에서만 매칭 가능하며, 이미 매칭된 사용자는 제외됩니다.

---

## 전체 플로우 다이어그램

```
[회원가입] → [로그인] → [Place 조회] → [Queue 추가]
                                              ↓
[매칭 생성] ← [Queue 확인] ← [Place 선택]
    ↓
[매칭 조회] → [상대방 정보 확인]
    ↓
[사용자 A 동의] → status: pending (user1_agreed: true)
    ↓
[사용자 B 동의] → status: both_agreed (연락처 자동 공개)
    ↓
[양쪽 모두 연락처 확인 가능]
```

---

## 에러 케이스

### 1. 중복 Queue 추가
- **요청**: 같은 place_id를 다시 Queue에 추가
- **응답**: `400 Bad Request` - "이미 Queue에 추가된 Place입니다."

### 2. 매칭 가능한 사용자 없음
- **요청**: 매칭 생성 시 같은 Place의 active queue가 없음
- **응답**: `404 Not Found` - "매칭 가능한 사용자가 없습니다."

### 3. 이미 동의함
- **요청**: 이미 동의한 매칭에 다시 동의 요청
- **응답**: `400 Bad Request` - "이미 동의하셨습니다."

### 4. 상호 동의 전 연락처 조회
- **요청**: pending 상태에서 연락처 조회
- **응답**: `400 Bad Request` - "상호 동의가 완료되지 않았습니다."

