const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Queue = require('../models/Queue');
const User = require('../models/User');

// 내 매칭 목록 조회 (로그인 필요)
router.get('/me', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const matches = await Match.find({
      $or: [{ user1: user_id }, { user2: user_id }]
    })
      .populate('user1', 'username user_id nationality gender age contact_method')
      .populate('user2', 'username user_id nationality gender age contact_method')
      .populate('place', '-__v')
      .select('-__v')
      .sort({ matchedAt: -1 });

    // 상태에 따라 연락처 정보 필터링
    const filteredMatches = matches.map(match => {
      const matchObj = match.toObject();
      const isUser1 = match.user1._id.toString() === user_id;
      const otherUser = isUser1 ? matchObj.user2 : matchObj.user1;

      // pending 상태면 연락처 제거
      if (match.status === 'pending') {
        if (isUser1) {
          delete matchObj.user2.contact_method;
        } else {
          delete matchObj.user1.contact_method;
        }
      }

      return matchObj;
    });

    res.json(filteredMatches);
  } catch (error) {
    console.error('Match 조회 오류:', error);
    res.status(500).json({ error: 'Match 조회 중 오류가 발생했습니다.' });
  }
});

// 특정 매칭 조회 (로그인 필요)
router.get('/:id', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const match = await Match.findOne({
      _id: req.params.id,
      $or: [{ user1: user_id }, { user2: user_id }]
    })
      .populate('user1', 'username user_id nationality gender age contact_method')
      .populate('user2', 'username user_id nationality gender age contact_method')
      .populate('place', '-__v')
      .select('-__v');

    if (!match) {
      return res.status(404).json({ error: 'Match를 찾을 수 없습니다.' });
    }

    // pending 상태면 연락처 제거
    const matchObj = match.toObject();
    const isUser1 = match.user1._id.toString() === user_id;
    
    if (match.status === 'pending') {
      if (isUser1) {
        delete matchObj.user2.contact_method;
      } else {
        delete matchObj.user1.contact_method;
      }
    }

    res.json(matchObj);
  } catch (error) {
    console.error('Match 조회 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '올바른 ID 형식이 아닙니다.' });
    }
    res.status(500).json({ error: 'Match 조회 중 오류가 발생했습니다.' });
  }
});

// 매칭 동의 (로그인 필요)
router.post('/:id/agree', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ error: 'Match를 찾을 수 없습니다.' });
    }

    // 본인의 매칭인지 확인
    const isUser1 = match.user1.toString() === user_id;
    const isUser2 = match.user2.toString() === user_id;

    if (!isUser1 && !isUser2) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 이미 동의한 경우
    if ((isUser1 && match.user1_agreed) || (isUser2 && match.user2_agreed)) {
      return res.status(400).json({ error: '이미 동의하셨습니다.' });
    }

    // 동의 처리
    if (isUser1) {
      match.user1_agreed = true;
    } else {
      match.user2_agreed = true;
    }

    // 둘 다 동의한 경우 - 연락처 자동 공개
    if (match.user1_agreed && match.user2_agreed) {
      match.status = 'both_agreed';
      match.contactSharedAt = new Date();
    }

    await match.save();

    // 둘 다 동의한 경우 상대방 연락처 정보 포함
    let response = {
      message: '동의가 완료되었습니다.',
      match
    };

    if (match.status === 'both_agreed') {
      const populatedMatch = await Match.findById(match._id)
        .populate('user1', 'username user_id nationality gender age contact_method')
        .populate('user2', 'username user_id nationality gender age contact_method');
      
      const otherUser = isUser1 ? populatedMatch.user2 : populatedMatch.user1;
      response.contact = {
        username: otherUser.username,
        user_id: otherUser.user_id,
        contact_method: otherUser.contact_method
      };
      response.message = '상호 동의가 완료되어 연락처가 공개되었습니다.';
    }

    res.json(response);
  } catch (error) {
    console.error('Match 동의 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '올바른 ID 형식이 아닙니다.' });
    }
    res.status(500).json({ error: 'Match 동의 중 오류가 발생했습니다.' });
  }
});

// 연락처 조회 (both_agreed 상태인 경우만)
router.get('/:id/contact', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const match = await Match.findById(req.params.id)
      .populate('user1', 'username user_id contact_method')
      .populate('user2', 'username user_id contact_method');

    if (!match) {
      return res.status(404).json({ error: 'Match를 찾을 수 없습니다.' });
    }

    // 본인의 매칭인지 확인
    const isUser1 = match.user1._id.toString() === user_id;
    const isUser2 = match.user2._id.toString() === user_id;

    if (!isUser1 && !isUser2) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // both_agreed 상태인지 확인
    if (match.status !== 'both_agreed') {
      return res.status(400).json({ error: '상호 동의가 완료되지 않았습니다.' });
    }

    // 상대방 연락처 정보 반환
    const otherUser = isUser1 ? match.user2 : match.user1;

    res.json({
      contact: {
        username: otherUser.username,
        user_id: otherUser.user_id,
        contact_method: otherUser.contact_method
      }
    });
  } catch (error) {
    console.error('연락처 조회 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '올바른 ID 형식이 아닙니다.' });
    }
    res.status(500).json({ error: '연락처 조회 중 오류가 발생했습니다.' });
  }
});

// 매칭 생성 (랜덤 매칭 로직)
router.post('/create', async (req, res) => {
  try {
    // 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const user_id = req.session.user.id;
    const { place_id } = req.body;

    if (!place_id) {
      return res.status(400).json({ error: 'Place ID를 입력해주세요.' });
    }

    // 현재 사용자의 active queue 확인
    const myQueue = await Queue.findOne({
      user: user_id,
      place: place_id,
      status: 'active'
    });

    if (!myQueue) {
      return res.status(400).json({ error: '해당 Place가 Queue에 없습니다.' });
    }

    // 같은 place의 다른 active queue 찾기 (자기 자신 제외, 이미 매칭된 사용자 제외)
    const existingMatches = await Match.find({
      place: place_id,
      $or: [{ user1: user_id }, { user2: user_id }],
      status: { $ne: 'rejected' }
    });

    const matchedUserIds = new Set();
    existingMatches.forEach(match => {
      matchedUserIds.add(match.user1.toString());
      matchedUserIds.add(match.user2.toString());
    });

    const otherQueues = await Queue.find({
      place: place_id,
      status: 'active',
      user: { $ne: user_id, $nin: Array.from(matchedUserIds) }
    }).populate('user');

    if (otherQueues.length === 0) {
      return res.status(404).json({ error: '매칭 가능한 사용자가 없습니다.' });
    }

    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * otherQueues.length);
    const matchedQueue = otherQueues[randomIndex];
    const matchedUserId = matchedQueue.user._id || matchedQueue.user;

    // Match 생성
    const match = new Match({
      user1: user_id,
      user2: matchedUserId,
      place: place_id,
      status: 'pending'
    });

    await match.save();

    // Queue 상태 업데이트
    myQueue.status = 'matched';
    matchedQueue.status = 'matched';
    await Promise.all([myQueue.save(), matchedQueue.save()]);

    // 매칭 정보 반환
    const populatedMatch = await Match.findById(match._id)
      .populate('user1', 'username user_id nationality gender age')
      .populate('user2', 'username user_id nationality gender age')
      .populate('place', '-__v');

    res.status(201).json({
      message: '매칭이 생성되었습니다.',
      match: populatedMatch
    });
  } catch (error) {
    console.error('매칭 생성 오류:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: '이미 매칭된 사용자입니다.' });
    }
    res.status(500).json({ error: '매칭 생성 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

