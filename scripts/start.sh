#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo -e "   위치 기반 심부름 웹앱 실행 스크립트"
echo -e "==========================================${NC}"
echo ""

# 현재 디렉토리가 프로젝트 루트인지 확인
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}❌ 프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
    exit 1
fi

# MongoDB 연결 확인
echo -e "${BLUE}MongoDB 연결 확인 중...${NC}"
mongodb_running=false

# mongosh 또는 mongo 명령어로 연결 테스트
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.adminCommand('ismaster')" --quiet &> /dev/null; then
        mongodb_running=true
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.adminCommand('ismaster')" --quiet &> /dev/null; then
        mongodb_running=true
    fi
fi

if [ "$mongodb_running" = true ]; then
    echo -e "${GREEN}✅ MongoDB 연결 성공${NC}"
else
    echo -e "${RED}❌ MongoDB에 연결할 수 없습니다.${NC}"
    echo ""
    echo -e "${YELLOW}MongoDB 실행 방법:${NC}"
    echo "1. macOS (Homebrew): brew services start mongodb/brew/mongodb-community"
    echo "2. Linux (systemd): sudo systemctl start mongod"
    echo "3. 수동 실행: mongod"
    echo "4. Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
    read -p "MongoDB 없이 계속하시겠습니까? (y/n): " continue_without_mongo
    if [[ ! $continue_without_mongo =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 메뉴 표시
echo -e "${CYAN}실행할 서비스를 선택하세요:${NC}"
echo "1. 전체 서비스 (프론트엔드 + 백엔드)"
echo "2. 프론트엔드만 (포트 3000)"
echo "3. 백엔드만 (포트 5000)"
echo "4. 빌드 및 프로덕션 실행"
echo "5. 타입 체크"
echo "6. 린트 체크"
echo "7. 개발 도구 (개발자용)"
echo ""

read -p "선택하세요 (1-7): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}전체 개발 서버를 실행합니다...${NC}"
        echo -e "${CYAN}프론트엔드: http://localhost:3000${NC}"
        echo -e "${CYAN}백엔드: http://localhost:5000${NC}"
        echo ""
        echo -e "${YELLOW}Ctrl+C 로 서버를 종료할 수 있습니다.${NC}"
        echo ""
        exec npm run dev
        ;;
    2)
        echo ""
        echo -e "${GREEN}프론트엔드 서버를 실행합니다...${NC}"
        echo -e "${CYAN}URL: http://localhost:3000${NC}"
        echo ""
        exec npm run dev:frontend
        ;;
    3)
        echo ""
        echo -e "${GREEN}백엔드 서버를 실행합니다...${NC}"
        echo -e "${CYAN}URL: http://localhost:5000${NC}"
        echo -e "${CYAN}API Health Check: http://localhost:5000/api/health${NC}"
        echo ""
        exec npm run dev:backend
        ;;
    4)
        echo ""
        echo -e "${GREEN}프로젝트를 빌드하고 프로덕션 모드로 실행합니다...${NC}"
        echo ""
        if npm run build; then
            echo ""
            echo -e "${GREEN}빌드 성공! 프로덕션 서버를 실행합니다...${NC}"
            exec npm run start
        else
            echo -e "${RED}❌ 빌드에 실패했습니다.${NC}"
            exit 1
        fi
        ;;
    5)
        echo ""
        echo -e "${GREEN}TypeScript 타입 체크를 실행합니다...${NC}"
        npm run typecheck
        echo ""
        read -p "아무 키나 누르세요..." -n1 -s
        ;;
    6)
        echo ""
        echo -e "${GREEN}ESLint 체크를 실행합니다...${NC}"
        npm run lint
        echo ""
        read -p "아무 키나 누르세요..." -n1 -s
        ;;
    7)
        echo ""
        echo -e "${CYAN}개발 도구 메뉴:${NC}"
        echo "1. 패키지 정보 확인"
        echo "2. 포트 사용 상태 확인"
        echo "3. MongoDB 상태 확인"
        echo "4. 로그 파일 확인"
        echo "5. 캐시 초기화"
        echo ""
        read -p "선택하세요 (1-5): " dev_choice
        
        case $dev_choice in
            1)
                echo ""
                echo -e "${GREEN}패키지 정보:${NC}"
                echo "Node.js: $(node --version)"
                echo "npm: $(npm --version)"
                echo "프로젝트 의존성:"
                npm list --depth=0
                ;;
            2)
                echo ""
                echo -e "${GREEN}포트 사용 상태:${NC}"
                echo "포트 3000 (프론트엔드):"
                lsof -ti:3000 || echo "사용 중이지 않음"
                echo "포트 5000 (백엔드):"
                lsof -ti:5000 || echo "사용 중이지 않음"
                echo "포트 27017 (MongoDB):"
                lsof -ti:27017 || echo "사용 중이지 않음"
                ;;
            3)
                echo ""
                echo -e "${GREEN}MongoDB 상태 확인:${NC}"
                if command -v mongosh &> /dev/null; then
                    mongosh --eval "db.runCommand({connectionStatus: 1})" --quiet
                elif command -v mongo &> /dev/null; then
                    mongo --eval "db.runCommand({connectionStatus: 1})" --quiet
                else
                    echo "MongoDB 클라이언트가 설치되지 않음"
                fi
                ;;
            4)
                echo ""
                echo -e "${GREEN}최근 로그 파일:${NC}"
                find . -name "*.log" -type f -exec ls -la {} \; 2>/dev/null || echo "로그 파일이 없습니다."
                ;;
            5)
                echo ""
                echo -e "${GREEN}캐시 초기화 중...${NC}"
                npm cache clean --force
                rm -rf node_modules package-lock.json
                rm -rf apps/*/node_modules apps/*/package-lock.json
                rm -rf apps/*/.next apps/*/dist
                echo "캐시가 초기화되었습니다. npm install을 실행해주세요."
                ;;
        esac
        echo ""
        read -p "아무 키나 누르세요..." -n1 -s
        ;;
    *)
        echo -e "${RED}잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo ""
echo "스크립트가 종료되었습니다."