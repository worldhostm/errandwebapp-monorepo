import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VerificationService } from '../services/verificationService';

export const requestPhoneVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body;
    const userId = req.user?.id;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: '전화번호가 필요합니다.'
      });
    }

    const result = await VerificationService.requestPhoneVerification(userId, phone);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('전화번호 인증 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const verifyPhoneCode = async (req: AuthRequest, res: Response) => {
  try {
    const { verificationId, code } = req.body;
    const userId = req.user?.id;

    if (!verificationId || !code) {
      return res.status(400).json({
        success: false,
        error: '인증 ID와 코드가 필요합니다.'
      });
    }

    const result = await VerificationService.verifyPhoneCode(userId, verificationId, code);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('전화번호 인증 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const requestEmailVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await VerificationService.requestEmailVerification(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('이메일 인증 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const verifyEmailToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const result = await VerificationService.verifyEmailToken(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('이메일 인증 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const requestIdentityVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { documents } = req.body;
    const userId = req.user?.id;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: '신분증 사진이 필요합니다.'
      });
    }

    const result = await VerificationService.requestIdentityVerification(userId, documents);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('신분증 인증 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const requestAddressVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { address, documents } = req.body;
    const userId = req.user?.id;

    if (!address || !documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: '주소와 증빙 서류가 필요합니다.'
      });
    }

    const result = await VerificationService.requestAddressVerification(userId, address, documents);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('주소 인증 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const getVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await VerificationService.getVerificationStatus(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('인증 상태 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// Admin endpoints
export const approveVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 인증 타입이 필요합니다.'
      });
    }

    if (!['identity', 'address'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 인증 타입입니다.'
      });
    }

    const result = await VerificationService.approveVerification(userId, type);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('인증 승인 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const rejectVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, reason } = req.body;

    if (!userId || !type || !reason) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID, 인증 타입, 거절 사유가 필요합니다.'
      });
    }

    if (!['identity', 'address'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 인증 타입입니다.'
      });
    }

    const result = await VerificationService.rejectVerification(userId, type, reason);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('인증 거절 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};