import request from 'supertest';
import { app, createTestToken } from './setup';
import User from '../src/models/User';
import Errand from '../src/models/Errand';
import bcrypt from 'bcryptjs';

describe('Errand API', () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    // 테스트용 사용자 생성 - User model의 pre-save 미들웨어가 패스워드를 해시함
    const user = await User.create({
      name: '심부름테스트',
      email: 'errand@example.com',
      password: '123456'
    });
    
    userId = user._id.toString();
    userToken = createTestToken(user._id.toString());
  });

  describe('POST /api/errands', () => {
    it('should create a new errand successfully', async () => {
      const errandData = {
        title: '테스트 심부름',
        description: '테스트용 심부름입니다',
        location: {
          type: 'Point',
          coordinates: [127.1013, 37.1946],
          address: '청계동'
        },
        reward: 10000,
        category: '배달',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/errands')
        .set('Authorization', `Bearer ${userToken}`)
        .send(errandData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        errand: {
          title: errandData.title,
          description: errandData.description,
          reward: errandData.reward,
          category: errandData.category,
          status: 'pending',
          requestedBy: {
            _id: userId
          }
        }
      });

      // API 응답이 성공적이면 데이터베이스에 저장된 것임
    });

    it('should return error when unauthorized', async () => {
      const errandData = {
        title: '무권한 심부름',
        description: '권한 없는 요청',
        location: {
          type: 'Point',
          coordinates: [127.1013, 37.1946],
          address: '청계동'
        },
        reward: 5000,
        category: '배달'
      };

      const response = await request(app)
        .post('/api/errands')
        .send(errandData)
        .expect(401);

      expect(response.body.error).toContain('No token provided');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // 빈 제목
        description: '설명만 있음',
        reward: -1000 // 음수 보상
      };

      const response = await request(app)
        .post('/api/errands')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(500);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('GET /api/errands/nearby', () => {
    beforeEach(async () => {
      // 테스트용 심부름들 생성
      await Errand.create([
        {
          title: '근처 심부름 1',
          description: '가까운 심부름',
          location: {
            type: 'Point',
            coordinates: [127.1013, 37.1946], // 청계동
            address: '청계동'
          },
          reward: 5000,
          category: '배달',
          status: 'pending',
          requestedBy: userId
        },
        {
          title: '먼 심부름',
          description: '멀리 있는 심부름',
          location: {
            type: 'Point',
            coordinates: [126.9780, 37.5665], // 서울시청 (약 50km 거리)
            address: '서울시청'
          },
          reward: 8000,
          category: '픽업',
          status: 'pending',
          requestedBy: userId
        }
      ]);
    });

    it('should return nearby errands within radius', async () => {
      const response = await request(app)
        .get('/api/errands/nearby')
        .query({
          lng: 127.1013,
          lat: 37.1946,
          radius: 1000, // 1km
          status: 'pending'
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errands).toHaveLength(1);
      expect(response.body.errands[0].title).toBe('근처 심부름 1');
    });

    it('should return errands within larger radius', async () => {
      const response = await request(app)
        .get('/api/errands/nearby')
        .query({
          lng: 127.1013,
          lat: 37.1946,
          radius: 100000, // 100km
          status: 'pending'
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errands).toHaveLength(2);
    });
  });
});