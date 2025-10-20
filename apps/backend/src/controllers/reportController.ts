import { Response } from 'express';
import mongoose from 'mongoose';
import Report from '../models/Report';
import { AuthRequest } from '../middleware/auth';

// 신고 생성
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { reason, description, reportedUser, reportedErrand, evidence } = req.body;

    // 신고 대상 확인
    if (!reportedUser && !reportedErrand) {
      return res.status(400).json({
        success: false,
        error: '신고 대상(사용자 또는 심부름)을 선택해주세요.'
      });
    }

    // 자기 자신을 신고하는지 확인
    if (reportedUser && reportedUser === user._id?.toString()) {
      return res.status(400).json({
        success: false,
        error: '자기 자신을 신고할 수 없습니다.'
      });
    }

    const report = new Report({
      reason,
      description,
      reportedUser,
      reportedErrand,
      reportedBy: user._id,
      evidence,
      status: 'pending'
    });

    await report.save();
    await report.populate([
      { path: 'reportedBy', select: 'name email avatar' },
      { path: 'reportedUser', select: 'name email avatar' },
      { path: 'reportedErrand', select: 'title status' }
    ]);

    res.status(201).json({
      success: true,
      data: { report },
      message: '신고가 성공적으로 접수되었습니다.'
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: '신고 접수 중 오류가 발생했습니다.'
    });
  }
};

// 내 신고 목록 조회
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const query: {
      reportedBy: mongoose.Types.ObjectId;
      status?: string;
    } = { reportedBy: user._id as mongoose.Types.ObjectId };
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reportedBy', 'name email avatar')
        .populate('reportedUser', 'name email avatar')
        .populate('reportedErrand', 'title status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      error: '신고 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 특정 신고 상세 조회
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('reportedBy', 'name email avatar')
      .populate('reportedUser', 'name email avatar')
      .populate('reportedErrand', 'title status');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: '신고를 찾을 수 없습니다.'
      });
    }

    // 본인의 신고인지 확인
    if (report.reportedBy.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('Get report by id error:', error);
    res.status(500).json({
      success: false,
      error: '신고 조회 중 오류가 발생했습니다.'
    });
  }
};

// 신고 취소
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: '신고를 찾을 수 없습니다.'
      });
    }

    // 본인의 신고인지 확인
    if (report.reportedBy.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.'
      });
    }

    // 이미 처리 중이거나 완료된 신고는 취소 불가
    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: '처리 중이거나 완료된 신고는 취소할 수 없습니다.'
      });
    }

    await Report.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '신고가 취소되었습니다.'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: '신고 취소 중 오류가 발생했습니다.'
    });
  }
};
