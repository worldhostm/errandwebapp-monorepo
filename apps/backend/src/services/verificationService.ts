import User from '../models/User';
import crypto from 'crypto';

interface VerificationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

interface PhoneVerificationData {
  code: string;
  expiresAt: Date;
  attempts: number;
}

interface EmailVerificationData {
  token: string;
  expiresAt: Date;
}

// In-memory storage for verification data (in production, use Redis or database)
const verificationStorage = new Map<string, PhoneVerificationData>();
const emailVerificationStorage = new Map<string, EmailVerificationData & { userId: string }>();

export class VerificationService {
  private static readonly PHONE_CODE_EXPIRY_MINUTES = 5;
  private static readonly EMAIL_TOKEN_EXPIRY_HOURS = 24;
  private static readonly MAX_VERIFICATION_ATTEMPTS = 5;

  static async requestPhoneVerification(userId: string, phone: string): Promise<VerificationResult> {
    try {
      if (!this.isValidPhoneNumber(phone)) {
        return { success: false, message: '유효하지 않은 전화번호 형식입니다.' };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 기존 전화번호 인증 요청 제거
      user.verification = user.verification.filter(v => v.type !== 'phone');

      // 새 인증 요청 추가
      const verificationId = this.generateVerificationId();
      const code = this.generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.PHONE_CODE_EXPIRY_MINUTES);

      user.phone = phone;
      user.verification.push({
        type: 'phone',
        status: 'pending',
        documents: []
      });

      // 메모리에 인증 정보 저장
      verificationStorage.set(verificationId, {
        code,
        expiresAt,
        attempts: 0
      });

      await user.save();

      // 실제로는 SMS 서비스를 통해 전송
      console.log(`SMS 발송: ${phone} -> 인증번호: ${code}`);

      return {
        success: true,
        message: `${phone}로 인증번호가 발송되었습니다. 5분 내에 입력해주세요.`,
        data: { verificationId }
      };
    } catch (error) {
      console.error('전화번호 인증 요청 오류:', error);
      return { success: false, message: '인증 요청 처리 중 오류가 발생했습니다.' };
    }
  }

  static async verifyPhoneCode(userId: string, verificationId: string, code: string): Promise<VerificationResult> {
    try {
      const verificationData = verificationStorage.get(verificationId);
      if (!verificationData) {
        return { success: false, message: '유효하지 않은 인증 요청입니다.' };
      }

      if (new Date() > verificationData.expiresAt) {
        verificationStorage.delete(verificationId);
        return { success: false, message: '인증 시간이 만료되었습니다. 다시 요청해주세요.' };
      }

      if (verificationData.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
        verificationStorage.delete(verificationId);
        return { success: false, message: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
      }

      verificationData.attempts++;

      if (verificationData.code !== code) {
        return { success: false, message: '인증번호가 올바르지 않습니다.' };
      }

      // 인증 성공
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 전화번호 인증 상태 업데이트
      const phoneVerification = user.verification.find(v => v.type === 'phone');
      if (phoneVerification) {
        phoneVerification.status = 'verified';
        phoneVerification.verifiedAt = new Date();
      }

      await user.save();
      verificationStorage.delete(verificationId);

      return {
        success: true,
        message: '전화번호 인증이 완료되었습니다.'
      };
    } catch (error) {
      console.error('전화번호 인증 확인 오류:', error);
      return { success: false, message: '인증 확인 처리 중 오류가 발생했습니다.' };
    }
  }

  static async requestEmailVerification(userId: string): Promise<VerificationResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 기존 이메일 인증 요청 제거
      user.verification = user.verification.filter(v => v.type !== 'email');

      // 새 인증 요청 추가
      const token = this.generateEmailVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.EMAIL_TOKEN_EXPIRY_HOURS);

      user.verification.push({
        type: 'email',
        status: 'pending',
        documents: []
      });

      // 메모리에 토큰 정보 저장
      emailVerificationStorage.set(token, {
        token,
        expiresAt,
        userId
      });

      await user.save();

      // 실제로는 이메일 서비스를 통해 전송
      console.log(`이메일 발송: ${user.email} -> 인증 링크: /api/verification/email/verify/${token}`);

      return {
        success: true,
        message: `${user.email}로 인증 이메일이 발송되었습니다. 24시간 내에 확인해주세요.`,
        data: { verificationToken: token }
      };
    } catch (error) {
      console.error('이메일 인증 요청 오류:', error);
      return { success: false, message: '인증 요청 처리 중 오류가 발생했습니다.' };
    }
  }

  static async verifyEmailToken(token: string): Promise<VerificationResult> {
    try {
      const verificationData = emailVerificationStorage.get(token);
      if (!verificationData) {
        return { success: false, message: '유효하지 않은 인증 토큰입니다.' };
      }

      if (new Date() > verificationData.expiresAt) {
        emailVerificationStorage.delete(token);
        return { success: false, message: '인증 링크가 만료되었습니다. 다시 요청해주세요.' };
      }

      const user = await User.findById(verificationData.userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 이메일 인증 상태 업데이트
      const emailVerification = user.verification.find(v => v.type === 'email');
      if (emailVerification) {
        emailVerification.status = 'verified';
        emailVerification.verifiedAt = new Date();
      }

      await user.save();
      emailVerificationStorage.delete(token);

      return {
        success: true,
        message: '이메일 인증이 완료되었습니다.'
      };
    } catch (error) {
      console.error('이메일 인증 확인 오류:', error);
      return { success: false, message: '인증 확인 처리 중 오류가 발생했습니다.' };
    }
  }

  static async requestIdentityVerification(userId: string, documents: string[]): Promise<VerificationResult> {
    try {
      if (!documents || documents.length === 0) {
        return { success: false, message: '신분증 사진이 필요합니다.' };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 기존 신분증 인증 요청 제거
      user.verification = user.verification.filter(v => v.type !== 'identity');

      // 새 인증 요청 추가
      user.verification.push({
        type: 'identity',
        status: 'pending',
        documents
      });

      await user.save();

      return {
        success: true,
        message: '신분증 인증 요청이 제출되었습니다. 검토 후 결과를 안내해드리겠습니다.'
      };
    } catch (error) {
      console.error('신분증 인증 요청 오류:', error);
      return { success: false, message: '인증 요청 처리 중 오류가 발생했습니다.' };
    }
  }

  static async requestAddressVerification(userId: string, address: string, documents: string[]): Promise<VerificationResult> {
    try {
      if (!address || !documents || documents.length === 0) {
        return { success: false, message: '주소와 증빙 서류가 필요합니다.' };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 기존 주소 인증 요청 제거
      user.verification = user.verification.filter(v => v.type !== 'address');

      // 새 인증 요청 추가
      user.verification.push({
        type: 'address',
        status: 'pending',
        documents
      });

      // 사용자 주소 정보 업데이트 (GeoJSON 형식 유지)
      if (!user.location) {
        user.location = {
          type: 'Point',
          coordinates: [127.0, 37.5], // 기본 서울 좌표
          address
        };
      } else {
        user.location.address = address;
        // coordinates가 없으면 기본값 설정
        if (!user.location.coordinates || user.location.coordinates.length < 2) {
          user.location.coordinates = [127.0, 37.5];
        }
        // type이 없으면 설정
        if (!user.location.type) {
          user.location.type = 'Point';
        }
      }

      await user.save();

      return {
        success: true,
        message: '주소 인증 요청이 제출되었습니다. 검토 후 결과를 안내해드리겠습니다.'
      };
    } catch (error) {
      console.error('주소 인증 요청 오류:', error);
      return { success: false, message: '인증 요청 처리 중 오류가 발생했습니다.' };
    }
  }

  static async getVerificationStatus(userId: string): Promise<VerificationResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      const status = user.getVerificationStatus();

      return {
        success: true,
        message: '인증 상태 조회 완료',
        data: {
          ...status,
          verifications: user.verification
        }
      };
    } catch (error) {
      console.error('인증 상태 조회 오류:', error);
      return { success: false, message: '상태 조회 중 오류가 발생했습니다.' };
    }
  }

  static async approveVerification(userId: string, verificationType: 'identity' | 'address'): Promise<VerificationResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      const verification = user.verification.find(v => v.type === verificationType);
      if (!verification) {
        return { success: false, message: '인증 요청을 찾을 수 없습니다.' };
      }

      if (verification.status !== 'pending') {
        return { success: false, message: '이미 처리된 인증 요청입니다.' };
      }

      verification.status = 'verified';
      verification.verifiedAt = new Date();

      await user.save();

      return {
        success: true,
        message: `${verificationType === 'identity' ? '신분증' : '주소'} 인증이 승인되었습니다.`
      };
    } catch (error) {
      console.error('인증 승인 오류:', error);
      return { success: false, message: '인증 승인 처리 중 오류가 발생했습니다.' };
    }
  }

  static async rejectVerification(userId: string, verificationType: 'identity' | 'address', reason: string): Promise<VerificationResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      const verification = user.verification.find(v => v.type === verificationType);
      if (!verification) {
        return { success: false, message: '인증 요청을 찾을 수 없습니다.' };
      }

      if (verification.status !== 'pending') {
        return { success: false, message: '이미 처리된 인증 요청입니다.' };
      }

      verification.status = 'rejected';
      verification.rejectionReason = reason;

      await user.save();

      return {
        success: true,
        message: `${verificationType === 'identity' ? '신분증' : '주소'} 인증이 거절되었습니다.`
      };
    } catch (error) {
      console.error('인증 거절 오류:', error);
      return { success: false, message: '인증 거절 처리 중 오류가 발생했습니다.' };
    }
  }

  // Helper methods
  static expireVerification(verificationId: string): void {
    const verificationData = verificationStorage.get(verificationId);
    if (verificationData) {
      verificationData.expiresAt = new Date(Date.now() - 1000); // 1초 전으로 설정
    }
  }

  private static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  }

  private static generateVerificationId(): string {
    return crypto.randomUUID();
  }

  private static generateVerificationCode(): string {
    // 테스트용으로 고정 코드 사용, 실제로는 랜덤 생성
    if (process.env.NODE_ENV === 'test') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}