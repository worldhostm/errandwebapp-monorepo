# 이메일 인증 기능 문제점 분석 보고서

## 테스트 일시
2025-10-20

## 발견된 문제점

### 1. 🚨 중요: 환경 변수명 불일치 (치명적)

**문제:**
프론트엔드에서 두 가지 다른 API URL 환경 변수명을 사용하고 있습니다.

**상세:**
- `apps/frontend/app/lib/api.ts:3` → `NEXT_PUBLIC_API_BASE_URL` 사용
- `apps/frontend/app/components/EmailVerificationModal.tsx` → `NEXT_PUBLIC_API_URL` 사용 (53, 84, 156줄)
- `apps/frontend/app/components/ProfileSettingsModal.tsx` → `NEXT_PUBLIC_API_URL` 사용 (99줄)
- 실제 `.env.local` 파일 → `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000` 설정

**영향:**
- 이메일 인증 모달에서 `process.env.NEXT_PUBLIC_API_URL`은 `undefined`
- API 요청 URL이 `undefined/api/auth/send-verification`가 되어 실패
- 프로필 설정 모달의 비밀번호 변경도 같은 문제 발생

**해결 방법:**
```typescript
// Option 1: EmailVerificationModal.tsx와 ProfileSettingsModal.tsx 수정
process.env.NEXT_PUBLIC_API_URL → process.env.NEXT_PUBLIC_API_BASE_URL

// Option 2: .env.local에 두 변수 모두 추가
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**권장 사항:**
프로젝트 전체에서 하나의 환경 변수명으로 통일하는 것을 권장합니다.

---

### 2. ⚠️ 백엔드 이메일 발송 설정

**현재 상태:**
- 개발 모드(NODE_ENV !== 'production')에서는 실제 이메일을 발송하지 않음
- 콘솔에 인증 코드를 로그로 출력 (emailService.ts:104-112줄)
- SMTP 설정은 되어 있음 (Gmail SMTP: chos1909@gmail.com)

**개발 모드 동작:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 이메일 인증 코드 (개발 모드)');
  console.log(`   받는 사람: ${email}`);
  console.log(`   인증 코드: ${code}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return; // 실제 발송 안함
}
```

**영향:**
- 개발 환경에서는 실제 이메일이 발송되지 않음
- 백엔드 콘솔 로그를 확인해야 인증 코드를 알 수 있음
- 프론트엔드에서는 이메일이 발송된 것처럼 보임

---

### 3. ✅ 정상 작동하는 부분

1. **백엔드 API 엔드포인트:**
   - POST `/api/auth/send-verification` ✅
   - POST `/api/auth/verify-email` ✅
   - POST `/api/auth/resend-verification` ✅

2. **인증 코드 생성 및 저장:**
   - 6자리 랜덤 숫자 코드 생성 ✅
   - MongoDB에 저장 (10분 유효기간) ✅
   - TTL 인덱스로 자동 삭제 ✅

3. **보안 기능:**
   - Rate limiting (1분에 1회) ✅
   - 최대 시도 횟수 제한 (5회) ✅
   - 코드 만료 시간 체크 ✅
   - 사용된 코드 재사용 방지 ✅

4. **프론트엔드 UI:**
   - 6자리 코드 입력 필드 ✅
   - 자동 포커스 이동 ✅
   - 붙여넣기 지원 ✅
   - 타이머 표시 (10분) ✅
   - 재전송 기능 ✅

---

## 테스트 결과

### 백엔드 API 직접 테스트 (cURL)

```bash
# 1. 이미 인증된 이메일
curl -X POST http://localhost:5000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

Response: {"error":"Email is already verified"}
Status: 200 ✅

# 2. 새로운 이메일
curl -X POST http://localhost:5000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com"}'

Response: {"success":true,"message":"Verification code sent to email","expiresIn":600}
Status: 200 ✅
```

---

## 수정이 필요한 파일

### 즉시 수정 필요 (P0 - 치명적)

1. **apps/frontend/app/components/EmailVerificationModal.tsx**
   - Line 53, 84, 156: `NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_API_BASE_URL`

2. **apps/frontend/app/components/ProfileSettingsModal.tsx**
   - Line 99: `NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_API_BASE_URL`

### 선택적 수정 (개선 사항)

3. **apps/frontend/.env.local**
   - `NEXT_PUBLIC_API_URL=http://localhost:5000` 추가 (호환성 유지)

4. **apps/backend/.env**
   - 이메일 발송 테스트를 위해 `NODE_ENV=production`으로 임시 변경 가능

---

## 추천 수정 순서

1. **Step 1:** EmailVerificationModal.tsx의 환경 변수명 수정
2. **Step 2:** ProfileSettingsModal.tsx의 환경 변수명 수정
3. **Step 3:** 프론트엔드 재시작 (환경 변수 반영)
4. **Step 4:** 테스트 수행

---

## 이메일 발송 테스트 방법

### 개발 모드에서 테스트
1. 백엔드 서버 실행 중인 터미널에서 로그 확인
2. 이메일 인증 요청 시 콘솔에 출력된 6자리 코드 확인
3. 해당 코드를 프론트엔드에 입력하여 인증

### 프로덕션 모드에서 실제 이메일 발송 테스트
1. `apps/backend/.env` 파일에서 `NODE_ENV=production` 설정
2. 백엔드 재시작
3. 실제 Gmail SMTP를 통해 이메일 발송됨
4. 받은 이메일의 인증 코드로 인증

---

## 의존성 확인

- ✅ nodemailer@7.0.9 설치됨
- ✅ @types/nodemailer@7.0.2 설치됨
- ✅ MongoDB 연결 정상
- ✅ SMTP 설정 완료 (Gmail)

---

## 결론

**주요 문제:** 환경 변수명 불일치로 인해 프론트엔드에서 API 요청이 실패합니다.

**해결 시간:** 약 5분 (파일 2개 수정)

**영향도:**
- 현재: 이메일 인증 기능 완전히 작동 안함 ❌
- 수정 후: 정상 작동 예상 ✅

**다음 액션:**
1. EmailVerificationModal.tsx 수정
2. ProfileSettingsModal.tsx 수정
3. 프론트엔드 재시작 및 테스트
