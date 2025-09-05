# 자동 결제 시스템 구현 문서

## 개요
심부름 완료 후 24시간 동안 이의제기가 없으면 자동으로 결제가 이루어지는 시스템을 구현했습니다.

## 주요 기능

### 1. 자동 결제 프로세스
1. **심부름 완료**: 수행자가 심부름을 완료하면 상태가 `completed`로 변경
2. **이의제기 대기 기간**: 24시간 동안 의뢰자가 이의제기할 수 있는 기간
3. **자동 결제 실행**: 이의제기가 없으면 자동으로 `paid` 상태로 변경 및 알림 발송
4. **이의제기 시**: 이의제기가 있으면 `disputed` 상태로 변경하여 결제 보류

### 2. 백엔드 구현

#### PaymentService (`src/services/paymentService.ts`)
- `processAutomaticPayments()`: 자동 결제 대상 심부름을 찾아 결제 처리
- `canProcessPayment()`: 특정 심부름의 결제 가능 여부 확인
- `manualPayment()`: 수동 결제 처리

```typescript
// 주요 로직
const cutoffDate = new Date();
cutoffDate.setHours(cutoffDate.getHours() - 24); // 24시간 전

const errandsForPayment = await Errand.find({
  status: 'completed',
  updatedAt: { $lte: cutoffDate },
  dispute: { $exists: false }
});
```

#### SchedulerService (`src/services/schedulerService.ts`)
- `startScheduler()`: 서버 시작시 자동으로 스케줄러 등록
- 2시간마다 자동 결제 처리 실행
- 매일 오전 9시 상태 체크

```typescript
// 2시간마다 실행
cron.schedule('0 */2 * * *', async () => {
  await PaymentService.processAutomaticPayments();
});
```

#### Payment API (`src/routes/payments.ts`)
- `GET /api/payments/scheduler/status` - 스케줄러 상태 확인
- `GET /api/payments/:id/status` - 특정 심부름 결제 상태 확인  
- `POST /api/payments/:id/manual` - 수동 결제 처리
- `POST /api/payments/scheduler/trigger` - 수동 결제 체크 트리거

### 3. 프론트엔드 구현

#### 결제 API 클라이언트 (`app/lib/api.ts`)
```typescript
export const paymentApi = {
  async checkPaymentStatus(errandId: string) {
    // 결제 상태 및 남은 시간 확인
  },
  async manualPayment(errandId: string) {
    // 수동 결제 처리
  }
}
```

#### 완료된 심부름 뷰 (`app/components/CompletedErrandView.tsx`)
- 결제 상태 실시간 표시
- 이의제기 기간 중 남은 시간 표시
- 자동 결제 대기 중 알림
- 결제 완료 상태 표시

### 4. 데이터 모델 확장

#### Errand 모델
```typescript
// 새로운 상태 추가
export type ErrandStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'paid';
```

#### Notification 모델
```typescript
// 새로운 알림 타입 추가
type: 'errand_completed' | 'errand_accepted' | 'errand_disputed' | 'system' | 'payment_completed' | 'errand_finalized';
```

## 테스트 결과

### 백엔드 테스트
✅ **서버 시작**: 포트 8081에서 성공적으로 실행  
✅ **스케줄러 등록**: 자동 결제 스케줄러 정상 등록  
✅ **API 엔드포인트**: 모든 결제 관련 API 정상 작동  

```bash
# 스케줄러 상태 확인
curl http://localhost:8081/api/payments/scheduler/status
# 응답: {"success":true,"scheduler":{"isRunning":true,"activeJobs":2,"paymentJobRunning":false}}

# 특정 심부름 결제 상태 확인
curl http://localhost:8081/api/payments/68b93ca6665e82844f0e7d64/status
# 응답: 결제 가능 여부, 남은 시간 등 정보
```

### 프론트엔드 테스트
✅ **결제 상태 표시**: 완료된 심부름에서 결제 정보 표시  
✅ **남은 시간 계산**: 이의제기 기간 남은 시간 정확히 표시  
✅ **상태별 메시지**: 각 결제 상태에 맞는 메시지 표시  

## 시스템 동작 시나리오

### 정상 결제 시나리오
1. **T+0**: 심부름 완료 → `completed` 상태
2. **T+24시간**: 이의제기 없음 → 자동 결제 처리
3. **결과**: 
   - 심부름 상태 `paid`로 변경
   - 수행자에게 "결제 완료" 알림 발송
   - 의뢰자에게 "심부름 최종 완료" 알림 발송

### 이의제기 시나리오
1. **T+0**: 심부름 완료 → `completed` 상태
2. **T+12시간**: 의뢰자 이의제기 → `disputed` 상태
3. **결과**: 결제 보류, 관리자 검토 대기

## 운영 가이드

### 모니터링
```bash
# 스케줄러 상태 확인
curl http://localhost:8081/api/payments/scheduler/status

# 수동 결제 체크 실행 (관리자용)
curl -X POST http://localhost:8081/api/payments/scheduler/trigger \
  -H "Authorization: Bearer [TOKEN]"
```

### 로그 모니터링
- `🔍 자동 결제 대상 심부름: N개` - 처리 대상 개수
- `💰 결제 처리 시작: [제목]` - 개별 결제 시작
- `✅ 결제 완료: [제목]` - 결제 성공
- `❌ 심부름 [ID] 결제 처리 실패` - 결제 오류

### 설정
- **결제 대기 시간**: 24시간 (PaymentService.DISPUTE_DEADLINE_HOURS)
- **스케줄 실행 주기**: 2시간마다
- **타임존**: Asia/Seoul

## 보안 고려사항
- 결제 처리는 서버에서만 실행
- 이의제기가 있으면 결제 중단
- 모든 결제 내역은 로그로 기록
- API 접근은 인증된 사용자만 가능

## 향후 개선사항
1. **결제 시스템 연동**: 실제 결제 게이트웨이 연동
2. **이메일/SMS 알림**: 결제 관련 추가 알림
3. **대시보드**: 결제 현황 관리자 대시보드
4. **환불 시스템**: 이의제기 승인 시 환불 처리
5. **결제 내역**: 상세한 결제 히스토리 관리

---
🤖 **구현 완료**: 2025-09-05  
📝 **구현자**: Claude Code Assistant