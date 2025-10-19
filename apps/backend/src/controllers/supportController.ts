import { Request, Response } from 'express';
import Support from '../models/Support';
import { AuthRequest } from '../middleware/auth';

// 고객센터 문의 생성
export const createSupport = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { type, subject, description, attachments, relatedErrand } = req.body;

    const support = new Support({
      type,
      subject,
      description,
      user: user._id,
      attachments,
      relatedErrand,
      status: 'pending',
      priority: 'medium',
      responses: []
    });

    await support.save();
    await support.populate('user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: { support },
      message: '문의가 성공적으로 등록되었습니다.'
    });
  } catch (error) {
    console.error('Create support error:', error);
    res.status(500).json({
      success: false,
      error: '문의 등록 중 오류가 발생했습니다.'
    });
  }
};

// 내 문의 목록 조회
export const getMySupportTickets = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { user: user._id };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [supports, total] = await Promise.all([
      Support.find(query)
        .populate('user', 'name email avatar')
        .populate('relatedErrand', 'title status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Support.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        supports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get my support tickets error:', error);
    res.status(500).json({
      success: false,
      error: '문의 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 특정 문의 상세 조회
export const getSupportById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const support = await Support.findById(id)
      .populate('user', 'name email avatar')
      .populate('relatedErrand', 'title status')
      .populate('responses.createdBy', 'name email avatar');

    if (!support) {
      return res.status(404).json({
        success: false,
        error: '문의를 찾을 수 없습니다.'
      });
    }

    // 본인의 문의인지 확인 (관리자 권한 체크는 추후 구현)
    if (support.user.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { support }
    });
  } catch (error) {
    console.error('Get support by id error:', error);
    res.status(500).json({
      success: false,
      error: '문의 조회 중 오류가 발생했습니다.'
    });
  }
};

// 문의에 답변 추가
export const addSupportResponse = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    const support = await Support.findById(id);

    if (!support) {
      return res.status(404).json({
        success: false,
        error: '문의를 찾을 수 없습니다.'
      });
    }

    // 본인의 문의인지 확인
    if (support.user.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    support.responses.push({
      content,
      isAdmin: false,
      createdBy: user._id as any,
      createdAt: new Date()
    });

    await support.save();
    await support.populate('responses.createdBy', 'name email avatar');

    res.json({
      success: true,
      data: { support },
      message: '답변이 추가되었습니다.'
    });
  } catch (error) {
    console.error('Add support response error:', error);
    res.status(500).json({
      success: false,
      error: '답변 추가 중 오류가 발생했습니다.'
    });
  }
};

// 문의 취소/삭제
export const deleteSupport = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const support = await Support.findById(id);

    if (!support) {
      return res.status(404).json({
        success: false,
        error: '문의를 찾을 수 없습니다.'
      });
    }

    // 본인의 문의인지 확인
    if (support.user.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    // 이미 처리 중이거나 완료된 문의는 삭제 불가
    if (support.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: '처리 중이거나 완료된 문의는 삭제할 수 없습니다.'
      });
    }

    await Support.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '문의가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete support error:', error);
    res.status(500).json({
      success: false,
      error: '문의 삭제 중 오류가 발생했습니다.'
    });
  }
};
