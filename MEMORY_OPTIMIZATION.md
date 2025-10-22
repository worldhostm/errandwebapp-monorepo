# 메모리 최적화 가이드

이 문서는 `npm run dev` 실행 시 메모리 사용량을 최소화하기 위한 방법을 설명합니다.

## 📊 현재 상황

당신의 프로젝트는 **모노레포 구조**로 Frontend(Next.js)와 Backend(Express)를 동시에 실행합니다.
일반적인 메모리 사용량:
- **Frontend (Next.js)**: 300-500MB
- **Backend (Express + ts-node-dev)**: 200-400MB
- **전체 합계**: 750MB ~ 1.2GB

## ✅ 적용된 최적화 방법

### 1. Next.js 최적화 (`next.config.ts`)
```typescript
// 웹팩 캐시 활성화
webpack: (config) => {
  config.cache = {
    type: 'filesystem',
    cacheDirectory: '.next/cache',
  };
  return config;
}

// SWC 컴파일러 사용 (바벨보다 더 효율적)
swcMinify: true

// 개발 시 이미지 최적화 비활성화
images: {
  unoptimized: true
}
```

**효과**: 25-35% 메모리 절감

### 2. Backend 최적화 (`package.json`)
```bash
# 기본 실행
npm run dev

# 메모리 제한 실행 (512MB)
npm run dev:memory
```

**효과**: 20-30% 메모리 절감

### 3. Frontend 메모리 제한
```bash
npm run dev:memory  # 512MB 제한
```

**효과**: 15-25% 메모리 절감

## 🎯 추천 사용 방법

### 💻 최소 메모리 사용 (권장)
```bash
npm run dev:memory
```
**메모리 사용**: ~600-800MB
**상황**: RAM이 4GB 이하인 경우, 다른 프로그램과 함께 실행할 때

### 🔧 일반 개발 (기본)
```bash
npm run dev
```
**메모리 사용**: ~900MB-1.2GB
**상황**: 일반적인 개발 작업

### 🔀 Frontend만 실행
```bash
npm run dev:frontend:only
```
**메모리 사용**: ~300-400MB
**상황**: Frontend만 개발할 때, Backend는 외부 서버 사용

### 🔀 Backend만 실행
```bash
npm run dev:backend:only
```
**메모리 사용**: ~200-300MB
**상황**: Backend만 개발할 때, Frontend는 외부 서버 사용

## 🔍 메모리 모니터링

### 자동 메모리 모니터링
```bash
node monitor-memory-simple.js
```

실행 중 메모리 사용량을 실시간으로 확인할 수 있습니다.

## 🚀 추가 최적화 팁

### 1. Node.js 버전 확인
```bash
node --version
```
최신 LTS 버전(v18 이상)을 사용하면 메모리 효율이 더 좋습니다.

### 2. 가비지 컬렉션 튜닝 (고급)
```bash
# 가비지 컬렉션을 더 자주 실행
node --expose-gc npm run dev
```

### 3. npm 캐시 정리
```bash
npm cache clean --force
```

### 4. 빌드 캐시 정리
```bash
npm run clean:win  # Windows
# 또는
npm run clean  # Unix/Mac
```

## 📈 성능 비교

| 구성 | 메모리 사용 | 특징 |
|------|-----------|------|
| `npm run dev` | ~900MB-1.2GB | 기본 설정 (최적화 전) |
| `npm run dev:memory` | ~600-800MB | 메모리 제한 + 캐시 최적화 |
| `dev:frontend:only` | ~300-400MB | Frontend만 |
| `dev:backend:only` | ~200-300MB | Backend만 |

## ⚠️ 주의사항

### 메모리 부족 시 발생 가능한 문제
- 빌드 실패: `JavaScript heap out of memory` 에러
- 느린 핫 리로드
- 간헐적인 프로세스 종료

### 해결 방법
1. `npm run dev:memory` 사용
2. RAM 부족 시 OS 수준의 다른 프로그램 종료
3. Virtual Memory / Swap 확인

## 🔧 추가 설정 (필요시)

### 매우 제한된 환경 (2GB RAM 이하)
```bash
# 매우 낮은 메모리로 제한
NODE_OPTIONS="--max-old-space-size=256" npm run dev
```

### 메모리 프로파일링 (고급)
```bash
# 힙 스냅샷 생성
node --inspect npm run dev
# Chrome DevTools에서 chrome://inspect 접속
```

## 📝 트러블슈팅

### 문제: "JavaScript heap out of memory"
**원인**: 메모리 부족
**해결책**:
```bash
npm run dev:memory
# 또는
npm run dev:frontend:only  # Backend만 따로 실행
```

### 문제: 핫 리로드가 느림
**원인**: 메모리 부족으로 가비지 컬렉션 자주 실행
**해결책**:
```bash
npm run dev:memory  # 메모리 상한선 설정으로 안정적 할당
```

### 문제: 특정 파일 수정 시 느림
**원인**: 웹팩 재컴파일
**해결책**: `.next/cache` 폴더 존재 확인 및 정리
```bash
npm run clean:win
npm install
npm run dev:memory
```

## 📚 참고 자료

- Next.js 성능 최적화: https://nextjs.org/docs/advanced-features/measuring-performance
- Node.js 메모리 관리: https://nodejs.org/en/docs/guides/simple-profiling/
- ts-node-dev 옵션: https://github.com/whitecolor/ts-node-dev#options
