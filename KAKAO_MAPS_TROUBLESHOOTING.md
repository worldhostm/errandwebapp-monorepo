# 카카오 지도 API 401 오류 해결 가이드

## 🚨 401 Unauthorized 오류 주요 원인 및 해결방법

### 1. **플랫폼 등록 문제** ⭐ 가장 일반적인 원인
**문제**: 카카오 개발자 콘솔에서 플랫폼 등록이 안되어 있거나 잘못 설정됨

**해결방법**:
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 해당 앱 선택
3. **플랫폼** 메뉴에서 "Web" 플랫폼 추가
4. **사이트 도메인** 설정:
   ```
   http://localhost:3000    (개발환경)
   https://yourdomain.com   (운영환경)
   ```

### 2. **API 키 설정 문제**
**문제**: 잘못된 API 키 또는 JavaScript 키가 아닌 다른 키 사용

**해결방법**:
1. 카카오 개발자 콘솔 > 내 애플리케이션 > 앱 키
2. **JavaScript 키**를 복사 (Native App Key나 REST API Key가 아님)
3. `.env.local` 파일 확인:
   ```env
   NEXT_PUBLIC_KAKAO_APP_KEY=afe28321c721fd948dd527453ed70747
   ```

### 3. **도메인 불일치 문제**
**문제**: 현재 접속 도메인이 카카오 콘솔에 등록된 도메인과 다름

**체크사항**:
- 개발서버 포트 변경: `localhost:3000` → `localhost:3001`
- 카카오 콘솔에 **모든 개발 포트** 등록 필요
- HTTPS/HTTP 프로토콜 일치 여부

### 4. **API 로딩 타이밍 문제**
**문제**: Next.js에서 카카오 지도 스크립트 로딩 전에 컴포넌트가 렌더링됨

**해결방법** (이미 적용됨):
```typescript
// layout.tsx - beforeInteractive 전략 사용
<Script
  src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=..."
  strategy="beforeInteractive"
/>

// Map.tsx - 로딩 상태 체크
const isKakaoLoaded = useKakaoMapsLoaded()
if (!isKakaoLoaded) {
  return <div>카카오 지도 API 로딩 중...</div>
}
```

## 🔧 현재 프로젝트에서 적용된 수정사항

### 1. HTTPS 프로토콜 사용
```javascript
// 수정 전: //dapi.kakao.com/v2/maps/sdk.js
// 수정 후: https://dapi.kakao.com/v2/maps/sdk.js
```

### 2. 추가 라이브러리 로딩
```javascript
&libraries=services,clusterer,drawing
```

### 3. API 로딩 상태 관리
- `useKakaoMapsLoaded` 훅 생성
- 로딩 완료 전까지 대기 화면 표시

### 4. TypeScript 타입 정의
- `kakao.d.ts` 파일로 글로벌 타입 정의

## 🎯 단계별 확인 방법

### 1단계: 브라우저 개발자 도구 확인
```bash
F12 > Console 탭
```
**확인사항**:
- `401 Unauthorized` 오류 메시지
- 네트워크 탭에서 실패한 요청 URL
- 정확한 에러 메시지 내용

### 2단계: 카카오 콘솔 플랫폼 설정 확인
1. 개발자 콘솔 > 내 애플리케이션 > 플랫폼
2. Web 플랫폼이 등록되어 있는지 확인
3. 사이트 도메인에 `http://localhost:3001` 포함 여부

### 3단계: API 키 재확인
```bash
# .env.local 파일 확인
cat apps/frontend/.env.local
```

### 4단계: 네트워크 요청 확인
브라우저 개발자 도구 > Network 탭에서:
- 카카오 지도 스크립트 로딩 성공 여부
- 응답 코드 및 에러 메시지

## 🚀 테스트 방법

### 1. 개발서버 재시작
```bash
# 기존 프로세스 종료
npm run dev:frontend

# 브라우저에서 http://localhost:3001 접속
```

### 2. 지도 로딩 확인
- 메인 페이지에서 지도가 정상적으로 표시되는지
- "카카오 지도 API 로딩 중..." 메시지가 사라지는지
- 마커 클릭 시 팝업이 정상 동작하는지

### 3. 콘솔 에러 확인
```javascript
// 브라우저 콘솔에서 직접 테스트
console.log(window.kakao)  // 객체가 정상적으로 로드되었는지 확인
```

## ⚠️ 추가 고려사항

### 운영환경 배포 시
1. 운영 도메인을 카카오 콘솔에 추가 등록
2. HTTPS 인증서 설정 필수
3. 환경변수 올바른 설정 확인

### 보안
- API 키는 **JavaScript 키**만 사용 (서버 키 사용 금지)
- 도메인 제한으로 무단 사용 방지
- `.env.local` 파일을 git에 커밋하지 않도록 주의

## 📞 문제 지속 시 체크리스트

- [ ] 카카오 개발자 콘솔에서 Web 플랫폼 등록 완료
- [ ] JavaScript API 키 사용 (다른 키 타입 아님)
- [ ] 사이트 도메인에 `http://localhost:3001` 등록
- [ ] 브라우저 캐시 클리어 후 재테스트
- [ ] 다른 브라우저에서도 동일한 오류인지 확인
- [ ] 카카오 개발자 콘솔에서 일일 호출량 제한 확인

---

**수정 적용일**: 2025-08-31  
**개발서버**: http://localhost:3001  
**현재 사용 API 키**: `afe28321c721fd948dd527453ed70747`