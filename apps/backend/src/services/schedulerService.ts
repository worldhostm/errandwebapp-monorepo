import * as cron from 'node-cron';
import { PaymentService } from './paymentService';

export class SchedulerService {
  private static paymentJobRunning = false;

  static startScheduler(): void {
    console.log('🚀 자동 결제 스케줄러 시작');

    cron.schedule('0 */2 * * *', async () => {
      if (this.paymentJobRunning) {
        console.log('⏳ 이전 결제 작업이 아직 실행 중이므로 건너뜀');
        return;
      }

      this.paymentJobRunning = true;
      console.log('🔄 자동 결제 작업 시작 -', new Date().toLocaleString('ko-KR'));

      try {
        await PaymentService.processAutomaticPayments();
        console.log('✅ 자동 결제 작업 완료 -', new Date().toLocaleString('ko-KR'));
      } catch (error) {
        console.error('❌ 자동 결제 작업 실패:', error);
      } finally {
        this.paymentJobRunning = false;
      }
    }, {
      timezone: 'Asia/Seoul'
    });

    cron.schedule('0 9 * * *', () => {
      console.log('📊 일일 결제 현황 체크 -', new Date().toLocaleString('ko-KR'));
    }, {
      timezone: 'Asia/Seoul'
    });

    console.log('✅ 자동 결제 스케줄러 등록 완료:');
    console.log('   - 결제 처리: 2시간마다 실행');
    console.log('   - 상태 체크: 매일 오전 9시');
  }

  static stopScheduler(): void {
    cron.getTasks().forEach(task => task.stop());
    console.log('🛑 자동 결제 스케줄러 중지');
  }

  static getSchedulerStatus(): { 
    isRunning: boolean; 
    activeJobs: number; 
    paymentJobRunning: boolean;
  } {
    const activeTasks = cron.getTasks();
    return {
      isRunning: activeTasks.size > 0,
      activeJobs: activeTasks.size,
      paymentJobRunning: this.paymentJobRunning
    };
  }
}