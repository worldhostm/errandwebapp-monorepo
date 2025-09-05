import request from 'supertest';
import { app, createTestToken } from './setup';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: '테스트사용자',
        email: 'test@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          name: userData.name,
          email: userData.email
        },
        token: expect.any(String)
      });

      // 비밀번호가 해시되어 저장되었는지 확인
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user!.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user!.password)).toBe(true);
    });

    it('should return error for duplicate email', async () => {
      // 첫 번째 사용자 생성
      await request(app)
        .post('/api/auth/register')
        .send({
          name: '첫번째사용자',
          email: 'duplicate@example.com',
          password: '123456'
        });

      // 같은 이메일로 두 번째 사용자 생성 시도
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '두번째사용자',
          email: 'duplicate@example.com',
          password: '123456'
        })
        .expect(400);

      expect(response.body.error).toContain('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 테스트용 사용자 생성 - User model의 pre-save 미들웨어가 패스워드를 해시함
      await User.create({
        name: '로그인테스트',
        email: 'login@example.com',
        password: '123456'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: '123456'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          name: '로그인테스트',
          email: 'login@example.com'
        },
        token: expect.any(String)
      });
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: '123456'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});