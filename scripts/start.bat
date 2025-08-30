@echo off
echo ==========================================
echo    위치 기반 심부름 웹앱 실행 스크립트
echo ==========================================
echo.

REM MongoDB 실행 확인
echo MongoDB 연결 확인 중...
mongosh --eval "db.adminCommand('ismaster')" --quiet >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ MongoDB에 연결할 수 없습니다.
    echo.
    echo MongoDB 실행 방법:
    echo 1. 서비스로 설치된 경우: net start MongoDB
    echo 2. 수동 실행: mongod
    echo 3. Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
    echo.
    set /p continue="MongoDB 없이 계속하시겠습니까? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo ✅ MongoDB 연결 성공
)
echo.

REM 메뉴 선택
echo 실행할 서비스를 선택하세요:
echo 1. 전체 서비스 (프론트엔드 + 백엔드)
echo 2. 프론트엔드만 (포트 3000)
echo 3. 백엔드만 (포트 5000)
echo 4. 빌드 및 프로덕션 실행
echo 5. 타입 체크
echo 6. 린트 체크
echo.

set /p choice="선택하세요 (1-6): "

if "%choice%"=="1" (
    echo.
    echo 전체 개발 서버를 실행합니다...
    echo 프론트엔드: http://localhost:3000
    echo 백엔드: http://localhost:5000
    echo.
    echo Ctrl+C 로 서버를 종료할 수 있습니다.
    echo.
    call npm run dev
) else if "%choice%"=="2" (
    echo.
    echo 프론트엔드 서버를 실행합니다...
    echo URL: http://localhost:3000
    echo.
    call npm run dev:frontend
) else if "%choice%"=="3" (
    echo.
    echo 백엔드 서버를 실행합니다...
    echo URL: http://localhost:5000
    echo API Health Check: http://localhost:5000/api/health
    echo.
    call npm run dev:backend
) else if "%choice%"=="4" (
    echo.
    echo 프로젝트를 빌드하고 프로덕션 모드로 실행합니다...
    echo.
    call npm run build
    if %errorLevel% == 0 (
        echo.
        echo 빌드 성공! 프로덕션 서버를 실행합니다...
        call npm run start
    ) else (
        echo ❌ 빌드에 실패했습니다.
        pause
        exit /b 1
    )
) else if "%choice%"=="5" (
    echo.
    echo TypeScript 타입 체크를 실행합니다...
    call npm run typecheck
    echo.
    pause
) else if "%choice%"=="6" (
    echo.
    echo ESLint 체크를 실행합니다...
    call npm run lint
    echo.
    pause
) else (
    echo 잘못된 선택입니다.
    pause
    exit /b 1
)

if not "%choice%"=="5" if not "%choice%"=="6" (
    echo.
    echo 서버가 종료되었습니다.
)

pause