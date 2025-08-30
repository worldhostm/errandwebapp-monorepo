# 스크립트 실행 가이드

## 🚀 빠른 시작

### Windows 사용자
```cmd
# 초기 설정 (최초 1회)
scripts\setup.bat

# 서버 실행
scripts\start.bat
```

### macOS/Linux 사용자
```bash
# 초기 설정 (최초 1회)
./scripts/setup.sh

# 서버 실행
./scripts/start.sh
```

### 크로스 플랫폼 npm 스크립트
```bash
# 초기 설정
npm run setup

# 서버 실행 메뉴
npm run quick-start

# 간단한 개발 서버 실행
npm run dev
```

## 📁 스크립트 파일 설명

### 🔧 설정 스크립트

#### `scripts/setup.bat` (Windows)
- Node.js, npm, MongoDB 설치 확인
- 프로젝트 의존성 자동 설치
- 환경 변수 파일 자동 생성
- 공유 패키지 빌드
- TypeScript 타입 체크
- MongoDB 서비스 상태 확인

#### `scripts/setup.sh` (macOS/Linux)
- 동일한 기능을 Unix/Linux 환경에서 제공
- 색상 출력으로 진행 상황 시각화
- 파일 권한 자동 설정

### 🚀 실행 스크립트

#### `scripts/start.bat` (Windows)
**메뉴 옵션:**
1. 전체 서비스 (프론트엔드 + 백엔드)
2. 프론트엔드만 (포트 3000)
3. 백엔드만 (포트 5000)
4. 빌드 및 프로덕션 실행
5. TypeScript 타입 체크
6. ESLint 린트 체크

#### `scripts/start.sh` (macOS/Linux)
**기본 메뉴 + 추가 개발자 도구:**
1. 전체 서비스
2. 프론트엔드만
3. 백엔드만
4. 빌드 및 프로덕션 실행
5. TypeScript 타입 체크
6. ESLint 린트 체크
7. **개발 도구** (추가 메뉴)
   - 패키지 정보 확인
   - 포트 사용 상태 확인
   - MongoDB 상태 확인
   - 로그 파일 확인
   - 캐시 초기화

## 🛠️ npm 스크립트 명령어

### 기본 개발 명령어
```bash
npm run dev              # 전체 개발 서버 실행
npm run dev:frontend     # 프론트엔드만
npm run dev:backend      # 백엔드만
npm run build           # 전체 빌드
npm run start           # 프로덕션 서버
npm run lint            # 코드 품질 검사
npm run typecheck       # 타입 검사
```

### 추가 유틸리티 명령어
```bash
npm run setup           # 크로스 플랫폼 설정
npm run quick-start     # 크로스 플랫폼 실행 메뉴
npm run build:shared    # 공유 패키지만 빌드
npm run clean           # 캐시 및 빌드 파일 삭제
npm run clean:win       # Windows 전용 정리
npm run reset           # 완전 초기화 후 재설치
npm run health          # 백엔드 서버 상태 확인
```

### MongoDB 관리 명령어
```bash
npm run mongo:start     # MongoDB 서비스 시작
npm run mongo:stop      # MongoDB 서비스 중지
npm run docker:mongo    # Docker로 MongoDB 실행
npm run docker:mongo:stop  # Docker MongoDB 중지
```

## 📋 실행 순서

### 🆕 처음 프로젝트를 설정할 때

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd errandwebapp
   ```

2. **설정 스크립트 실행**
   ```bash
   # Windows
   scripts\setup.bat
   
   # macOS/Linux
   ./scripts/setup.sh
   
   # npm (크로스 플랫폼)
   npm run setup
   ```

3. **환경 변수 수정** (필요시)
   - `apps/backend/.env`: JWT 시크릿, MongoDB URI 등
   - `apps/frontend/.env.local`: API 키 등

### 🔄 일상적인 개발

1. **개발 서버 실행**
   ```bash
   # 스크립트 메뉴 사용
   npm run quick-start
   
   # 직접 실행
   npm run dev
   ```

2. **개별 서비스 실행**
   ```bash
   npm run dev:frontend  # 프론트엔드 개발
   npm run dev:backend   # API 개발
   ```

### 🚀 배포 준비

1. **빌드 테스트**
   ```bash
   npm run build
   npm run typecheck
   npm run lint
   ```

2. **프로덕션 실행 테스트**
   ```bash
   npm run start
   ```

## 🔧 트러블슈팅

### 권한 오류 (macOS/Linux)
```bash
chmod +x scripts/setup.sh scripts/start.sh
```

### 포트 충돌
```bash
# 사용 중인 프로세스 확인
lsof -ti:3000  # 프론트엔드 포트
lsof -ti:5000  # 백엔드 포트

# Windows
netstat -an | findstr :3000
netstat -an | findstr :5000
```

### MongoDB 연결 문제
```bash
# 서비스 상태 확인
npm run mongo:start

# Docker로 MongoDB 실행
npm run docker:mongo
```

### 의존성 문제
```bash
# 완전 초기화
npm run reset

# 또는 수동으로
npm run clean
npm install
```

### 캐시 문제
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🌟 스크립트 특징

### Windows 배치 파일
- ✅ 단계별 진행 상황 표시
- ✅ 오류 처리 및 중단 옵션
- ✅ 관리자 권한 체크
- ✅ 서비스 상태 자동 확인

### macOS/Linux 셸 스크립트
- ✅ 컬러 출력으로 시각적 피드백
- ✅ 다양한 패키지 매니저 지원
- ✅ 상세한 개발자 도구
- ✅ 실행 권한 자동 설정

### npm 스크립트
- ✅ 크로스 플랫폼 호환성
- ✅ 플랫폼별 자동 스크립트 선택
- ✅ 워크스페이스 지원
- ✅ MongoDB 관리 기능

이 스크립트들을 사용하면 개발 환경 설정부터 일상적인 개발, 배포까지 모든 과정을 간소화할 수 있습니다.