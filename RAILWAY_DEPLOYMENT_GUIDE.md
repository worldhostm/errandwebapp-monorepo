# Railway 배포 가이드

이 문서는 부름이(Errand Web App) 프로젝트를 Railway를 통해 배포하는 방법을 안내합니다.

## 목차
1. [사전 준비](#사전-준비)
2. [MongoDB 설정](#mongodb-설정)
3. [Backend 배포](#backend-배포)
4. [Frontend 배포](#frontend-배포)
5. [환경 변수 설정](#환경-변수-설정)
6. [배포 확인](#배포-확인)
7. [문제 해결](#문제-해결)

---

## 사전 준비

### 1. Railway 계정 생성
- [Railway](https://railway.app/) 웹사이트에서 계정 생성
- GitHub 계정으로 로그인 권장

### 2. GitHub 저장소 준비
- 프로젝트를 GitHub에 푸시
- Railway는 GitHub 저장소와 연동하여 자동 배포 지원

### 3. 필요한 API 키 준비
- Kakao Map API Key (지도 서비스용)
- JWT Secret (임의의 강력한 문자열)

---

## MongoDB 설정

Railway에서 MongoDB 데이터베이스를 프로비저닝합니다.

### 1. MongoDB 추가

1. Railway 대시보드에서 **New Project** 클릭
2. **Deploy MongoDB** 선택
3. 프로젝트 이름 지정 (예: `errand-mongodb`)
4. 배포 완료 후 **Variables** 탭에서 연결 정보 확인

### 2. MongoDB 연결 URL 확인

MongoDB 서비스의 **Connect** 탭에서 다음 정보를 확인:
- `MONGO_URL` 또는 `DATABASE_URL`
- 형식: `mongodb://username:password@host:port/database`

**예시:**
```
mongodb://mongo:password123@containers-us-west-123.railway.app:7654/railway
```

---

## Backend 배포

### 1. Backend 서비스 생성

1. Railway 대시보드에서 **New** → **GitHub Repo** 클릭
2. 저장소 선택 후 **Add Service** 클릭
3. Root Directory를 `apps/backend`로 설정

### 2. 빌드 설정

Railway는 자동으로 `package.json`을 감지하지만, 모노레포 구조를 위해 추가 설정이 필요합니다.

**Settings → Build** 탭에서:
- **Root Directory**: `apps/backend`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

### 3. Backend 환경 변수 설정

**Variables** 탭에서 다음 환경 변수 추가:

```env
# Database
MONGODB_URI=<Railway MongoDB 연결 URL>

# JWT
JWT_SECRET=<강력한 랜덤 문자열>

# Frontend URL (CORS 설정용)
FRONTEND_URL=<배포될 Frontend URL> (나중에 업데이트)

# Backend Port
PORT=5000

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Environment
NODE_ENV=production
```

**JWT_SECRET 생성 방법:**
```bash
# Node.js로 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 배포 확인

- **Deployments** 탭에서 빌드 로그 확인
- 성공적으로 배포되면 **Domains** 탭에서 URL 확인 (예: `https://backend-production-xxxx.up.railway.app`)

---

## Frontend 배포

### 1. Frontend 서비스 생성

1. 동일한 Railway 프로젝트에서 **New** → **GitHub Repo** 클릭
2. 동일한 저장소 선택 후 **Add Service** 클릭
3. Root Directory를 `apps/frontend`로 설정

### 2. 빌드 설정

**Settings → Build** 탭에서:
- **Root Directory**: `apps/frontend`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

### 3. Frontend 환경 변수 설정

**Variables** 탭에서 다음 환경 변수 추가:

```env
# API Base URL (Backend URL)
NEXT_PUBLIC_API_BASE_URL=<Backend Railway URL>

# Kakao Map API
NEXT_PUBLIC_KAKAO_MAP_API_KEY=<Kakao Map API Key>

# Socket.IO URL (Backend URL과 동일)
NEXT_PUBLIC_SOCKET_URL=<Backend Railway URL>

# App Configuration
NEXT_PUBLIC_APP_NAME=부름이
NEXT_PUBLIC_DEFAULT_SEARCH_RADIUS=5000
NEXT_PUBLIC_MAX_IMAGES_PER_ERRAND=5

# Environment
NODE_ENV=production
```

### 4. Backend CORS 설정 업데이트

Frontend 배포 후, Frontend URL을 확인하고 Backend의 `FRONTEND_URL` 환경 변수를 업데이트합니다.

1. Frontend의 **Domains** 탭에서 URL 확인 (예: `https://frontend-production-xxxx.up.railway.app`)
2. Backend 서비스의 **Variables** 탭으로 이동
3. `FRONTEND_URL` 값을 Frontend URL로 변경
4. Backend 서비스가 자동으로 재배포됩니다

---

## 환경 변수 설정

### Backend 환경 변수 전체 목록

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `MONGODB_URI` | MongoDB 연결 URL | `mongodb://mongo:pass@host:port/db` |
| `JWT_SECRET` | JWT 토큰 서명용 비밀키 | `a1b2c3d4e5f6...` (32자 이상) |
| `FRONTEND_URL` | Frontend URL (CORS) | `https://yourapp.railway.app` |
| `PORT` | Backend 포트 | `5000` |
| `UPLOAD_DIR` | 파일 업로드 디렉토리 | `uploads` |
| `MAX_FILE_SIZE` | 최대 파일 크기 (bytes) | `10485760` (10MB) |
| `NODE_ENV` | 환경 모드 | `production` |

### Frontend 환경 변수 전체 목록

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `https://backend.railway.app` |
| `NEXT_PUBLIC_KAKAO_MAP_API_KEY` | Kakao Map JavaScript API 키 | `your-api-key` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO 서버 URL | `https://backend.railway.app` |
| `NEXT_PUBLIC_APP_NAME` | 앱 이름 | `부름이` |
| `NEXT_PUBLIC_DEFAULT_SEARCH_RADIUS` | 기본 검색 반경 (미터) | `5000` |
| `NEXT_PUBLIC_MAX_IMAGES_PER_ERRAND` | 심부름당 최대 이미지 수 | `5` |
| `NODE_ENV` | 환경 모드 | `production` |

---

## 배포 확인

### 1. Backend 상태 확인

Backend URL에 `/api/health` 엔드포인트로 접속:
```
https://your-backend.railway.app/api/health
```

**정상 응답:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 2. Frontend 접속 확인

Frontend URL로 접속하여 랜딩 페이지가 정상적으로 표시되는지 확인:
```
https://your-frontend.railway.app
```

### 3. 기능 테스트

1. **회원가입/로그인** - 정상 작동 확인
2. **지도 표시** - Kakao Map API 정상 작동 확인
3. **심부름 등록** - Backend API 연동 확인
4. **실시간 채팅** - Socket.IO 연결 확인

---

## Railway 특수 설정

### 모노레포 구조 대응

이 프로젝트는 모노레포 구조이므로 각 서비스마다 Root Directory를 설정해야 합니다.

**Backend:**
- Root Directory: `apps/backend`
- Watch Paths: `apps/backend/**`

**Frontend:**
- Root Directory: `apps/frontend`
- Watch Paths: `apps/frontend/**`

### 자동 배포 설정

Railway는 GitHub와 연동하여 자동 배포를 지원합니다:

1. **Settings → Service** 탭에서 **Source Repo** 확인
2. **Triggers** 설정:
   - Branch: `master` 또는 `main`
   - Auto Deploy: 활성화

이제 GitHub의 해당 브랜치에 푸시하면 자동으로 배포됩니다.

### Railway CLI 사용 (선택사항)

Railway CLI를 설치하여 로컬에서 배포 관리 가능:

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 환경 변수 확인
railway vars

# 로그 확인
railway logs
```

---

## 문제 해결

### 1. 빌드 실패

**증상:** Deployment failed 메시지

**해결 방법:**
- **Deployments** 탭의 로그 확인
- Root Directory가 올바르게 설정되었는지 확인
- `package.json`의 `build` 스크립트 확인
- 모든 의존성이 `package.json`에 포함되었는지 확인

### 2. MongoDB 연결 오류

**증상:** `MongooseError: Unable to connect to database`

**해결 방법:**
- `MONGODB_URI` 환경 변수가 올바르게 설정되었는지 확인
- MongoDB 서비스가 실행 중인지 확인
- Railway MongoDB의 **Connect** 탭에서 최신 연결 URL 확인
- IP 화이트리스트 설정 확인 (Railway는 일반적으로 불필요)

### 3. CORS 에러

**증상:** Frontend에서 `CORS policy` 에러

**해결 방법:**
- Backend의 `FRONTEND_URL` 환경 변수가 정확한 Frontend URL인지 확인
- 프로토콜(`https://`) 포함 여부 확인
- 끝에 슬래시(`/`) 제거
- Backend 재배포

### 4. 환경 변수가 적용되지 않음

**증상:** 환경 변수 값이 `undefined`

**해결 방법:**
- 환경 변수 이름 확인 (대소문자 구분)
- Frontend 환경 변수는 `NEXT_PUBLIC_` 접두사 필수
- 환경 변수 변경 후 재배포 필요
- Railway의 **Variables** 탭에서 저장 확인

### 5. Socket.IO 연결 실패

**증상:** 실시간 채팅이 작동하지 않음

**해결 방법:**
- `NEXT_PUBLIC_SOCKET_URL`이 Backend URL과 동일한지 확인
- Backend에서 CORS 설정 확인
- Railway는 WebSocket을 지원하므로 추가 설정 불필요
- 브라우저 개발자 도구의 Network 탭에서 WebSocket 연결 확인

### 6. 파일 업로드 실패

**증상:** 프로필 이미지 등 업로드 실패

**해결 방법:**
- Railway는 임시 파일 시스템 사용 (재배포 시 파일 삭제됨)
- 프로덕션 환경에서는 AWS S3, Cloudinary 등 외부 스토리지 사용 권장
- 현재는 Base64 인코딩 방식 사용 중이므로 문제없음

---

## 프로덕션 체크리스트

배포 전 확인 사항:

- [ ] MongoDB 데이터베이스 생성 및 연결 확인
- [ ] 모든 환경 변수 설정 완료
- [ ] JWT_SECRET을 강력한 랜덤 값으로 설정
- [ ] Kakao Map API 키 발급 및 설정
- [ ] Backend health check API 응답 확인
- [ ] Frontend 정상 접속 확인
- [ ] CORS 설정 확인
- [ ] 회원가입/로그인 기능 테스트
- [ ] 심부름 등록 기능 테스트
- [ ] 지도 표시 기능 테스트
- [ ] 실시간 채팅 기능 테스트
- [ ] 반응형 디자인 확인 (모바일, 태블릿, 데스크톱)

---

## 추가 최적화 권장 사항

### 1. 커스텀 도메인 설정
Railway에서 커스텀 도메인 연결 가능:
- **Settings → Domains** 탭에서 도메인 추가
- DNS 레코드 설정 필요

### 2. 환경 분리
개발, 스테이징, 프로덕션 환경 분리:
- Railway에서 여러 프로젝트 생성
- 각각 다른 브랜치 연결 (`develop`, `staging`, `main`)

### 3. 모니터링 설정
- Railway의 **Metrics** 탭에서 CPU, 메모리 사용량 확인
- **Logs** 탭에서 실시간 로그 모니터링
- 외부 모니터링 도구 연동 (Sentry, LogRocket 등)

### 4. 백업 설정
- MongoDB 정기 백업 설정
- Railway의 **Backups** 기능 활용 (플랜에 따라 다름)

### 5. 성능 최적화
- Next.js 이미지 최적화 활용
- API 응답 캐싱 구현
- CDN 사용 고려 (Cloudflare, Vercel Edge Network 등)

---

## 비용 관리

### Railway 요금제

- **Free Tier**: $5 크레딧 제공 (매월), 제한적
- **Developer Plan**: $5/월 시작, 추가 사용량에 따라 과금
- **Team Plan**: 팀 협업 기능 포함

### 비용 절감 팁

1. **개발 중에는 서비스 일시 중지**: 사용하지 않을 때 서비스 중지
2. **모니터링**: **Usage** 탭에서 리소스 사용량 확인
3. **최적화**: 불필요한 API 호출 최소화, 효율적인 쿼리 사용

---

## 참고 자료

- [Railway 공식 문서](https://docs.railway.app/)
- [Railway 모노레포 가이드](https://docs.railway.app/guides/monorepo)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [MongoDB Atlas (대안)](https://www.mongodb.com/cloud/atlas)
- [Kakao Map API 문서](https://apis.map.kakao.com/)

---

## 지원

배포 중 문제가 발생하면:
1. Railway 대시보드의 **Logs** 확인
2. GitHub Issues에 문제 보고
3. Railway Discord 커뮤니티 문의

---

**마지막 업데이트:** 2024년 10월

**작성자:** 부름이 개발팀
