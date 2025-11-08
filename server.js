require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const placeRoutes = require('./routes/places');
const queueRoutes = require('./routes/queue');
const matchRoutes = require('./routes/match');

const app = express();
const PORT = process.env.PORT || 3000;

// 기본 Rate Limiter (모든 API에 적용)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
});

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (이미지)
app.use('/uploads', express.static('uploads'));

// Rate Limiter 적용
app.use('/api/', generalLimiter);

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/login-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB 연결 성공');
})
.catch((err) => {
  console.error('MongoDB 연결 실패:', err);
});

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/match', matchRoutes);

// 테스트 라우트
app.get('/', (req, res) => {
  res.json({ message: '서버가 정상적으로 실행 중입니다.' });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

