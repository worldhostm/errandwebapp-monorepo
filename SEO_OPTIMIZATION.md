# 부름이 플랫폼 SEO 최적화 작업 완료 문서

## 작업 개요
부름이 플랫폼의 검색엔진 최적화(SEO)를 위한 메타데이터 설정 및 관련 기능을 구현했습니다.

## 구현된 기능들

### 1. 메타데이터 최적화 (apps/frontend/app/layout.tsx)

#### 기본 메타데이터
- **Title**: "부름이 - 주변 심부름으로 부수입 벌기"
- **Description**: 플랫폼 취지에 맞는 상세한 설명 추가
- **Keywords**: 심부름, 부수입, 알바, 위치기반, 일자리, 사이드잡 등 타겟 키워드 설정
- **Language**: ko_KR (한국어) 설정

#### Open Graph (소셜 미디어 최적화)
- Facebook, LinkedIn 등에서 공유 시 최적화된 미리보기
- 이미지: /images/og-image.png (1200x630 권장 사이즈)
- 한국어 로케일 설정

#### Twitter Cards
- 트위터에서 공유 시 최적화된 카드 형태 미리보기
- Large image 카드 타입 설정

#### 검색엔진 최적화
- **Robots**: 인덱싱 허용, 크롤링 허용
- **Google Bot**: 이미지, 비디오 미리보기 최적화
- **Canonical URL**: 중복 콘텐츠 방지

#### 사이트 검증
- Google Search Console 연동 준비
- 네이버 웹마스터도구 연동 준비

### 2. 검색엔진용 파일 생성

#### robots.txt (apps/frontend/public/robots.txt)
- 모든 검색엔진에 사이트 크롤링 허용
- API 및 관리자 페이지 크롤링 차단
- Sitemap 위치 지정
- 정중한 크롤링을 위한 지연 시간 설정

#### 사이트맵 (apps/frontend/app/sitemap.ts)
- 동적 XML 사이트맵 생성
- 주요 페이지별 우선순위 및 갱신 빈도 설정
- 검색, 등록, 프로필 등 핵심 페이지 포함

#### 웹 앱 매니페스트 (apps/frontend/app/manifest.ts)
- PWA(Progressive Web App) 지원 준비
- 모바일 환경 최적화
- 앱 아이콘 설정 (다양한 사이즈)
- 독립형 실행 모드 설정

### 3. 구조화된 데이터 (JSON-LD)

#### JsonLd 컴포넌트 (components/JsonLd.tsx)
검색엔진이 이해할 수 있는 구조화된 데이터 제공:

1. **Organization Schema**: 부름이 조직 정보
2. **Service Schema**: 심부름 매칭 서비스 정보  
3. **WebApplication Schema**: 웹 애플리케이션 정보

#### 검색엔진 혜택
- Google 검색 결과에서 리치 스니펫 표시 가능
- 지역 비즈니스로 인식되어 지역 검색 결과 노출 향상
- 서비스 카테고리 명확화

### 4. UI/UX 개선

#### 브랜딩 통일
- 기존 "심부름" → "부름이"로 브랜딩 통일
- 헤더 타이틀 및 웰컴 메시지 업데이트
- 플랫폼 취지에 맞는 메시지로 개선

## 추가 권장사항

### 1. 이미지 파일 추가 필요
다음 이미지들을 추가해야 SEO 효과가 극대화됩니다:

```
/public/images/og-image.png (1200x630px) - 소셜 공유용
/public/icon-192x192.png - PWA 아이콘
/public/icon-512x512.png - PWA 아이콘
/public/icon-maskable-192x192.png - 마스크 가능한 아이콘
/public/icon-maskable-512x512.png - 마스크 가능한 아이콘
/public/logo.png - 로고 이미지
```

### 2. 검색엔진 등록
구현 완료 후 다음 검색엔진에 사이트를 등록하세요:

- **Google Search Console**: https://search.google.com/search-console
- **네이버 웹마스터도구**: https://searchadvisor.naver.com
- **Bing 웹마스터도구**: https://www.bing.com/webmaster

### 3. 성능 최적화
- 이미지 최적화 (WebP 형식 권장)
- 페이지 로딩 속도 개선
- Core Web Vitals 최적화

### 4. 콘텐츠 SEO
- 각 페이지별 고유한 메타 제목/설명 설정
- 심부름 상세 페이지에 구조화된 데이터 추가
- 지역별 페이지 생성 고려

## 검증 방법

### 1. 메타데이터 확인
- 브라우저 개발자도구에서 `<head>` 태그 확인
- 소셜 미디어 디버거 도구 사용:
  - Facebook: https://developers.facebook.com/tools/debug
  - Twitter: https://cards-dev.twitter.com/validator

### 2. 구조화된 데이터 검증
- Google Rich Results Test: https://search.google.com/test/rich-results

### 3. 사이트맵 및 robots.txt 확인
- https://your-domain.com/robots.txt
- https://your-domain.com/sitemap.xml

## 기대 효과

1. **검색엔진 노출 향상**: 관련 키워드 검색 시 상위 노출 가능성 증가
2. **소셜 미디어 공유 최적화**: 링크 공유 시 매력적인 미리보기 제공
3. **지역 검색 향상**: 위치기반 서비스 특성을 활용한 지역 검색 노출
4. **사용자 경험 개선**: 명확한 브랜딩과 서비스 설명으로 사용자 이해도 향상
5. **PWA 지원**: 모바일 사용자의 앱과 같은 경험 제공 준비

## 주의사항

- Google Search Console과 네이버 웹마스터도구에 등록할 때는 실제 verification 코드로 교체하세요.
- 도메인이 확정되면 canonical URL과 sitemap의 baseUrl을 실제 도메인으로 변경하세요.
- 이미지 파일들을 추가해야 완전한 SEO 최적화가 완성됩니다.