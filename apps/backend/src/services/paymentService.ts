import Errand from '../models/Errand';
import { createNotification } from '../controllers/notificationController';
import mongoose from 'mongoose';

interface PaymentResult {
  success: boolean;
  message: string;
}

interface ProcessPaymentResult {
  errandId: string;
  title: string;
  reward: number;
  currency: string;
  success: boolean;
  error?: string;
}

export class PaymentService {
  private static readonly DISPUTE_DEADLINE_HOURS = 24;

  static async processAutomaticPayments(): Promise<ProcessPaymentResult[]> {
    const results: ProcessPaymentResult[] = [];
    
    try {
      const cutoffDate = this.getPaymentCutoffDate();
      const errandsForPayment = await this.getEligibleErrandsForPayment(cutoffDate);

      console.log(`🔍 자동 결제 대상 심부름: ${errandsForPayment.length}개`);

      for (const errand of errandsForPayment) {
        try {
          await this.processPayment(errand);
          results.push({
            errandId: errand.id,
            title: errand.title,
            reward: errand.reward,
            currency: errand.currency || 'KRW',
            success: true
          });
        } catch (error) {
          console.error(`❌ 심부름 ${errand.id} 결제 처리 실패:`, error);
          results.push({
            errandId: errand.id,
            title: errand.title,
            reward: errand.reward,
            currency: errand.currency || 'KRW',
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          });
        }
      }
    } catch (error) {
      console.error('❌ 자동 결제 처리 오류:', error);
    }
    
    return results;
  }

  private static async processPayment(errand: any): Promise<void> {
    this.validateErrandForPayment(errand);
    
    console.log(`💰 결제 처리 시작: ${errand.title} (ID: ${errand.id})`);

    await this.updateErrandToPaid(errand);
    await this.sendPaymentNotifications(errand);

    console.log(`✅ 결제 완료: ${errand.title} - ${errand.reward.toLocaleString()}${errand.currency === 'KRW' ? '원' : '달러'}`);
  }

  static async canProcessPayment(errandId: string): Promise<boolean> {
    try {
      const errand = await Errand.findById(errandId);
      if (!errand) return false;

      if (errand.status !== 'completed') return false;
      if (errand.dispute) return false;

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.DISPUTE_DEADLINE_HOURS);

      return errand.updatedAt <= cutoffDate;
    } catch (error) {
      console.error('결제 가능 여부 확인 오류:', error);
      return false;
    }
  }

  static async manualPayment(errandId: string): Promise<PaymentResult> {
    try {
      const errand = await this.getErrandWithDetails(errandId);
      
      if (!errand) {
        return { success: false, message: '심부름을 찾을 수 없습니다.' };
      }

      const validationResult = this.validateManualPayment(errand);
      if (!validationResult.success) {
        return validationResult;
      }

      await this.processPayment(errand);
      return { success: true, message: '결제가 성공적으로 처리되었습니다.' };
    } catch (error) {
      console.error('수동 결제 처리 오류:', error);
      return { success: false, message: '결제 처리 중 오류가 발생했습니다.' };
    }
  }

  private static getPaymentCutoffDate(): Date {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - this.DISPUTE_DEADLINE_HOURS);
    return cutoffDate;
  }

  private static async getEligibleErrandsForPayment(cutoffDate: Date) {
    return await Errand.find({
      status: 'completed',
      updatedAt: { $lte: cutoffDate },
      dispute: { $exists: false }
    })
      .populate('requestedBy', 'name email')
      .populate('acceptedBy', 'name email');
  }

  private static async getErrandWithDetails(errandId: string) {
    return await Errand.findById(errandId)
      .populate('requestedBy', 'name email')
      .populate('acceptedBy', 'name email');
  }

  private static validateErrandForPayment(errand: any): void {
    if (!errand) {
      throw new Error('심부름 정보가 없습니다.');
    }
    
    if (errand.status !== 'completed') {
      throw new Error('완료되지 않은 심부름입니다.');
    }
    
    if (errand.dispute) {
      throw new Error('분쟁이 있는 심부름은 결제할 수 없습니다.');
    }
  }

  private static validateManualPayment(errand: any): PaymentResult {
    if (errand.status === 'paid') {
      return { success: false, message: '이미 결제가 완료된 심부름입니다.' };
    }

    if (errand.status !== 'completed') {
      return { success: false, message: '완료된 심부름만 결제할 수 있습니다.' };
    }

    return { success: true, message: '' };
  }

  private static async updateErrandToPaid(errand: any): Promise<void> {
    errand.status = 'paid';
    await errand.save();
  }

  private static async sendPaymentNotifications(errand: any): Promise<void> {
    await this.sendAcceptorNotification(errand);
    await this.sendRequesterNotification(errand);
  }

  private static async sendAcceptorNotification(errand: any): Promise<void> {
    try {
      if (errand.acceptedBy && errand.acceptedBy._id) {
        await createNotification(
          errand.acceptedBy._id as mongoose.Types.ObjectId,
          '결제가 완료되었습니다',
          `"${errand.title}" 심부름에 대한 보상 ${errand.reward.toLocaleString()}${errand.currency === 'KRW' ? '원' : '달러'}이 지급되었습니다.`,
          'payment_completed',
          errand._id as mongoose.Types.ObjectId
        );
      }
    } catch (error) {
      console.error('수행자 알림 전송 실패:', error);
    }
  }

  private static async sendRequesterNotification(errand: any): Promise<void> {
    try {
      if (errand.requestedBy && errand.requestedBy._id) {
        await createNotification(
          errand.requestedBy._id as mongoose.Types.ObjectId,
          '심부름이 최종 완료되었습니다',
          `"${errand.title}" 심부름이 성공적으로 완료되어 결제가 이루어졌습니다.`,
          'errand_finalized',
          errand._id as mongoose.Types.ObjectId
        );
      }
    } catch (error) {
      console.error('요청자 알림 전송 실패:', error);
    }
  }
}