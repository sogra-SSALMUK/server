require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('../models/Place');
const readline = require('readline');

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/login-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB 연결 성공');
  startInput();
})
.catch((err) => {
  console.error('MongoDB 연결 실패:', err);
  process.exit(1);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function startInput() {
  try {
    console.log('\n=== Place 데이터 입력 ===\n');
    
    const places = [];
    let continueInput = true;

    while (continueInput) {
      console.log(`\n[${places.length + 1}번째 Place 입력]`);
      
      const title = await question('행사 제목 (title): ');
      const addr = await question('주소 (addr): ');
      const stDateStr = await question('행사 시작 날짜 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm): ');
      const endDateStr = await question('행사 종료 날짜 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm): ');
      const latStr = await question('위도 (lat): ');
      const lngStr = await question('경도 (lng): ');
      const category = await question('카테고리 (category): ');
      const imageUrl = await question('이미지 URL (선택사항, Enter로 건너뛰기): ');

      // 날짜 파싱
      let st_date, end_date;
      if (stDateStr.includes(' ')) {
        st_date = new Date(stDateStr);
      } else {
        st_date = new Date(stDateStr + 'T00:00:00');
      }
      if (endDateStr.includes(' ')) {
        end_date = new Date(endDateStr);
      } else {
        end_date = new Date(endDateStr + 'T00:00:00');
      }

      // 숫자 변환
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      // 유효성 검사
      if (!title || !addr || !category) {
        console.log('❌ 필수 필드가 비어있습니다. 다시 입력해주세요.');
        continue;
      }

      if (isNaN(lat) || lat < -90 || lat > 90) {
        console.log('❌ 위도는 -90 ~ 90 사이의 숫자여야 합니다.');
        continue;
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        console.log('❌ 경도는 -180 ~ 180 사이의 숫자여야 합니다.');
        continue;
      }

      if (isNaN(st_date.getTime()) || isNaN(end_date.getTime())) {
        console.log('❌ 올바른 날짜 형식이 아닙니다.');
        continue;
      }

      const placeData = {
        title: title.trim(),
        addr: addr.trim(),
        st_date,
        end_date,
        lat,
        lng,
        category: category.trim()
      };

      // 이미지 URL이 있으면 추가
      if (imageUrl && imageUrl.trim()) {
        placeData.image = imageUrl.trim();
      }

      places.push(placeData);

      console.log('✅ Place 데이터가 추가되었습니다.');

      const more = await question('\n더 입력하시겠습니까? (y/n): ');
      if (more.toLowerCase() !== 'y' && more.toLowerCase() !== 'yes') {
        continueInput = false;
      }
    }

    if (places.length === 0) {
      console.log('\n입력된 데이터가 없습니다.');
      rl.close();
      process.exit(0);
    }

    // 데이터베이스에 저장
    console.log('\n데이터베이스에 저장 중...');
    const savedPlaces = await Place.insertMany(places);
    console.log(`\n✅ ${savedPlaces.length}개의 Place 데이터가 저장되었습니다.`);

    // 저장된 데이터 출력
    console.log('\n=== 저장된 Place 목록 ===');
    savedPlaces.forEach((place, index) => {
      console.log(`${index + 1}. ${place.title}`);
      console.log(`   주소: ${place.addr}`);
      console.log(`   시작 날짜: ${place.st_date.toLocaleString('ko-KR')}`);
      console.log(`   종료 날짜: ${place.end_date.toLocaleString('ko-KR')}`);
      console.log(`   위치: (${place.lat}, ${place.lng})`);
      console.log(`   카테고리: ${place.category}\n`);
    });

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    rl.close();
    process.exit(1);
  }
}

