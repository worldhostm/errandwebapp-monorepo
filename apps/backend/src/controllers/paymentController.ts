import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';
import { SchedulerService } from '../services/schedulerService';
import Errand from '../models/Errand';

export const manualPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await PaymentService.manualPayment(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('수동 결제 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const canProcess = await PaymentService.canProcessPayment(id);
    const errand = await Errand.findById(id).select('status updatedAt dispute');
    
    if (!errand) {
      return res.status(404).json({
        success: false,
        error: '심부름을 찾을 수 없습니다.'
      });
    }
    
    const hoursUntilPayment = errand.status === 'completed' && !errand.dispute
      ? Math.max(0, 24 - Math.floor((Date.now() - errand.updatedAt.getTime()) / (1000 * 60 * 60)))
      : null;
    
    res.json({
      success: true,
      data: {
        canProcess,
        currentStatus: errand.status,
        hasDispute: !!errand.dispute,
        hoursUntilPayment,
        lastUpdated: errand.updatedAt
      }
    });
  } catch (error) {
    console.error('결제 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const getSchedulerStatus = async (req: Request, res: Response) => {
  try {
    const status = SchedulerService.getSchedulerStatus();
    
    res.json({
      success: true,
      scheduler: status
    });
  } catch (error) {
    console.error('스케줄러 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

export const triggerPaymentCheck = async (req: Request, res: Response) => {
  try {
    console.log('🔄 수동 결제 체크 트리거');
    const results = await PaymentService.processAutomaticPayments();
    
    res.json({
      success: true,
      message: '자동 결제 체크가 완료되었습니다.',
      data: {
        processedCount: results.length,
        successfulCount: results.filter(r => r.success).length,
        failedCount: results.filter(r => !r.success).length,
        results: results
      }
    });
  } catch (error) {
    console.error('결제 체크 트리거 오류:', error);
    res.status(500).json({
      success: false,
      error: '결제 체크 중 오류가 발생했습니다.'
    });
  }
};