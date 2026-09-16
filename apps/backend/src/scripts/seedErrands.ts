/**
 * 청계동 근처 mock 심부름 데이터 시드 스크립트
 * 실행: npx ts-node src/scripts/seedErrands.ts
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/errandwebapp'

// 청계동 중심 좌표
const CENTER = { lat: 37.1982115590239, lng: 127.118473726893 }

// 중심에서 km 오프셋으로 좌표 생성 (1도 ≈ 111km)
const offset = (km: number) => km / 111

const mockErrands = [
  {
    title: '편의점 심부름',
    description: 'GS25에서 삼각김밥 2개, 컵라면 1개 사다 주세요. 구체적인 제품 종류는 아무거나 괜찮아요.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng + offset(0.3), CENTER.lat + offset(0.2)],
      address: '경기도 화성시 청계동 123',
    },
    reward: 5000,
    category: '쇼핑',
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
  },
  {
    title: '택배 수령 부탁드려요',
    description: '오후 2~5시 사이 택배 수령 부탁드립니다. 경비실에 맡겨도 됩니다.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng - offset(0.5), CENTER.lat + offset(0.4)],
      address: '경기도 화성시 청계동 456',
    },
    reward: 8000,
    category: '배달',
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000),
  },
  {
    title: '강아지 산책 30분',
    description: '말티즈 소형견입니다. 순해서 산책하기 어렵지 않아요. 30분 정도 동네 한 바퀴 부탁드려요.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng + offset(0.7), CENTER.lat - offset(0.3)],
      address: '경기도 화성시 청계동 789',
    },
    reward: 12000,
    category: '반려동물',
    deadline: new Date(Date.now() + 3 * 60 * 60 * 1000),
  },
  {
    title: '마트 장보기 대행',
    description: '이마트 가셔서 목록대로 사다 주시면 됩니다. 목록은 채팅으로 보내드릴게요. 영수증 지참 부탁요.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng - offset(1.0), CENTER.lat - offset(0.6)],
      address: '경기도 화성시 청계동 321',
    },
    reward: 15000,
    category: '쇼핑',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
  },
  {
    title: '문서 출력 및 전달',
    description: '프린터가 고장났어요. A4 5장 흑백 출력해서 청계동 주민센터 앞으로 가져다 주시면 됩니다.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng + offset(0.2), CENTER.lat - offset(0.8)],
      address: '경기도 화성시 청계동 654',
    },
    reward: 6000,
    category: '기타',
    deadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
  },
  {
    title: '음식 배달 대행',
    description: '맥도날드 빅맥세트 2개 픽업해서 가져다 주세요. 결제는 카드로 해주시면 바로 송금해드릴게요.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng - offset(0.4), CENTER.lat + offset(1.1)],
      address: '경기도 화성시 청계동 987',
    },
    reward: 10000,
    category: '음식',
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000),
  },
  {
    title: '가구 조립 도움',
    description: '이케아 책상 조립 도와주실 분 구합니다. 공구는 있어요. 1시간 정도 예상합니다.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng + offset(1.2), CENTER.lat + offset(0.9)],
      address: '경기도 화성시 청계동 147',
    },
    reward: 25000,
    category: '생활',
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000),
  },
  {
    title: '세탁물 세탁소 맡기기',
    description: '드라이클리닝 맡겨야 하는데 시간이 없어요. 청계동 세탁소에 맡기고 영수증만 찍어서 보내주세요.',
    location: {
      type: 'Point' as const,
      coordinates: [CENTER.lng - offset(0.8), CENTER.lat - offset(0.2)],
      address: '경기도 화성시 청계동 258',
    },
    reward: 7000,
    category: '생활',
    deadline: new Date(Date.now() + 3.5 * 60 * 60 * 1000),
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ MongoDB 연결 완료')

  const db = mongoose.connection.db!

  // 시드용 임시 유저 생성 또는 기존 유저 사용
  const usersCollection = db.collection('users')
  let seedUser = await usersCollection.findOne({ email: 'seed@mock.local' })

  if (!seedUser) {
    const result = await usersCollection.insertOne({
      email: 'seed@mock.local',
      name: '테스트 유저',
      password: 'hashed_password_placeholder',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    seedUser = { _id: result.insertedId }
    console.log('👤 시드 유저 생성')
  } else {
    console.log('👤 기존 시드 유저 재사용')
  }

  const errandsCollection = db.collection('errands')

  // 기존 mock 데이터 제거
  const deleted = await errandsCollection.deleteMany({ requestedBy: seedUser._id })
  console.log(`🗑️  기존 시드 데이터 ${deleted.deletedCount}개 삭제`)

  const now = new Date()
  const docs = mockErrands.map(e => ({
    ...e,
    requestedBy: seedUser!._id,
    status: 'pending',
    currency: 'KRW',
    createdAt: now,
    updatedAt: now,
  }))

  const inserted = await errandsCollection.insertMany(docs)
  console.log(`🎉 심부름 ${inserted.insertedCount}개 삽입 완료`)

  await mongoose.disconnect()
  console.log('🔌 연결 종료')
}

seed().catch(err => {
  console.error('❌ 시드 실패:', err)
  process.exit(1)
})
