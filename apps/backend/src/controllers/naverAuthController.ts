import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';

const getEnv = () => ({
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID || '',
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET || '',
  NAVER_CALLBACK_URL: process.env.NAVER_CALLBACK_URL || 'http://localhost:8090/api/auth/naver/callback',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret',
});

// In-memory state store: state -> expiry (ms)
const stateStore = new Map<string, number>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of stateStore) {
    if (now > expiry) stateStore.delete(key);
  }
}, 10 * 60 * 1000);

const generateToken = (userId: string): string => {
  const { JWT_SECRET } = getEnv();
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// GET /api/auth/naver
// 네이버 OAuth 인증 페이지로 리다이렉트
export const naverLogin = (_req: Request, res: Response): void => {
  const { NAVER_CLIENT_ID, NAVER_CALLBACK_URL } = getEnv();

  if (!NAVER_CLIENT_ID) {
    res.status(500).json({ error: 'NAVER_CLIENT_ID가 설정되지 않았습니다.' });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, Date.now() + 10 * 60 * 1000); // 10분 유효

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CLIENT_ID,
    redirect_uri: NAVER_CALLBACK_URL,
    state,
  });

  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params.toString()}`);
};

// GET /api/auth/naver/callback
// 네이버에서 돌아온 콜백 처리
export const naverCallback = async (req: Request, res: Response): Promise<void> => {
  const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, FRONTEND_URL } = getEnv();
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=${encodeURIComponent(error)}`);
    return;
  }

  // state 검증
  const expiry = stateStore.get(state);
  if (!expiry || Date.now() > expiry) {
    res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=invalid_state`);
    return;
  }
  stateStore.delete(state);

  try {
    // 코드 -> 액세스 토큰 교환
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      code,
      state,
    });

    const tokenRes = await fetch(
      `https://nid.naver.com/oauth2.0/token?${tokenParams.toString()}`
    );
    const tokenData = await tokenRes.json() as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      console.error('네이버 토큰 교환 실패:', tokenData);
      res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=token_error`);
      return;
    }

    // 사용자 정보 조회
    const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userPayload = await userRes.json() as {
      resultcode: string;
      message: string;
      response: {
        id: string;
        email?: string;
        name?: string;
        nickname?: string;
        profile_image?: string;
        mobile?: string;
      };
    };

    if (userPayload.resultcode !== '00') {
      console.error('네이버 사용자 정보 조회 실패:', userPayload);
      res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=user_info_error`);
      return;
    }

    const naverUser = userPayload.response;

    // 기존 유저 탐색 (naverId 우선, 이메일 fallback)
    let user = await User.findOne({ naverId: naverUser.id });

    if (!user && naverUser.email) {
      user = await User.findOne({ email: naverUser.email.toLowerCase() });
      if (user) {
        // 기존 이메일 계정에 네이버 ID 연결
        user.naverId = naverUser.id;
        await user.save();
      }
    }

    if (!user) {
      // 신규 유저 생성
      user = await User.create({
        naverId: naverUser.id,
        email: naverUser.email || `naver_${naverUser.id}@naver.local`,
        name: naverUser.name || naverUser.nickname || '네이버 사용자',
        avatar: naverUser.profile_image,
        phone: naverUser.mobile,
        // OAuth 유저는 비밀번호 직접 로그인 불가 - 랜덤 값으로 채움
        password: crypto.randomBytes(32).toString('hex'),
      });
    }

    const token = generateToken((user._id as unknown as { toString(): string }).toString());
    res.redirect(`${FRONTEND_URL}/auth/naver/callback?token=${token}`);
  } catch (err) {
    console.error('네이버 로그인 처리 중 오류:', err);
    res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=server_error`);
  }
};
