import { User, Errand, Chat, Message } from '../types';
import { ERRAND_CATEGORIES as CONSTANTS_CATEGORIES } from '../constants';

// 서울 주요 지역 좌표 데이터 (위도, 경도)
export const SEOUL_LOCATIONS = {
  gangnam: {
    coordinates: [127.0276, 37.4979] as [number, number],
    address: "서울특별시 강남구 역삼동"
  },
  hongdae: {
    coordinates: [126.9240, 37.5563] as [number, number],
    address: "서울특별시 마포구 홍익동"
  },
  myeongdong: {
    coordinates: [126.9870, 37.5636] as [number, number],
    address: "서울특별시 중구 명동"
  },
  itaewon: {
    coordinates: [126.9944, 37.5348] as [number, number],
    address: "서울특별시 용산구 이태원동"
  },
  jongno: {
    coordinates: [126.9910, 37.5703] as [number, number],
    address: "서울특별시 종로구 종로1가"
  },
  gangbuk: {
    coordinates: [127.0256, 37.6369] as [number, number],
    address: "서울특별시 강북구 수유동"
  },
  songpa: {
    coordinates: [127.1058, 37.5145] as [number, number],
    address: "서울특별시 송파구 잠실동"
  },
  mapo: {
    coordinates: [126.9155, 37.5663] as [number, number],
    address: "서울특별시 마포구 공덕동"
  },
  seocho: {
    coordinates: [127.0317, 37.4838] as [number, number],
    address: "서울특별시 서초구 서초동"
  },
  yeongdeungpo: {
    coordinates: [126.8965, 37.5266] as [number, number],
    address: "서울특별시 영등포구 영등포동"
  }
};

// 동탄2신도시 주요 지역 좌표 데이터
export const DONGTAN2_LOCATIONS = {
  central_park: {
    coordinates: [127.0759, 37.2006] as [number, number],
    address: "경기도 화성시 동탄순환대로 중앙공원"
  },
  dongtan_station: {
    coordinates: [127.0748, 37.1987] as [number, number],
    address: "경기도 화성시 노작로 동탄역"
  },
  metapolis: {
    coordinates: [127.0801, 37.2019] as [number, number],
    address: "경기도 화성시 동탄대로 메타폴리스"
  },
  lotte_mart: {
    coordinates: [127.0732, 37.1995] as [number, number],
    address: "경기도 화성시 동탄대로 롯데마트"
  },
  banseok_elementary: {
    coordinates: [127.0785, 37.2031] as [number, number],
    address: "경기도 화성시 반석로 반석초등학교"
  },
  dongtan_lake_park: {
    coordinates: [127.0692, 37.2058] as [number, number],
    address: "경기도 화성시 동탄호수공원"
  },
  dongtan_complex: {
    coordinates: [127.0821, 37.1978] as [number, number],
    address: "경기도 화성시 동탄복합타운"
  },
  shindongtan_station: {
    coordinates: [127.0655, 37.2045] as [number, number],
    address: "경기도 화성시 신동탄역"
  },
  dongtan_hospital: {
    coordinates: [127.0812, 37.2003] as [number, number],
    address: "경기도 화성시 동탄의료센터"
  },
  dongtan_high_school: {
    coordinates: [127.0773, 37.2089] as [number, number],
    address: "경기도 화성시 동탄고등학교"
  }
};

// 카테고리 데이터 (한국어)
export const ERRAND_CATEGORIES_KO = [
  "배달/픽업",
  "청소",
  "쇼핑",
  "반려동물 돌봄",
  "이사/운반",
  "줄서기",
  "문서/업무",
  "기타"
];

// 샘플 사용자 데이터
export const SAMPLE_USERS: User[] = [
  {
    id: "user_001",
    email: "kim.minho@example.com",
    name: "김민호",
    phone: "010-1234-5678",
    avatar: "https://i.pravatar.cc/150?img=1",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.gangnam.coordinates,
      address: SEOUL_LOCATIONS.gangnam.address
    },
    rating: 4.8,
    totalErrands: 23,
    isVerified: true,
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-08-25T14:30:00Z')
  },
  {
    id: "user_002",
    email: "park.sujin@example.com",
    name: "박수진",
    phone: "010-2345-6789",
    avatar: "https://i.pravatar.cc/150?img=2",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.hongdae.coordinates,
      address: SEOUL_LOCATIONS.hongdae.address
    },
    rating: 4.9,
    totalErrands: 31,
    isVerified: true,
    createdAt: new Date('2024-02-10T11:20:00Z'),
    updatedAt: new Date('2024-08-30T16:45:00Z')
  },
  {
    id: "user_003",
    email: "lee.jiwon@example.com",
    name: "이지원",
    phone: "010-3456-7890",
    avatar: "https://i.pravatar.cc/150?img=3",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.myeongdong.coordinates,
      address: SEOUL_LOCATIONS.myeongdong.address
    },
    rating: 4.6,
    totalErrands: 18,
    isVerified: false,
    createdAt: new Date('2024-03-05T08:15:00Z'),
    updatedAt: new Date('2024-08-28T12:20:00Z')
  },
  {
    id: "user_004",
    email: "choi.youngho@example.com",
    name: "최영호",
    phone: "010-4567-8901",
    avatar: "https://i.pravatar.cc/150?img=4",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.itaewon.coordinates,
      address: SEOUL_LOCATIONS.itaewon.address
    },
    rating: 4.7,
    totalErrands: 42,
    isVerified: true,
    createdAt: new Date('2024-01-20T13:45:00Z'),
    updatedAt: new Date('2024-08-31T09:10:00Z')
  },
  {
    id: "user_005",
    email: "jung.minji@example.com",
    name: "정민지",
    phone: "010-5678-9012",
    avatar: "https://i.pravatar.cc/150?img=5",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.jongno.coordinates,
      address: SEOUL_LOCATIONS.jongno.address
    },
    rating: 4.5,
    totalErrands: 15,
    isVerified: true,
    createdAt: new Date('2024-04-12T15:30:00Z'),
    updatedAt: new Date('2024-08-29T11:55:00Z')
  },
  // 동탄2신도시 사용자들
  {
    id: "user_006",
    email: "han.sejin@example.com",
    name: "한세진",
    phone: "010-6789-0123",
    avatar: "https://i.pravatar.cc/150?img=6",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.central_park.coordinates,
      address: DONGTAN2_LOCATIONS.central_park.address
    },
    rating: 4.7,
    totalErrands: 28,
    isVerified: true,
    createdAt: new Date('2024-03-08T10:15:00Z'),
    updatedAt: new Date('2024-08-30T18:20:00Z')
  },
  {
    id: "user_007",
    email: "oh.yuna@example.com",
    name: "오유나",
    phone: "010-7890-1234",
    avatar: "https://i.pravatar.cc/150?img=7",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_station.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_station.address
    },
    rating: 4.9,
    totalErrands: 35,
    isVerified: true,
    createdAt: new Date('2024-02-20T14:30:00Z'),
    updatedAt: new Date('2024-08-31T12:45:00Z')
  },
  {
    id: "user_008",
    email: "kwon.jihoon@example.com",
    name: "권지훈",
    phone: "010-8901-2345",
    avatar: "https://i.pravatar.cc/150?img=8",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.metapolis.coordinates,
      address: DONGTAN2_LOCATIONS.metapolis.address
    },
    rating: 4.4,
    totalErrands: 12,
    isVerified: false,
    createdAt: new Date('2024-05-15T09:45:00Z'),
    updatedAt: new Date('2024-08-28T15:30:00Z')
  },
  {
    id: "user_009",
    email: "song.hyewon@example.com",
    name: "송혜원",
    phone: "010-9012-3456",
    avatar: "https://i.pravatar.cc/150?img=9",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.lotte_mart.coordinates,
      address: DONGTAN2_LOCATIONS.lotte_mart.address
    },
    rating: 4.6,
    totalErrands: 19,
    isVerified: true,
    createdAt: new Date('2024-04-03T16:20:00Z'),
    updatedAt: new Date('2024-08-29T13:10:00Z')
  },
  {
    id: "user_010",
    email: "jang.minsoo@example.com",
    name: "장민수",
    phone: "010-0123-4567",
    avatar: "https://i.pravatar.cc/150?img=10",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_lake_park.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_lake_park.address
    },
    rating: 4.8,
    totalErrands: 41,
    isVerified: true,
    createdAt: new Date('2024-01-25T11:00:00Z'),
    updatedAt: new Date('2024-08-31T17:15:00Z')
  }
];

// 샘플 심부름 데이터
export const SAMPLE_ERRANDS: Errand[] = [
  {
    id: "errand_001",
    title: "강남역 스타벅스 커피 픽업",
    description: "강남역 2번 출구 스타벅스에서 아메리카노 2잔 픽업 후 사무실로 배달해주세요. 결제는 선결제 완료되었습니다.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.gangnam.coordinates,
      address: "서울특별시 강남구 강남대로 지하 396"
    },
    reward: 8000,
    currency: 'KRW',
    requestedBy: "user_001",
    acceptedBy: "user_002",
    status: 'in_progress',
    category: "배달/픽업",
    deadline: new Date('2024-08-31T16:00:00Z'),
    images: ["https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400"],
    requirements: ["차량 보유", "음료 배달 경험"],
    createdAt: new Date('2024-08-31T09:30:00Z'),
    updatedAt: new Date('2024-08-31T10:15:00Z')
  },
  {
    id: "errand_002",
    title: "홍대 원룸 청소",
    description: "홍대 근처 원룸 전체 청소 부탁드립니다. 화장실, 부엌, 방 정리정돈 및 청소기 돌리기 포함입니다.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.hongdae.coordinates,
      address: "서울특별시 마포구 와우산로 123"
    },
    reward: 45000,
    currency: 'KRW',
    requestedBy: "user_002",
    status: 'pending',
    category: "청소",
    deadline: new Date('2024-09-02T18:00:00Z'),
    images: ["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"],
    requirements: ["청소도구 지참", "3시간 이상 작업 가능"],
    createdAt: new Date('2024-08-30T14:20:00Z'),
    updatedAt: new Date('2024-08-30T14:20:00Z')
  },
  {
    id: "errand_003",
    title: "명동 백화점 선물 구매",
    description: "어머니 생신 선물로 화장품 구매해주세요. 브랜드와 제품명 상세 전달 예정입니다.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.myeongdong.coordinates,
      address: "서울특별시 중구 명동길 52"
    },
    reward: 25000,
    currency: 'KRW',
    requestedBy: "user_003",
    acceptedBy: "user_004",
    status: 'accepted',
    category: "쇼핑",
    deadline: new Date('2024-09-01T20:00:00Z'),
    images: ["https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400"],
    requirements: ["쇼핑 경험", "영수증 보관"],
    createdAt: new Date('2024-08-30T16:45:00Z'),
    updatedAt: new Date('2024-08-31T08:30:00Z')
  },
  {
    id: "errand_004",
    title: "이태원 반려견 산책",
    description: "골든리트리버 1마리 1시간 산책 부탁드립니다. 온순한 성격이고 목줄 잘 당기지 않아요.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.itaewon.coordinates,
      address: "서울특별시 용산구 이태원로 200"
    },
    reward: 15000,
    currency: 'KRW',
    requestedBy: "user_004",
    status: 'pending',
    category: "반려동물 돌봄",
    deadline: new Date('2024-08-31T19:00:00Z'),
    images: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"],
    requirements: ["반려동물 케어 경험", "1시간 이상 산책 가능"],
    createdAt: new Date('2024-08-31T07:00:00Z'),
    updatedAt: new Date('2024-08-31T07:00:00Z')
  },
  {
    id: "errand_005",
    title: "종로 서류 배달",
    description: "회사 계약서를 종로구청에 제출해주세요. 봉인된 서류이므로 안전하게 배달 부탁드립니다.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.jongno.coordinates,
      address: "서울특별시 종로구 종로 1"
    },
    reward: 12000,
    currency: 'KRW',
    requestedBy: "user_005",
    acceptedBy: "user_001",
    status: 'completed',
    category: "문서/업무",
    deadline: new Date('2024-08-30T17:00:00Z'),
    requirements: ["신분증 지참", "정시 배달"],
    createdAt: new Date('2024-08-29T10:30:00Z'),
    updatedAt: new Date('2024-08-30T16:45:00Z')
  },
  {
    id: "errand_006",
    title: "강북 아이폰 줄서기",
    description: "강북 애플스토어에서 신제품 출시일에 줄서기 부탁드립니다. 오전 6시부터 매장 오픈까지.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.gangbuk.coordinates,
      address: "서울특별시 강북구 도봉로 지하 1"
    },
    reward: 80000,
    currency: 'KRW',
    requestedBy: "user_001",
    status: 'pending',
    category: "줄서기",
    deadline: new Date('2024-09-05T10:00:00Z'),
    requirements: ["새벽 근무 가능", "장시간 대기 가능"],
    createdAt: new Date('2024-08-31T11:00:00Z'),
    updatedAt: new Date('2024-08-31T11:00:00Z')
  },
  {
    id: "errand_007",
    title: "송파 이삿짐 정리",
    description: "원룸에서 투룸으로 이사 후 박스 정리 및 가구 배치 도움이 필요합니다.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.songpa.coordinates,
      address: "서울특별시 송파구 잠실로 200"
    },
    reward: 60000,
    currency: 'KRW',
    requestedBy: "user_002",
    status: 'pending',
    category: "이사/운반",
    deadline: new Date('2024-09-03T18:00:00Z'),
    images: ["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"],
    requirements: ["체력 좋은 분", "4시간 이상 작업 가능"],
    createdAt: new Date('2024-08-31T12:30:00Z'),
    updatedAt: new Date('2024-08-31T12:30:00Z')
  },
  {
    id: "errand_008",
    title: "마포 마트 장보기",
    description: "홈플러스에서 생필품 20여 가지 구매 후 집까지 배달해주세요. 리스트 전달 예정입니다.",
    location: {
      type: 'Point',
      coordinates: SEOUL_LOCATIONS.mapo.coordinates,
      address: "서울특별시 마포구 마포대로 99"
    },
    reward: 22000,
    currency: 'KRW',
    requestedBy: "user_003",
    status: 'pending',
    category: "쇼핑",
    deadline: new Date('2024-09-01T14:00:00Z'),
    requirements: ["장보기 경험", "차량 또는 카트 이용 가능"],
    createdAt: new Date('2024-08-31T13:15:00Z'),
    updatedAt: new Date('2024-08-31T13:15:00Z')
  },
  // 동탄2신도시 심부름들
  {
    id: "errand_009",
    title: "동탄 중앙공원 반려견 산책",
    description: "푸들 2마리 1시간 30분 산책 부탁드립니다. 공원 내 산책로 이용하며, 배변봉투 제공됩니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.central_park.coordinates,
      address: DONGTAN2_LOCATIONS.central_park.address
    },
    reward: 18000,
    currency: 'KRW',
    requestedBy: "user_006",
    acceptedBy: "user_007",
    status: 'in_progress',
    category: "반려동물 돌봄",
    deadline: new Date('2024-09-01T18:00:00Z'),
    images: ["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"],
    requirements: ["반려동물 경험", "1시간 이상 산책 가능"],
    createdAt: new Date('2024-08-31T14:00:00Z'),
    updatedAt: new Date('2024-08-31T15:30:00Z')
  },
  {
    id: "errand_010",
    title: "동탄역 택배 픽업",
    description: "동탄역 택배보관함에서 대형 택배 픽업 후 아파트까지 배달해주세요. 무게 약 15kg입니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_station.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_station.address
    },
    reward: 15000,
    currency: 'KRW',
    requestedBy: "user_007",
    status: 'pending',
    category: "배달/픽업",
    deadline: new Date('2024-09-01T20:00:00Z'),
    requirements: ["차량 보유", "중량물 운반 가능"],
    createdAt: new Date('2024-08-31T16:45:00Z'),
    updatedAt: new Date('2024-08-31T16:45:00Z')
  },
  {
    id: "errand_011",
    title: "메타폴리스 사무실 청소",
    description: "메타폴리스 내 사무실 청소 부탁드립니다. 사무실 3개실, 화장실 1개 포함입니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.metapolis.coordinates,
      address: DONGTAN2_LOCATIONS.metapolis.address
    },
    reward: 55000,
    currency: 'KRW',
    requestedBy: "user_008",
    status: 'pending',
    category: "청소",
    deadline: new Date('2024-09-02T17:00:00Z'),
    requirements: ["청소도구 지참", "3시간 이상 작업"],
    createdAt: new Date('2024-08-30T19:20:00Z'),
    updatedAt: new Date('2024-08-30T19:20:00Z')
  },
  {
    id: "errand_012",
    title: "롯데마트 생필품 구매",
    description: "롯데마트에서 생필품 구매 리스트 따라 쇼핑해주세요. 약 30만원 상당의 생필품입니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.lotte_mart.coordinates,
      address: DONGTAN2_LOCATIONS.lotte_mart.address
    },
    reward: 35000,
    currency: 'KRW',
    requestedBy: "user_009",
    acceptedBy: "user_010",
    status: 'accepted',
    category: "쇼핑",
    deadline: new Date('2024-09-01T15:00:00Z'),
    requirements: ["쇼핑 경험", "대용량 운반 가능"],
    createdAt: new Date('2024-08-31T08:30:00Z'),
    updatedAt: new Date('2024-08-31T11:20:00Z')
  },
  {
    id: "errand_013",
    title: "동탄호수공원 운동기구 조립",
    description: "집에서 구매한 운동기구를 공원 근처 집에서 조립해주세요. 헬스바이크 1대입니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_lake_park.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_lake_park.address
    },
    reward: 25000,
    currency: 'KRW',
    requestedBy: "user_010",
    status: 'pending',
    category: "기타",
    deadline: new Date('2024-09-03T16:00:00Z'),
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    requirements: ["조립 경험", "공구 사용 가능"],
    createdAt: new Date('2024-08-31T17:10:00Z'),
    updatedAt: new Date('2024-08-31T17:10:00Z')
  },
  {
    id: "errand_014",
    title: "동탄복합타운 신발 수선",
    description: "복합타운 내 구두수선점에 구두 맡기고 완료되면 픽업해주세요. 3일 정도 소요예정입니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_complex.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_complex.address
    },
    reward: 8000,
    currency: 'KRW',
    requestedBy: "user_006",
    status: 'pending',
    category: "기타",
    deadline: new Date('2024-09-05T18:00:00Z'),
    requirements: ["3일 후 픽업 가능"],
    createdAt: new Date('2024-08-31T18:00:00Z'),
    updatedAt: new Date('2024-08-31T18:00:00Z')
  },
  {
    id: "errand_015",
    title: "신동탄역 서류 배달",
    description: "중요 계약서류를 신동탄역 근처 사무실로 배달해주세요. 직접 전달 필요합니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.shindongtan_station.coordinates,
      address: DONGTAN2_LOCATIONS.shindongtan_station.address
    },
    reward: 12000,
    currency: 'KRW',
    requestedBy: "user_007",
    acceptedBy: "user_008",
    status: 'completed',
    category: "문서/업무",
    deadline: new Date('2024-08-30T16:00:00Z'),
    requirements: ["신분증 지참", "직접 전달"],
    createdAt: new Date('2024-08-29T13:45:00Z'),
    updatedAt: new Date('2024-08-30T15:30:00Z')
  },
  {
    id: "errand_016",
    title: "동탄의료센터 진료 대기",
    description: "어머니 대신 의료센터에서 진료 순서 대기 및 처방전 픽업해주세요.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_hospital.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_hospital.address
    },
    reward: 20000,
    currency: 'KRW',
    requestedBy: "user_009",
    status: 'pending',
    category: "줄서기",
    deadline: new Date('2024-09-02T11:00:00Z'),
    requirements: ["장시간 대기 가능", "의료기관 방문 경험"],
    createdAt: new Date('2024-08-31T19:15:00Z'),
    updatedAt: new Date('2024-08-31T19:15:00Z')
  },
  {
    id: "errand_017",
    title: "동탄고등학교 앞 아이 픽업",
    description: "방과후 수업 끝난 고등학생 픽업 후 학원까지 안전하게 데려다주세요.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.dongtan_high_school.coordinates,
      address: DONGTAN2_LOCATIONS.dongtan_high_school.address
    },
    reward: 15000,
    currency: 'KRW',
    requestedBy: "user_008",
    status: 'pending',
    category: "기타",
    deadline: new Date('2024-09-01T17:30:00Z'),
    requirements: ["신원확인 가능", "차량 보유"],
    createdAt: new Date('2024-08-31T20:00:00Z'),
    updatedAt: new Date('2024-08-31T20:00:00Z')
  },
  {
    id: "errand_018",
    title: "동탄 아파트 이사 도움",
    description: "투룸에서 쓰리룸으로 이사 시 짐 옮기기 도움 및 정리 작업 부탁드립니다.",
    location: {
      type: 'Point',
      coordinates: DONGTAN2_LOCATIONS.central_park.coordinates,
      address: "경기도 화성시 동탄순환대로 힐스테이트 아파트"
    },
    reward: 80000,
    currency: 'KRW',
    requestedBy: "user_010",
    status: 'pending',
    category: "이사/운반",
    deadline: new Date('2024-09-04T16:00:00Z'),
    images: ["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"],
    requirements: ["체력 좋은 분", "5시간 이상 작업 가능", "이사 경험"],
    createdAt: new Date('2024-08-31T21:30:00Z'),
    updatedAt: new Date('2024-08-31T21:30:00Z')
  }
];

// 샘플 채팅 메시지
export const SAMPLE_MESSAGES: Message[] = [
  {
    id: "msg_001",
    sender: "user_002",
    content: "안녕하세요! 커피 픽업 건으로 연락드렸습니다.",
    timestamp: new Date('2024-08-31T10:00:00Z'),
    messageType: 'text',
    isRead: true
  },
  {
    id: "msg_002", 
    sender: "user_001",
    content: "네 안녕하세요! 픽업 장소는 강남역 2번 출구 스타벅스 맞죠?",
    timestamp: new Date('2024-08-31T10:02:00Z'),
    messageType: 'text',
    isRead: true
  },
  {
    id: "msg_003",
    sender: "user_002", 
    content: "맞습니다. 아메리카노 2잔이고 결제는 완료되어있어요.",
    timestamp: new Date('2024-08-31T10:03:00Z'),
    messageType: 'text',
    isRead: true
  },
  {
    id: "msg_004",
    sender: "user_001",
    content: "사무실 주소 다시 한번 알려주세요!",
    timestamp: new Date('2024-08-31T10:15:00Z'),
    messageType: 'text',
    isRead: false
  }
];

// 샘플 채팅
export const SAMPLE_CHATS: Chat[] = [
  {
    id: "chat_001",
    errand: "errand_001",
    participants: ["user_001", "user_002"],
    messages: SAMPLE_MESSAGES,
    lastMessage: SAMPLE_MESSAGES[SAMPLE_MESSAGES.length - 1],
    createdAt: new Date('2024-08-31T10:00:00Z'),
    updatedAt: new Date('2024-08-31T10:15:00Z')
  }
];

// 지역별 인기 카테고리
export const POPULAR_CATEGORIES_BY_LOCATION = {
  gangnam: ["배달/픽업", "문서/업무", "쇼핑"],
  hongdae: ["청소", "이사/운반", "기타"],
  myeongdong: ["쇼핑", "배달/픽업", "줄서기"],
  itaewon: ["반려동물 돌봄", "청소", "배달/픽업"],
  jongno: ["문서/업무", "배달/픽업", "기타"]
};

// 시간대별 심부름 요청 패턴
export const REQUEST_PATTERNS = {
  morning: { // 06:00-12:00
    categories: ["배달/픽업", "쇼핑", "문서/업무"],
    peakHour: "09:00"
  },
  afternoon: { // 12:00-18:00  
    categories: ["청소", "이사/운반", "반려동물 돌봄"],
    peakHour: "15:00"
  },
  evening: { // 18:00-24:00
    categories: ["배달/픽업", "쇼핑", "줄서기"],
    peakHour: "19:00"
  }
};