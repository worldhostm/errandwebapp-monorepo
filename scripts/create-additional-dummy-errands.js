const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/errandwebapp';

// 경기도 화성시 기준 좌표 (사용자 현재 위치)
const BASE_LOCATION = {
  lat: 37.1997,  // 화성시 중심
  lng: 126.8313
};

// 추가 더미 심부름 데이터 5개
const ADDITIONAL_ERRANDS = [
  {
    title: "세탁소에서 옷 찾아주세요",
    description: "병원 일정으로 세탁소에서 정장을 찾아올 수 없습니다. 대신 찾아다 주실 분을 구합니다.",
    category: "배송/픽업",
    reward: 6000,
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4시간 후
    lat: BASE_LOCATION.lat + 0.0015,  // 약 150m 북동쪽
    lng: BASE_LOCATION.lng + 0.0018,
    address: "경기도 화성시 동탄면 중심상가 101호"
  },
  {
    title: "노인분 병원 동행",
    description: "홀로 계신 할머니께서 정기검진을 받으셔야 합니다. 병원까지 동행해주실 분을 찾습니다.",
    category: "의료/건강",
    reward: 40000,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1일 후
    lat: BASE_LOCATION.lat - 0.002,  // 약 200m 남쪽
    lng: BASE_LOCATION.lng - 0.0015,
    address: "경기도 화성시 송산면 고정리 205-3"
  },
  {
    title: "자전거 수리점 방문",
    description: "자전거 타이어가 펑크났는데 바쁜 일정으로 수리점에 갈 수 없습니다. 대신 맡겨주세요.",
    category: "기술/수리",
    reward: 8000,
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6시간 후
    lat: BASE_LOCATION.lat + 0.003,  // 약 300m 북쪽
    lng: BASE_LOCATION.lng - 0.002,
    address: "경기도 화성시 우정읍 매향리 567-8"
  },
  {
    title: "반려동물 미용실 예약 및 동반",
    description: "말티즈 미용 예약이 있는데 갑작스런 출장으로 못가겠습니다. 함께 가주실 분 구합니다.",
    category: "펫케어",
    reward: 18000,
    deadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8시간 후
    lat: BASE_LOCATION.lat - 0.0025,  // 약 250m 남서쪽
    lng: BASE_LOCATION.lng + 0.003,
    address: "경기도 화성시 팔탄면 율암리 333-1"
  },
  {
    title: "새벽 농산물 시장 대행구매",
    description: "새벽 5시 농산물 시장에서 채소와 과일을 구매해주실 분을 찾습니다. 목록 드릴게요.",
    category: "쇼핑/구매",
    reward: 22000,
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12시간 후
    lat: BASE_LOCATION.lat + 0.0035,  // 약 350m 북동쪽
    lng: BASE_LOCATION.lng + 0.0025,
    address: "경기도 화성시 마도면 석교리 농협 앞"
  }
];

async function createAdditionalDummyErrands() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    const db = client.db();
    const errandsCollection = db.collection('errands');
    
    // 추가 더미 심부름 데이터 생성
    const errandsToInsert = ADDITIONAL_ERRANDS.map(errand => ({
      ...errand,
      location: {
        type: 'Point',
        coordinates: [errand.lng, errand.lat],  // MongoDB는 [lng, lat] 순서
        address: errand.address
      },
      status: 'pending',
      currency: 'KRW',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(), // 임시 사용자 ID
      images: [],
      requirements: []
    }));
    
    // lat, lng, address 필드 제거 (location에 포함됨)
    errandsToInsert.forEach(errand => {
      delete errand.lat;
      delete errand.lng;
      delete errand.address;
    });
    
    const result = await errandsCollection.insertMany(errandsToInsert);
    console.log(`${result.insertedCount}개의 추가 더미 심부름이 생성되었습니다.`);
    
    // 생성된 심부름 확인
    const count = await errandsCollection.countDocuments({ status: 'pending' });
    console.log(`현재 대기중인 심부름 총 ${count}개`);
    
    // 최근 생성된 심부름들 확인
    const recentErrands = await errandsCollection
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('최근 생성된 심부름들:');
    recentErrands.forEach((errand, index) => {
      console.log(`${index + 1}. ${errand.title} - ${errand.reward}원 (${errand.location.address})`);
    });
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  createAdditionalDummyErrands().catch(console.error);
}

module.exports = { createAdditionalDummyErrands, ADDITIONAL_ERRANDS };