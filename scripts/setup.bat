@echo off
echo ==========================================
echo     위치 기반 심부름 웹앱 설정 스크립트
echo ==========================================
echo.

REM 관리자 권한 체크
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 관리자 권한으로 실행 중...
    echo.
) else (
    echo 경고: 일부 기능은 관리자 권한이 필요할 수 있습니다.
    echo.
)

REM Node.js 설치 확인
echo [1/7] Node.js 버전 확인 중...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    https://nodejs.org 에서 Node.js 18.0+ 을 설치해주세요.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 버전: %NODE_VERSION%
echo.

REM npm 버전 확인
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ npm이 설치되어 있지 않습니다.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm 버전: %NPM_VERSION%
echo.

REM MongoDB 설치 확인
echo [2/7] MongoDB 연결 확인 중...
mongosh --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ MongoDB Shell(mongosh)이 설치되어 있지 않습니다.
    echo    MongoDB를 설치하거나 Docker로 실행해주세요.
    echo    설치 방법:
    echo    1. MongoDB Community Server: https://www.mongodb.com/try/download/community
    echo    2. Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
    echo.
    set /p continue="MongoDB 없이 계속하시겠습니까? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo ✅ MongoDB Shell이 설치되어 있습니다.
    echo.
)

REM 의존성 설치
echo [3/7] 프로젝트 의존성 설치 중...
call npm install
if %errorLevel% neq 0 (
    echo ❌ 의존성 설치에 실패했습니다.
    pause
    exit /b 1
)
echo ✅ 의존성 설치 완료
echo.

REM 환경 변수 파일 설정
echo [4/7] 환경 변수 파일 설정 중...

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ 루트 .env 파일 생성됨
    )
)

if not exist "apps\backend\.env" (
    if exist "apps\backend\.env.example" (
        copy "apps\backend\.env.example" "apps\backend\.env" >nul
        echo ✅ 백엔드 .env 파일 생성됨
    )
)

if not exist "apps\frontend\.env.local" (
    if exist "apps\frontend\.env.local.example" (
        copy "apps\frontend\.env.local.example" "apps\frontend\.env.local" >nul
        echo ✅ 프론트엔드 .env.local 파일 생성됨
    )
)
echo.

REM 공유 패키지 빌드
echo [5/7] 공유 패키지 빌드 중...
call npm run build --workspace=packages/shared
if %errorLevel% neq 0 (
    echo ❌ 공유 패키지 빌드에 실패했습니다.
    pause
    exit /b 1
)
echo ✅ 공유 패키지 빌드 완료
echo.

REM 타입 체크
echo [6/7] TypeScript 타입 체크 중...
call npm run typecheck
if %errorLevel% neq 0 (
    echo ⚠️ 타입 체크에서 오류가 발생했습니다. 개발 중에 수정이 필요할 수 있습니다.
) else (
    echo ✅ 타입 체크 완료
)
echo.

REM MongoDB 실행 안내
echo [7/7] MongoDB 서비스 확인 중...
sc query "MongoDB" | find "RUNNING" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ MongoDB 서비스가 실행 중입니다.
) else (
    echo ⚠️ MongoDB 서비스가 실행되지 않았습니다.
    echo    서비스 시작 방법:
    echo    1. 서비스로 설치된 경우: net start MongoDB
    echo    2. 수동 실행: mongod --dbpath C:\data\db
    echo    3. Docker 사용: docker run -d -p 27017:27017 --name mongodb mongo:latest
)
echo.

echo ==========================================
echo            설정 완료!
echo ==========================================
echo.
echo 이제 다음 명령어로 개발 서버를 실행할 수 있습니다:
echo.
echo   npm run dev          (전체 서버 실행)
echo   npm run dev:frontend (프론트엔드만)
echo   npm run dev:backend  (백엔드만)
echo.
echo 또는 scripts\start.bat 파일을 실행하세요.
echo.

set /p start_now="지금 바로 개발 서버를 실행하시겠습니까? (y/n): "
if /i "%start_now%"=="y" (
    echo.
    echo 개발 서버를 실행 중...
    call npm run dev
) else (
    echo.
    echo 설정이 완료되었습니다. 언제든지 'npm run dev' 명령어로 서버를 실행할 수 있습니다.
)

pause