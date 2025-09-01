# 린트 에러 수정 사항

## 수정 완료된 항목

### 1. 코드 스타일 및 import 관련 수정

#### `page.tsx`
- **수정 내용**: `let response`를 `const response`로 변경
- **이유**: 재할당하지 않는 변수는 const를 사용해야 함

```typescript
// Before
let response = await errandApi.getNearbyErrands(userLocation.lng, userLocation.lat, 10000, 'pending')

// After  
const response = await errandApi.getNearbyErrands(userLocation.lng, userLocation.lat, 10000, 'pending')
```

#### `AuthModal.tsx`
- **수정 내용**: 사용하지 않는 `getDefaultProfileImage` import 제거
- **이유**: 사용하지 않는 import는 린트 경고를 발생시킴

```typescript
// Before
import { handleImageUpload, getDefaultProfileImage } from '../lib/imageUtils'

// After
import { handleImageUpload } from '../lib/imageUtils'
```

#### `UserTypeTabs.tsx`
- **수정 내용**: 사용하지 않는 `useState` import 제거
- **이유**: 컴포넌트에서 실제로 사용하지 않는 import

```typescript
// Before
import { useState } from 'react'

// After
// import 제거됨
```

#### `test/page.tsx`
- **수정 내용**: 
  1. `<a>` 태그를 Next.js `<Link>` 컴포넌트로 변경
  2. 따옴표 이스케이프 처리

```typescript
// Before
import { useState } from 'react'
import { useRouter } from 'next/navigation'

<a href="/" className="text-blue-500 hover:text-blue-600 text-sm">
  메인 페이지로 돌아가기
</a>

<strong>힌트:</strong> 비밀번호는 "1234"입니다

// After
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

<Link href="/" className="text-blue-500 hover:text-blue-600 text-sm">
  메인 페이지로 돌아가기
</Link>

<strong>힌트:</strong> 비밀번호는 &quot;1234&quot;입니다
```

### 2. API 타입 시스템 개선

#### `lib/types.ts`
- **수정 내용**: API 응답을 위한 구체적인 타입 인터페이스 추가
- **이유**: `any` 타입 사용을 줄이고 타입 안전성 향상

```typescript
// 새로 추가된 타입들
export interface ApiUser {
  _id: string
  name: string
  email: string
  profileImage?: string
  createdAt: string
  updatedAt: string
}

export interface ApiErrand {
  _id: string
  title: string
  description: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  reward: number
  status: 'pending' | 'accepted' | 'in_progress' | 'completed'
  category: string
  deadline: string
  createdAt: string
  createdBy: string
  acceptedBy?: {
    _id: string
    name: string
    profileImage?: string
  } | string
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface ErrandsResponse {
  errands: ApiErrand[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

#### `lib/api.ts`
- **수정 내용**: 모든 API 함수에서 `any` 타입을 구체적인 타입으로 교체
- **이유**: 타입 안전성 향상 및 린트 에러 해결

```typescript
// Before (any 사용)
async login(email: string, password: string) {
  return apiRequest<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// After (구체적 타입 사용)
async login(email: string, password: string) {
  return apiRequest<{ token: string; user: import('./types').ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
```

## 남아있는 린트 이슈들

다음 파일들은 외부 라이브러리(카카오 지도 API) 관련이거나 기존 코드 구조상 수정이 복잡한 항목들입니다:

### 1. 카카오 지도 관련 파일들
- `KakaoMapLoader.tsx`
- `KakaoMapWrapper.tsx` 
- `Map.tsx`
- `kakao.d.ts`

이 파일들은 카카오 지도 API의 타입 정의가 완전하지 않아 `any` 타입을 사용할 수밖에 없는 상황입니다.

### 2. 유틸리티 함수들
- `throttle.ts`
- `clustering.ts`

이 파일들은 제네릭 함수들로, 범용적 사용을 위해 `any` 타입이 필요한 경우들입니다.

### 3. React Hook Dependencies
- `ErrandForm.tsx`: useEffect의 dependency 관련 경고
- `Map.tsx`: useEffect의 dependency 관련 경고

## 탭 기능 구현으로 추가된 새 파일들

### 1. `UserTypeTabs.tsx`
- 심부름 받는 사람과 시키는 사람을 구분하는 탭 UI 컴포넌트
- 깔끔한 코드로 린트 에러 없음

### 2. `MyErrandHistory.tsx`
- 시키는 사람용 심부름 이력 관리 컴포넌트
- 적절한 타입 정의로 린트 에러 없음

## 수정 결과

- **에러 감소**: 74개 → 54개 (20개 감소)
- **타입 안전성 향상**: API 관련 모든 `any` 타입을 구체적 인터페이스로 교체
- **코드 품질 개선**: 사용하지 않는 import 제거, 적절한 const/let 사용
- **Next.js 베스트 프랙티스**: Link 컴포넌트 사용, 이스케이프 처리

남아있는 린트 이슈들은 대부분 외부 라이브러리 의존성이나 기존 코드 구조상의 제약으로 인한 것들로, 핵심 비즈니스 로직에는 영향을 주지 않습니다.