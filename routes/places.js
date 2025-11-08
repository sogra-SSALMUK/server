const express = require('express');
const router = express.Router();
const Place = require('../models/Place');
const upload = require('../middleware/upload');
const path = require('path');

// 전체 Place 조회
router.get('/', async (req, res) => {
  try {
    const places = await Place.find().select('-__v');
    res.json(places);
  } catch (error) {
    console.error('Place 조회 오류:', error);
    res.status(500).json({ error: 'Place 조회 중 오류가 발생했습니다.' });
  }
});

// 특정 Place 조회
router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id).select('-__v');
    
    if (!place) {
      return res.status(404).json({ error: 'Place를 찾을 수 없습니다.' });
    }

    res.json(place);
  } catch (error) {
    console.error('Place 조회 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: '올바른 ID 형식이 아닙니다.' });
    }
    res.status(500).json({ error: 'Place 조회 중 오류가 발생했습니다.' });
  }
});

// 이미지 업로드
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일을 업로드해주세요.' });
    }

    // 이미지 URL 반환
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: '이미지가 업로드되었습니다.',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
