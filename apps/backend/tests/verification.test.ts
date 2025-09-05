import request from 'supertest';
import { app, createTestToken } from './setup';
import User from '../src/models/User';
import { VerificationService } from '../src/services/verificationService';

describe('User Verification System', () => {
  let userToken: string;
  let userId: string;
  let testUser: any;

  beforeEach(async () => {
    // 테스트용 사용자 생성
    testUser = await User.create({
      name: '인증테스트',
      email: 'verify@example.com',
      password: '123456',
      phone: '010-1234-5678'
    });
    
    userId = (testUser._id as any).toString();
    userToken = createTestToken((testUser._id as any).toString());
  });

  describe('User Model Verification Methods', () => {
    it('should return initial verification status for new user', () => {
      const status = testUser.getVerificationStatus();

      expect(status).toMatchObject({
        level: 0,
        badges: [],
        isPhoneVerified: false,
        isEmailVerified: false,
        isIdentityVerified: false,
        isAddressVerified: false
      });
    });

    it('should update verification level when phone is verified', async () => {
      testUser.verification.push({
        type: 'phone',
        status: 'verified',
        verifiedAt: new Date()
      });

      const status = testUser.getVerificationStatus();

      expect(status.level).toBe(1);
      expect(status.badges).toContain('phone');
      expect(status.isPhoneVerified).toBe(true);
      expect(testUser.isVerified).toBe(true);
      expect(testUser.verificationLevel).toBe(1);
    });

    it('should update verification level when identity is verified', async () => {
      testUser.verification.push(
        {
          type: 'phone',
          status: 'verified',
          verifiedAt: new Date()
        },
        {
          type: 'identity',
          status: 'verified',
          verifiedAt: new Date()
        }
      );

      const status = testUser.getVerificationStatus();

      expect(status.level).toBe(2);
      expect(status.badges).toContain('phone');
      expect(status.badges).toContain('identity');
      expect(status.isPhoneVerified).toBe(true);
      expect(status.isIdentityVerified).toBe(true);
    });

    it('should achieve premium verification level', async () => {
      testUser.verification.push(
        {
          type: 'phone',
          status: 'verified',
          verifiedAt: new Date()
        },
        {
          type: 'email',
          status: 'verified',
          verifiedAt: new Date()
        },
        {
          type: 'identity',
          status: 'verified',
          verifiedAt: new Date()
        }
      );

      const status = testUser.getVerificationStatus();

      expect(status.level).toBe(3);
      expect(status.badges).toContain('premium');
      expect(status.isPhoneVerified).toBe(true);
      expect(status.isEmailVerified).toBe(true);
      expect(status.isIdentityVerified).toBe(true);
    });
  });

  describe('VerificationService', () => {
    describe('requestPhoneVerification', () => {
      it('should create phone verification request', async () => {
        const result = await VerificationService.requestPhoneVerification(userId, '010-9876-5432');

        expect(result.success).toBe(true);
        expect(result.message).toContain('인증번호가 발송되었습니다');
        expect(result.data).toHaveProperty('verificationId');

        // 사용자 정보 확인
        const updatedUser = await User.findById(userId);
        expect(updatedUser?.phone).toBe('010-9876-5432');
        expect(updatedUser?.verification).toHaveLength(1);
        expect(updatedUser?.verification[0].type).toBe('phone');
        expect(updatedUser?.verification[0].status).toBe('pending');
      });

      it('should return error for invalid phone number', async () => {
        const result = await VerificationService.requestPhoneVerification(userId, 'invalid');

        expect(result.success).toBe(false);
        expect(result.message).toContain('유효하지 않은 전화번호');
      });

      it('should return error for non-existent user', async () => {
        const result = await VerificationService.requestPhoneVerification('507f1f77bcf86cd799439011', '010-1234-5678');

        expect(result.success).toBe(false);
        expect(result.message).toContain('사용자를 찾을 수 없습니다');
      });
    });

    describe('verifyPhoneCode', () => {
      it('should verify phone with correct code', async () => {
        // 먼저 인증 요청
        const requestResult = await VerificationService.requestPhoneVerification(userId, '010-9876-5432');
        const verificationId = requestResult.data?.verificationId;

        // 코드 인증 (테스트용 코드 123456 사용)
        const verifyResult = await VerificationService.verifyPhoneCode(userId, verificationId, '123456');

        expect(verifyResult.success).toBe(true);
        expect(verifyResult.message).toContain('전화번호 인증이 완료되었습니다');

        // 사용자 정보 확인
        const updatedUser = await User.findById(userId);
        const phoneVerification = updatedUser?.verification.find(v => v.type === 'phone');
        expect(phoneVerification?.status).toBe('verified');
        expect(phoneVerification?.verifiedAt).toBeDefined();

        const status = updatedUser?.getVerificationStatus();
        expect(status?.isPhoneVerified).toBe(true);
        expect(status?.level).toBe(1);
      });

      it('should return error for incorrect code', async () => {
        const requestResult = await VerificationService.requestPhoneVerification(userId, '010-9876-5432');
        const verificationId = requestResult.data?.verificationId;

        const verifyResult = await VerificationService.verifyPhoneCode(userId, verificationId, '000000');

        expect(verifyResult.success).toBe(false);
        expect(verifyResult.message).toContain('인증번호가 올바르지 않습니다');

        // 상태가 pending으로 유지되어야 함
        const updatedUser = await User.findById(userId);
        const phoneVerification = updatedUser?.verification.find(v => v.type === 'phone');
        expect(phoneVerification?.status).toBe('pending');
      });

      it('should return error for expired verification', async () => {
        const requestResult = await VerificationService.requestPhoneVerification(userId, '010-9876-5432');
        const verificationId = requestResult.data?.verificationId;

        // 강제로 만료시간 설정 (과거 시간)
        await VerificationService.expireVerification(verificationId);

        const verifyResult = await VerificationService.verifyPhoneCode(userId, verificationId, '123456');

        expect(verifyResult.success).toBe(false);
        expect(verifyResult.message).toContain('인증 시간이 만료되었습니다');
      });
    });

    describe('requestEmailVerification', () => {
      it('should create email verification request', async () => {
        const result = await VerificationService.requestEmailVerification(userId);

        expect(result.success).toBe(true);
        expect(result.message).toContain('인증 이메일이 발송되었습니다');
        expect(result.data).toHaveProperty('verificationToken');

        // 사용자 정보 확인
        const updatedUser = await User.findById(userId);
        const emailVerification = updatedUser?.verification.find(v => v.type === 'email');
        expect(emailVerification).toBeDefined();
        expect(emailVerification?.status).toBe('pending');
      });
    });

    describe('verifyEmailToken', () => {
      it('should verify email with correct token', async () => {
        const requestResult = await VerificationService.requestEmailVerification(userId);
        const token = requestResult.data?.verificationToken;

        const verifyResult = await VerificationService.verifyEmailToken(token);

        expect(verifyResult.success).toBe(true);
        expect(verifyResult.message).toContain('이메일 인증이 완료되었습니다');

        // 사용자 정보 확인
        const updatedUser = await User.findById(userId);
        const emailVerification = updatedUser?.verification.find(v => v.type === 'email');
        expect(emailVerification?.status).toBe('verified');

        const status = updatedUser?.getVerificationStatus();
        expect(status?.isEmailVerified).toBe(true);
        expect(status?.level).toBe(1);
      });

      it('should return error for invalid token', async () => {
        const verifyResult = await VerificationService.verifyEmailToken('invalid-token');

        expect(verifyResult.success).toBe(false);
        expect(verifyResult.message).toContain('유효하지 않은 인증 토큰입니다');
      });
    });

    describe('requestIdentityVerification', () => {
      it('should create identity verification request with documents', async () => {
        const documents = ['https://example.com/id-front.jpg', 'https://example.com/id-back.jpg'];
        const result = await VerificationService.requestIdentityVerification(userId, documents);

        expect(result.success).toBe(true);
        expect(result.message).toContain('신분증 인증 요청이 제출되었습니다');

        // 사용자 정보 확인
        const updatedUser = await User.findById(userId);
        const identityVerification = updatedUser?.verification.find(v => v.type === 'identity');
        expect(identityVerification).toBeDefined();
        expect(identityVerification?.status).toBe('pending');
        expect(identityVerification?.documents).toEqual(documents);
      });

      it('should return error when no documents provided', async () => {
        const result = await VerificationService.requestIdentityVerification(userId, []);

        expect(result.success).toBe(false);
        expect(result.message).toContain('신분증 사진이 필요합니다');
      });
    });

    describe('requestAddressVerification', () => {
      it('should create address verification request', async () => {
        const documents = ['https://example.com/utility-bill.jpg'];
        const address = '서울시 강남구 역삼동 123-45';

        const result = await VerificationService.requestAddressVerification(userId, address, documents);

        expect(result.success).toBe(true);
        expect(result.message).toContain('주소 인증 요청이 제출되었습니다');

        // 사용자 정보 확인
        const updatedUser = await User.findById(userId);
        const addressVerification = updatedUser?.verification.find(v => v.type === 'address');
        expect(addressVerification).toBeDefined();
        expect(addressVerification?.status).toBe('pending');
        expect(addressVerification?.documents).toEqual(documents);
      });
    });

    describe('getVerificationStatus', () => {
      it('should return current verification status', async () => {
        // 여러 인증을 추가
        testUser.verification.push(
          {
            type: 'phone',
            status: 'verified',
            verifiedAt: new Date()
          },
          {
            type: 'email',
            status: 'verified',
            verifiedAt: new Date()
          },
          {
            type: 'identity',
            status: 'pending'
          }
        );
        await testUser.save();

        const status = await VerificationService.getVerificationStatus(userId);

        expect(status.success).toBe(true);
        expect(status.data).toMatchObject({
          level: 1, // phone + email = level 1
          badges: expect.arrayContaining(['phone', 'email']),
          verifications: expect.arrayContaining([
            expect.objectContaining({ type: 'phone', status: 'verified' }),
            expect.objectContaining({ type: 'email', status: 'verified' }),
            expect.objectContaining({ type: 'identity', status: 'pending' })
          ])
        });
      });
    });
  });

  describe('Verification API Endpoints', () => {
    describe('POST /api/verification/phone/request', () => {
      it('should request phone verification', async () => {
        const response = await request(app)
          .post('/api/verification/phone/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ phone: '010-9876-5432' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('인증번호가 발송되었습니다'),
          data: {
            verificationId: expect.any(String)
          }
        });
      });

      it('should return error without authentication', async () => {
        const response = await request(app)
          .post('/api/verification/phone/request')
          .send({ phone: '010-9876-5432' })
          .expect(401);

        expect(response.body.error).toContain('No token provided');
      });

      it('should return error for invalid phone', async () => {
        const response = await request(app)
          .post('/api/verification/phone/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ phone: 'invalid' })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.stringContaining('유효하지 않은 전화번호')
        });
      });
    });

    describe('POST /api/verification/phone/verify', () => {
      it('should verify phone with correct code', async () => {
        // 먼저 인증 요청
        const requestResponse = await request(app)
          .post('/api/verification/phone/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ phone: '010-9876-5432' })
          .expect(200);

        const { verificationId } = requestResponse.body.data;

        // 인증 확인
        const verifyResponse = await request(app)
          .post('/api/verification/phone/verify')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ verificationId, code: '123456' })
          .expect(200);

        expect(verifyResponse.body).toMatchObject({
          success: true,
          message: expect.stringContaining('전화번호 인증이 완료되었습니다')
        });
      });
    });

    describe('POST /api/verification/email/request', () => {
      it('should request email verification', async () => {
        const response = await request(app)
          .post('/api/verification/email/request')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('인증 이메일이 발송되었습니다')
        });
      });
    });

    describe('GET /api/verification/email/verify/:token', () => {
      it('should verify email with valid token', async () => {
        // 먼저 이메일 인증 요청
        const requestResponse = await request(app)
          .post('/api/verification/email/request')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        const { verificationToken } = requestResponse.body.data;

        // 토큰으로 인증
        const verifyResponse = await request(app)
          .get(`/api/verification/email/verify/${verificationToken}`)
          .expect(200);

        expect(verifyResponse.body).toMatchObject({
          success: true,
          message: expect.stringContaining('이메일 인증이 완료되었습니다')
        });
      });
    });

    describe('POST /api/verification/identity/request', () => {
      it('should request identity verification', async () => {
        const response = await request(app)
          .post('/api/verification/identity/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ documents: ['https://example.com/id.jpg'] })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('신분증 인증 요청이 제출되었습니다')
        });
      });
    });

    describe('POST /api/verification/address/request', () => {
      it('should request address verification', async () => {
        const response = await request(app)
          .post('/api/verification/address/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ 
            address: '서울시 강남구 역삼동 123-45',
            documents: ['https://example.com/bill.jpg'] 
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('주소 인증 요청이 제출되었습니다')
        });
      });
    });

    describe('GET /api/verification/status', () => {
      it('should return user verification status', async () => {
        const response = await request(app)
          .get('/api/verification/status')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            level: expect.any(Number),
            badges: expect.any(Array),
            isPhoneVerified: expect.any(Boolean),
            isEmailVerified: expect.any(Boolean),
            isIdentityVerified: expect.any(Boolean),
            isAddressVerified: expect.any(Boolean),
            verifications: expect.any(Array)
          }
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should achieve full verification flow', async () => {
      // 1. 전화번호 인증
      const phoneRequest = await request(app)
        .post('/api/verification/phone/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ phone: '010-9876-5432' })
        .expect(200);

      await request(app)
        .post('/api/verification/phone/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          verificationId: phoneRequest.body.data.verificationId, 
          code: '123456' 
        })
        .expect(200);

      // 2. 이메일 인증
      const emailRequest = await request(app)
        .post('/api/verification/email/request')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app)
        .get(`/api/verification/email/verify/${emailRequest.body.data.verificationToken}`)
        .expect(200);

      // 3. 신분증 인증 요청
      await request(app)
        .post('/api/verification/identity/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ documents: ['https://example.com/id.jpg'] })
        .expect(200);

      // 4. 최종 상태 확인
      const statusResponse = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(statusResponse.body.data.isPhoneVerified).toBe(true);
      expect(statusResponse.body.data.isEmailVerified).toBe(true);
      expect(statusResponse.body.data.level).toBeGreaterThanOrEqual(1);
      expect(statusResponse.body.data.badges).toContain('phone');
      expect(statusResponse.body.data.badges).toContain('email');
    });
  });
});