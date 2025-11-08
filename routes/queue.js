const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Queue = require('../models/Queue');
const Place = require('../models/Place');

// Queue 추가 스키마
const addQueueSchema = Joi.object({
  place_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Place ID를 입력해주세요.'
    })
});

// Queue에 추가 (로그인 필요)
router.post('/', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // Joi 검증
    const { error, value } = addQueueSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { place_id } = value;
    const user_id = req.session.user.id;

    // Place 존재 확인
    const place = await Place.findById(place_id);
    if (!place) {
      return res.status(404).json({ error: 'Place를 찾을 수 없습니다.' });
    }

    // Queue에 추가 (중복 체크는 모델에서 처리)
    const queue = new Queue({
      user: user_id,
      place: place_id,
      status: 'active'
    });

    try {
      await queue.save();
      res.status(201).json({
        message: 'Queue에 추가되었습니다.',
        queue
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: '이미 Queue에 추가된 Place입니다.' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Queue 추가 오류:', error);
    res.status(500).json({ error: 'Queue 추가 중 오류가 발생했습니다.' });
  }
});

// 내 Queue 조회 (로그인 필요)
router.get('/me', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const queues = await Queue.find({ user: user_id })
      .populate('place', '-__v')
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json(queues);
  } catch (error) {
    console.error('Queue 조회 오류:', error);
    res.status(500).json({ error: 'Queue 조회 중 오류가 발생했습니다.' });
  }
});

// Queue에서 삭제 (로그인 필요)
router.delete('/:id', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const queue = await Queue.findOneAndDelete({
      _id: req.params.id,
      user: user_id
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue를 찾을 수 없습니다.' });
    }

    res.json({
      message: 'Queue에서 삭제되었습니다.',
      queue
    });
  } catch (error) {
    console.error('Queue 삭제 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '올바른 ID 형식이 아닙니다.' });
    }
    res.status(500).json({ error: 'Queue 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

