const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/errandwebapp';

// 경기도 화성시 기준 좌표 (사용자 현재 위치)
const BASE_LOCATION = {
  lat: 37.1997,  // 화성시 중심
  lng: 126.8313
};

// 더미 심부름 데이터
const DUMMY_ERRANDS = [
  {
    title: "편의점에서 택배 받아주세요",
    description: "CU편의점에서 택배를 대신 받아주실 분을 찾습니다. 무거운 물건은 아니고 소포 하나입니다.",
    category: "배송/픽업",
    reward: 5000,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후
    lat: BASE_LOCATION.lat + 0.002,  // 약 200m 북쪽
    lng: BASE_LOCATION.lng + 0.001,
    address: "경기도 화성시 향남읍 향남로 123"
  },
  {
    title: "강아지 산책 도우미",
    description: "퇴근이 늦어져서 강아지 산책을 시켜주실 분을 찾습니다. 골든 리트리버로 순하고 사람을 좋아해요.",
    category: "펫케어",
    reward: 15000,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1일 후
    lat: BASE_LOCATION.lat - 0.003,  // 약 300m 남쪽
    lng: BASE_LOCATION.lng - 0.002,
    address: "경기도 화성시 동탄1동 456번길"
  },
  {
    title: "마트에서 생필품 구매",
    description: "감기에 걸려서 외출이 어렵습니다. 홈플러스에서 우유, 달걀, 식빵, 감기약을 구매해주세요.",
    category: "쇼핑/구매",
    reward: 8000,
    deadline: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000), // 12시간 후
    lat: BASE_LOCATION.lat + 0.001,  // 약 100m 북쪽
    lng: BASE_LOCATION.lng + 0.003,
    address: "경기도 화성시 봉담읍 와우리 789"
  },
  {
    title: "아이 학원 픽업",
    description: "급한 일이 생겨서 초등학교 2학년 아이를 영어학원에서 집까지 데려다주실 분을 찾습니다.",
    category: "육아/돌봄",
    reward: 20000,
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4시간 후
    lat: BASE_LOCATION.lat - 0.001,  // 약 100m 남쪽
    lng: BASE_LOCATION.lng + 0.002,
    address: "경기도 화성시 남양읍 남양로 321"
  },
  {
    title: "컴퓨터 조립 도움",
    description: "컴퓨터 부품을 샀는데 조립하는 법을 모르겠습니다. 컴퓨터 조립 경험이 있으신 분의 도움이 필요해요.",
    category: "기술/수리",
    reward: 30000,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일 후
    lat: BASE_LOCATION.lat + 0.004,  // 약 400m 북쪽
    lng: BASE_LOCATION.lng - 0.001,
    address: "경기도 화성시 동탄2동 654번길"
  },
  {
    title: "카페에서 음료 픽업",
    description: "투썸플레이스에서 주문한 음료 6잔을 사무실로 배달해주세요. 차량 이용 가능하신 분 우대합니다.",
    category: "배송/픽업",
    reward: 7000,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2시간 후
    lat: BASE_LOCATION.lat - 0.002,  // 약 200m 남쪽
    lng: BASE_LOCATION.lng + 0.004,
    address: "경기도 화성시 병점동 987번지"
  },
  {
    title: "이삿짐 정리 도움",
    description: "원룸 이사 후 박스 정리와 가구 배치를 도와주실 분을 찾습니다. 2-3시간 정도 소요 예상됩니다.",
    category: "생활/청소",
    reward: 25000,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1일 후
    lat: BASE_LOCATION.lat + 0.003,  // 약 300m 북쪽
    lng: BASE_LOCATION.lng + 0.005,
    address: "경기도 화성시 능동 147-1"
  },
  {
    title: "병원 약 수령",
    description: "몸이 아파서 병원에 가지 못하겠습니다. 처방전으로 약국에서 약을 받아다 주실 분을 구합니다.",
    category: "의료/건강",
    reward: 10000,
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6시간 후
    lat: BASE_LOCATION.lat - 0.004,  // 약 400m 남쪽
    lng: BASE_LOCATION.lng - 0.003,
    address: "경기도 화성시 매송면 어천로 258"
  },
  {
    title: "꽃배달 대행",
    description: "어머니 생신이라 꽃집에서 미리 주문한 꽃다발을 받아서 배달해주세요. 꽃집에서 목적지까지 약 2km입니다.",
    category: "배송/픽업",
    reward: 12000,
    deadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8시간 후
    lat: BASE_LOCATION.lat + 0.005,  // 약 500m 북쪽
    lng: BASE_LOCATION.lng - 0.002,
    address: "경기도 화성시 진안동 369"
  },
  {
    title: "영어 과외 학생 구함",
    description: "중학생 영어 과외를 해주실 분을 찾습니다. 주 2회, 1회 2시간씩 수업해주세요.",
    category: "교육/과외",
    reward: 50000,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    lat: BASE_LOCATION.lat - 0.005,  // 약 500m 남쪽
    lng: BASE_LOCATION.lng + 0.003,
    address: "경기도 화성시 정남면 덕절로 741"
  }
];

async function createDummyErrands() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    const db = client.db();
    const errandsCollection = db.collection('errands');
    
    // 기존 더미 데이터가 있다면 삭제 (title로 구분)
    const existingTitles = DUMMY_ERRANDS.map(errand => errand.title);
    await errandsCollection.deleteMany({ 
      title: { $in: existingTitles } 
    });
    console.log('기존 더미 데이터를 삭제했습니다.');
    
    // 더미 심부름 데이터 생성
    const errandsToInsert = DUMMY_ERRANDS.map(errand => ({
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
      createdBy: new ObjectId(), // 임시 사용자 ID (실제로는 실제 사용자 ID 사용)
      images: [],
      requirements: []
    }));
    
    // lat, lng 필드 제거 (location.coordinates에 포함됨)
    errandsToInsert.forEach(errand => {
      delete errand.lat;
      delete errand.lng;
      delete errand.address; // location.address에 포함됨
    });
    
    const result = await errandsCollection.insertMany(errandsToInsert);
    console.log(`${result.insertedCount}개의 더미 심부름이 생성되었습니다.`);
    
    // 생성된 심부름 확인
    const count = await errandsCollection.countDocuments({ status: 'pending' });
    console.log(`현재 대기중인 심부름 총 ${count}개`);
    
    // 2dsphere 인덱스 생성 (위치 기반 검색을 위해)
    await errandsCollection.createIndex({ "location": "2dsphere" });
    console.log('위치 기반 인덱스가 생성되었습니다.');
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  createDummyErrands().catch(console.error);
}

module.exports = { createDummyErrands, DUMMY_ERRANDS };