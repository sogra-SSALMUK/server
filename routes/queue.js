const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Queue = require('../models/Queue');
const Place = require('../models/Place');

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

