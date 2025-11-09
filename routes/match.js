const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Queue = require('../models/Queue');
const User = require('../models/User');
const Place = require('../models/Place');

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

// 매칭 요청 (랜덤 매칭 또는 큐 추가)
router.post('/request', async (req, res) => {
  try {
    // 1. 로그인 확인
    if (!req.session.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    const userId = req.session.user.id;
    const { place_id } = req.body;

    // 2. place_id 유효성 검사
    if (!place_id || !mongoose.Types.ObjectId.isValid(place_id)) {
      return res.status(400).json({ error: '올바른 Place ID를 입력해주세요.' });
    }

    // 3. 해당 장소에 대한 사용자의 활성 큐 또는 매칭이 있는지 확인
    const existingQueue = await Queue.findOne({ user: userId, place: place_id, status: 'active' });
    if (existingQueue) {
      return res.status(400).json({ error: '이미 이 장소의 매칭 대기열에 있습니다.' });
    }
    const existingMatch = await Match.findOne({
      place: place_id,
      $or: [{ user1: userId }, { user2: userId }],
      status: { $ne: 'rejected' }
    });
    if (existingMatch) {
      return res.status(400).json({ error: '이미 이 장소에 대한 매칭이 존재합니다.' });
    }

    // 4. 같은 장소의 대기열에서 다른 사용자 찾기
    const otherQueue = await Queue.findOne({
      place: place_id,
      status: 'active',
      user: { $ne: userId }
    });

    // 5. 다른 사용자가 있으면 매칭 생성
    if (otherQueue) {
      const matchedUserId = otherQueue.user;

      const newMatch = new Match({
        user1: userId,
        user2: matchedUserId,
        place: place_id,
      });
      await newMatch.save();

      // 상대방의 큐 상태 업데이트
      otherQueue.status = 'matched';
      await otherQueue.save();

      const populatedMatch = await Match.findById(newMatch._id)
        .populate('user1', 'username user_id nationality gender age')
        .populate('user2', 'username user_id nationality gender age')
        .populate('place', '-__v');

      return res.status(201).json({
        message: '매칭에 성공했습니다!',
        matched: true,
        match: populatedMatch
      });
    } else {
      // 6. 대기열에 다른 사용자가 없으면 현재 사용자를 큐에 추가
      const newQueue = new Queue({
        user: userId,
        place: place_id,
        status: 'active'
      });
      await newQueue.save();

      return res.status(200).json({
        message: '매칭 가능한 사용자가 없어 대기열에 추가되었습니다.',
        matched: false,
        queue: newQueue
      });
    }
  } catch (error) {
    console.error('매칭 요청 오류:', error);
    if (error.code === 11000) { // 중복 키 오류
      return res.status(400).json({ error: '이미 대기열에 있거나 매칭된 상태입니다.' });
    }
    res.status(500).json({ error: '매칭 요청 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

