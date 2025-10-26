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

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '테스트사용자',
          email: 'invalid-email',
          password: '123456'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('valid email');
    });

    it('should return validation error for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '테스트사용자',
          email: 'test@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('at least 6 characters');
    });

    it('should return validation error for short name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '김',
          email: 'test@example.com',
          password: '123456'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('at least 2 characters');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '테스트사용자'
          // email과 password 누락
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should register user with phone number', async () => {
      const userData = {
        name: '전화번호있는사용자',
        email: 'phone@example.com',
        password: '123456',
        phone: '010-1234-5678'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone
        }
      });

      const user = await User.findOne({ email: userData.email });
      expect(user!.phone).toBe(userData.phone);
    });

    it('should normalize email to lowercase', async () => {
      const userData = {
        name: '테스트사용자',
        email: 'TEST@EXAMPLE.COM',
        password: '123456'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email.toLowerCase() });
      expect(user).toBeTruthy();
      expect(user!.email).toBe(userData.email.toLowerCase());
    });

    it('should initialize default user values', async () => {
      const userData = {
        name: '테스트사용자',
        email: 'defaults@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email });
      expect(user!.rating).toBe(5.0);
      expect(user!.totalErrands).toBe(0);
      expect(user!.isVerified).toBe(false);
    });

    it('should return JWT token that can be verified', async () => {
      const userData = {
        name: '테스트사용자',
        email: 'token@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');

      // 토큰이 유효한 JWT 형식인지 확인
      const parts = response.body.token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should trim whitespace from name', async () => {
      const userData = {
        name: '  테스트사용자  ',
        email: 'trim@example.com',
        password: '123456'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email });
      expect(user!.name).toBe('테스트사용자');
    });

    it('should handle concurrent registration requests properly', async () => {
      const userData = {
        name: '동시테스트사용자',
        email: 'concurrent@example.com',
        password: '123456'
      };

      // 동일한 이메일로 동시에 2개의 요청 전송
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/auth/register')
          .send(userData),
        request(app)
          .post('/api/auth/register')
          .send(userData)
      ]);

      // 하나는 성공, 하나는 실패해야 함
      const successCount = [response1, response2].filter(r => r.status === 201).length;
      const failureCount = [response1, response2].filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // 데이터베이스에 1명의 사용자만 존재해야 함
      const users = await User.find({ email: userData.email });
      expect(users).toHaveLength(1);
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