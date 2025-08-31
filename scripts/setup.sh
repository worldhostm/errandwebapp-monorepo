#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo -e "    위치 기반 심부름 웹앱 설정 스크립트"
echo -e "==========================================${NC}"
echo ""

# 현재 디렉토리가 프로젝트 루트인지 확인
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}❌ 프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
    exit 1
fi

# Node.js 설치 확인
echo -e "${BLUE}[1/7] Node.js 버전 확인 중...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}   다음 방법으로 Node.js 18.0+ 을 설치해주세요:${NC}"
    echo "   - macOS: brew install node"
    echo "   - Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "   - 수동 설치: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js 버전: $NODE_VERSION${NC}"
echo ""

# npm 버전 확인
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm 버전: $NPM_VERSION${NC}"
echo ""

# MongoDB 설치 확인
echo -e "${BLUE}[2/7] MongoDB 연결 확인 중...${NC}"
if command -v mongosh &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB Shell이 설치되어 있습니다.${NC}"
elif command -v mongo &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB Shell(legacy)이 설치되어 있습니다.${NC}"
else
    echo -e "${RED}❌ MongoDB Shell이 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}   MongoDB 실행 방법:${NC}"
    echo "   1. MongoDB 설치:"
    echo "      - macOS: brew tap mongodb/brew && brew install mongodb-community"
    echo "      - Ubuntu: sudo apt install mongodb"
    echo "   2. Docker 사용: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
    read -p "MongoDB 없이 계속하시겠습니까? (y/n): " continue_without_mongo
    if [[ ! $continue_without_mongo =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 의존성 설치
echo -e "${BLUE}[3/7] 프로젝트 의존성 설치 중...${NC}"
if ! npm install; then
    echo -e "${RED}❌ 의존성 설치에 실패했습니다.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 의존성 설치 완료${NC}"
echo ""

# 환경 변수 파일 설정
echo -e "${BLUE}[4/7] 환경 변수 파일 설정 중...${NC}"

# 루트 .env 파일
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp ".env.example" ".env"
    echo -e "${GREEN}✅ 루트 .env 파일 생성됨${NC}"
fi

# 백엔드 .env 파일
if [ ! -f "apps/backend/.env" ] && [ -f "apps/backend/.env.example" ]; then
    cp "apps/backend/.env.example" "apps/backend/.env"
    echo -e "${GREEN}✅ 백엔드 .env 파일 생성됨${NC}"
fi

# 프론트엔드 .env.local 파일
if [ ! -f "apps/frontend/.env.local" ] && [ -f "apps/frontend/.env.local.example" ]; then
    cp "apps/frontend/.env.local.example" "apps/frontend/.env.local"
    echo -e "${GREEN}✅ 프론트엔드 .env.local 파일 생성됨${NC}"
fi
echo ""

# 파일 권한 설정
chmod +x scripts/*.sh 2>/dev/null || true

# 공유 패키지 빌드
echo -e "${BLUE}[5/7] 공유 패키지 빌드 중...${NC}"
if ! npm run build --workspace=packages/shared; then
    echo -e "${RED}❌ 공유 패키지 빌드에 실패했습니다.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 공유 패키지 빌드 완료${NC}"
echo ""

# 타입 체크
echo -e "${BLUE}[6/7] TypeScript 타입 체크 중...${NC}"
if npm run typecheck; then
    echo -e "${GREEN}✅ 타입 체크 완료${NC}"
else
    echo -e "${YELLOW}⚠️ 타입 체크에서 오류가 발생했습니다. 개발 중에 수정이 필요할 수 있습니다.${NC}"
fi
echo ""

# MongoDB 서비스 확인
echo -e "${BLUE}[7/7] MongoDB 서비스 확인 중...${NC}"
mongodb_running=false

# 다양한 방법으로 MongoDB 프로세스 확인
if command -v pgrep >/dev/null 2>&1 && pgrep -x "mongod" > /dev/null; then
    mongodb_running=true
elif command -v brew >/dev/null 2>&1 && brew services list 2>/dev/null | grep mongodb-community | grep started > /dev/null; then
    mongodb_running=true
elif command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet mongod 2>/dev/null; then
    mongodb_running=true
elif ps aux 2>/dev/null | grep -v grep | grep mongod > /dev/null; then
    mongodb_running=true
elif netstat -an 2>/dev/null | grep :27017 | grep LISTEN > /dev/null; then
    mongodb_running=true
fi

if [ "$mongodb_running" = true ]; then
    echo -e "${GREEN}✅ MongoDB 서비스가 실행 중입니다.${NC}"
else
    echo -e "${YELLOW}⚠️ MongoDB 서비스가 실행되지 않았습니다.${NC}"
    echo -e "${YELLOW}   서비스 시작 방법:${NC}"
    echo "   - macOS (Homebrew): brew services start mongodb/brew/mongodb-community"
    echo "   - Linux (systemd): sudo systemctl start mongod"
    echo "   - 수동 실행: mongod --dbpath /usr/local/var/mongodb"
    echo "   - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi
echo ""

echo -e "${GREEN}=========================================="
echo -e "           설정 완료!"
echo -e "==========================================${NC}"
echo ""
echo "이제 다음 명령어로 개발 서버를 실행할 수 있습니다:"
echo ""
echo "  npm run dev          (전체 서버 실행)"
echo "  npm run dev:frontend (프론트엔드만)"
echo "  npm run dev:backend  (백엔드만)"
echo ""
echo "또는 ./scripts/start.sh 파일을 실행하세요."
echo ""

read -p "지금 바로 개발 서버를 실행하시겠습니까? (y/n): " start_now
if [[ $start_now =~ ^[Yy]$ ]]; then
    echo ""
    echo "개발 서버를 실행 중..."
    exec npm run dev
else
    echo ""
    echo "설정이 완료되었습니다. 언제든지 'npm run dev' 명령어로 서버를 실행할 수 있습니다."
fi