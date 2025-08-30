# 위치 기반 심부름 웹앱 - 설정 및 실행 가이드

## 🏗️ 프로젝트 구조 분석

### 전체 아키텍처
```
errandwebapp/ (모노레포 구조)
├── apps/
│   ├── frontend/              # Next.js 15 + React 19 프론트엔드
│   │   ├── app/              # Next.js App Router
│   │   ├── public/           # 정적 파일들
│   │   ├── .env.local.example
│   │   └── package.json      # 프론트엔드 의존성
│   └── backend/              # Express.js + TypeScript 백엔드
│       ├── src/
│       │   ├── controllers/  # API 컨트롤러들
│       │   ├── middleware/   # 인증, 에러 핸들링 등
│       │   ├── models/       # MongoDB 스키마 (Mongoose)
│       │   ├── routes/       # API 라우트 정의
│       │   ├── services/     # 비즈니스 로직 (Socket.IO 등)
│       │   └── index.ts      # 서버 진입점
│       ├── .env.example
│       └── package.json      # 백엔드 의존성
├── packages/
│   └── shared/               # 공유 타입 및 유틸리티
│       ├── src/
│       └── package.json
├── .env.example             # 루트 환경 변수
├── package.json             # 워크스페이스 설정
└── README.md
```

### 기술 스택 상세

#### 프론트엔드 (apps/frontend)
- **Next.js 15.5.2** - React 프레임워크 (App Router 사용)
- **React 19.1.0** - 최신 React
- **TypeScript 5** - 타입 안전성
- **TailwindCSS 4** - 현대적 CSS 프레임워크
- **Socket.IO Client** - 실시간 통신

#### 백엔드 (apps/backend)
- **Express.js 4.19.2** - Node.js 웹 프레임워크
- **TypeScript 5.6.3** - 타입 안전성
- **MongoDB + Mongoose 8.7.2** - NoSQL 데이터베이스
- **Socket.IO 4.8.1** - 실시간 양방향 통신
- **JWT (jsonwebtoken 9.0.2)** - 인증 토큰
- **bcryptjs 2.4.3** - 비밀번호 암호화
- **Helmet 7.1.0** - 보안 헤더
- **CORS 2.8.5** - 교차 출처 리소스 공유

#### 공유 패키지 (packages/shared)
- **TypeScript** - 타입 정의 공유
- 공통 유틸리티 함수들

## 🚀 서버 설정 및 실행 방법

### 1. 사전 요구사항

```bash
# Node.js 18.0+ 설치 확인
node --version

# MongoDB 6.0+ 설치 및 실행 확인
mongod --version

# npm 또는 yarn 설치 확인
npm --version
```

### 2. 프로젝트 설정

#### 2.1 저장소 클론 및 의존성 설치
```bash
# 저장소 클론
git clone <repository-url>
cd errandwebapp

# 모든 워크스페이스 의존성 설치 (루트에서 실행)
npm install
```

#### 2.2 환경 변수 설정

**루트 .env 파일 생성:**
```bash
cp .env.example .env
```

**백엔드 환경 변수 설정:**
```bash
cp apps/backend/.env.example apps/backend/.env
```

`apps/backend/.env` 내용:
```env
# 데이터베이스 연결
MONGODB_URI=mongodb://localhost:27017/errandwebapp

# JWT 시크릿 키 (보안을 위해 복잡하게 설정)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random

# CORS 설정을 위한 프론트엔드 URL
FRONTEND_URL=http://localhost:3000

# 백엔드 서버 포트
PORT=5000

# 파일 업로드 설정
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# 개발 환경
NODE_ENV=development
```

**프론트엔드 환경 변수 설정:**
```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

`apps/frontend/.env.local` 내용:
```env
# API 베이스 URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# 지도 API 키들 (필요한 것만 설정)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your-kakao-map-api-key
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your-naver-map-client-id

# Socket.IO 연결 URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# 앱 설정
NEXT_PUBLIC_APP_NAME="Errand Web App"
NEXT_PUBLIC_DEFAULT_SEARCH_RADIUS=5000
NEXT_PUBLIC_MAX_IMAGES_PER_ERRAND=5

NODE_ENV=development
```

### 3. 데이터베이스 설정

#### MongoDB 시작
```bash
# Windows (MongoDB 서비스로 설치된 경우)
net start MongoDB

# macOS (Homebrew)
brew services start mongodb/brew/mongodb-community

# Linux (systemctl)
sudo systemctl start mongod

# Docker 사용하는 경우
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. 서버 실행 명령어

#### 4.1 개발 환경 실행

**모든 서비스 동시 실행 (추천):**
```bash
# 루트 디렉토리에서 실행
npm run dev
# 프론트엔드: http://localhost:3000
# 백엔드: http://localhost:5000
```

**개별 서비스 실행:**
```bash
# 프론트엔드만 실행 (포트 3000)
npm run dev:frontend

# 백엔드만 실행 (포트 5000)
npm run dev:backend

# 공유 패키지 빌드 (개발 중 필요시)
npm run build --workspace=packages/shared
```

#### 4.2 프로덕션 빌드 및 실행

```bash
# 모든 앱 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

#### 4.3 개별 워크스페이스 명령어

**백엔드 명령어:**
```bash
# 개발 서버 시작 (ts-node-dev 사용)
npm run dev --workspace=apps/backend

# TypeScript 빌드
npm run build --workspace=apps/backend

# 빌드된 JavaScript 실행
npm run start --workspace=apps/backend

# 린트 체크
npm run lint --workspace=apps/backend

# 타입 체크
npm run typecheck --workspace=apps/backend
```

**프론트엔드 명령어:**
```bash
# 개발 서버 시작
npm run dev --workspace=apps/frontend

# 프로덕션 빌드
npm run build --workspace=apps/frontend

# 프로덕션 서버 시작
npm run start --workspace=apps/frontend

# 린트 체크
npm run lint --workspace=apps/frontend

# 타입 체크
npm run typecheck --workspace=apps/frontend
```

**공유 패키지 명령어:**
```bash
# 공유 패키지 빌드
npm run build --workspace=packages/shared

# 감시 모드로 빌드
npm run dev --workspace=packages/shared
```

### 5. API 엔드포인트

서버가 실행되면 다음 API들을 사용할 수 있습니다:

#### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 프로필 조회
- `PUT /api/auth/profile` - 프로필 수정

#### 심부름 API
- `POST /api/errands` - 심부름 생성
- `GET /api/errands/nearby?lng=127&lat=37&radius=5000` - 주변 심부름 조회
- `GET /api/errands/user` - 내 심부름 목록
- `GET /api/errands/:id` - 심부름 상세 조회
- `POST /api/errands/:id/accept` - 심부름 수락
- `PUT /api/errands/:id/status` - 심부름 상태 업데이트
- `DELETE /api/errands/:id` - 심부름 취소

#### 채팅 API
- `GET /api/chat/errand/:errandId` - 심부름 채팅방 조회
- `POST /api/chat/:chatId/message` - 메시지 전송
- `PUT /api/chat/:chatId/read` - 메시지 읽음 처리

#### 사용자 API
- `GET /api/users/:id` - 사용자 정보 조회
- `PUT /api/users/location` - 위치 업데이트

#### 헬스 체크
- `GET /api/health` - 서버 상태 확인

### 6. 실시간 기능 (Socket.IO)

Socket.IO 이벤트들:
- `join_chat` / `leave_chat` - 채팅방 입장/퇴장
- `send_message` / `new_message` - 실시간 메시지
- `errand_status_update` / `errand_updated` - 심부름 상태 업데이트
- `update_location` / `user_location_updated` - 위치 업데이트
- `typing_start` / `typing_stop` - 타이핑 상태

### 7. 트러블슈팅

#### 공통 문제들

**MongoDB 연결 오류:**
```bash
# MongoDB 실행 상태 확인
mongosh
# 또는
mongo

# 연결 테스트
mongosh "mongodb://localhost:27017/errandwebapp"
```

**포트 충돌:**
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :3000  # Linux/macOS
netstat -an | findstr :3000  # Windows

# 다른 포트 사용
PORT=5001 npm run dev:backend
```

**의존성 문제:**
```bash
# node_modules 및 package-lock.json 삭제 후 재설치
rm -rf node_modules package-lock.json
rm -rf apps/frontend/node_modules apps/backend/node_modules
npm install
```

**TypeScript 오류:**
```bash
# 타입 체크
npm run typecheck

# 특정 워크스페이스 타입 체크
npm run typecheck --workspace=apps/backend
npm run typecheck --workspace=apps/frontend
```

### 8. 개발 워크플로우

1. **새로운 기능 개발 시:**
   ```bash
   npm run dev  # 개발 서버 시작
   # 코드 수정
   npm run typecheck  # 타입 체크
   npm run lint  # 린트 체크
   ```

2. **공유 타입 변경 시:**
   ```bash
   npm run build --workspace=packages/shared
   # 다른 앱들이 자동으로 새로운 타입을 사용
   ```

3. **프로덕션 배포 전:**
   ```bash
   npm run build  # 모든 앱 빌드
   npm run typecheck  # 전체 타입 체크
   npm run lint  # 전체 린트 체크
   ```

이 가이드를 따라 설정하면 위치 기반 심부름 웹앱을 로컬에서 실행할 수 있습니다.