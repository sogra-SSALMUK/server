const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const User = require('../models/User');

// 로그인 Rate Limiter (엄격)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: {
    error: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
  },
  skipSuccessfulRequests: true, // 성공한 요청은 카운트에서 제외
  standardHeaders: true,
  legacyHeaders: false,
});

// 회원가입 Rate Limiter (엄격)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3회 시도
  message: {
    error: '회원가입 시도 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Joi 검증 스키마
const registerSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.empty': '사용자명을 입력해주세요.',
      'string.min': '사용자명은 최소 3자 이상이어야 합니다.',
      'string.max': '사용자명은 최대 30자까지 가능합니다.',
      'any.required': '사용자명을 입력해주세요.'
    }),
  user_id: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': '사용자 ID를 입력해주세요.',
      'any.required': '사용자 ID를 입력해주세요.'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': '비밀번호를 입력해주세요.',
      'string.min': '비밀번호는 최소 6자 이상이어야 합니다.',
      'any.required': '비밀번호를 입력해주세요.'
    }),
  nationality: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': '국적을 입력해주세요.',
      'any.required': '국적을 입력해주세요.'
    }),
  gender: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': '성별을 입력해주세요.',
      'any.required': '성별을 입력해주세요.'
    }),
  age: Joi.number()
    .integer()
    .min(1)
    .max(150)
    .required()
    .messages({
      'number.base': '나이는 숫자여야 합니다.',
      'number.min': '나이는 1세 이상이어야 합니다.',
      'number.max': '나이는 150세 이하여야 합니다.',
      'any.required': '나이를 입력해주세요.'
    }),
  contact_method: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': '연락수단을 입력해주세요.',
      'any.required': '연락수단을 입력해주세요.'
    })
});

const loginSchema = Joi.object({
  username: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': '사용자명을 입력해주세요.',
      'any.required': '사용자명을 입력해주세요.'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': '비밀번호를 입력해주세요.',
      'any.required': '비밀번호를 입력해주세요.'
    })
});

// 회원가입
router.post('/register', registerLimiter, async (req, res) => {
  try {
    // Joi 검증
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, user_id, password, nationality, gender, age, contact_method } = value;

    // 중복 사용자 확인
    const existingUser = await User.findOne({ $or: [{ username }, { user_id }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: '이미 존재하는 사용자명입니다.' });
      }
      if (existingUser.user_id === user_id) {
        return res.status(400).json({ error: '이미 존재하는 사용자 ID입니다.' });
      }
    }

    // 새 사용자 생성
    const user = new User({ 
      username, 
      user_id, 
      password, 
      nationality, 
      gender, 
      age, 
      contact_method 
    });
    await user.save();

    res.status(201).json({ 
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user._id,
        username: user.username,
        user_id: user.user_id,
        nationality: user.nationality,
        gender: user.gender,
        age: user.age,
        contact_method: user.contact_method
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', loginLimiter, async (req, res) => {
  try {
    // Joi 검증
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password } = value;

    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 세션에 사용자 정보 저장
    req.session.user = {
      id: user._id.toString(),
      username: user.username
    };

    res.json({ 
      message: '로그인 성공',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 로그인 상태 확인
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ 
      loggedIn: true, 
      user: {
        id: req.session.user.id,
        username: req.session.user.username
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    res.json({ message: '로그아웃 성공' });
  });
});

module.exports = router;

