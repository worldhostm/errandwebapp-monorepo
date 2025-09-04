import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

// 사용자의 알림 목록 조회
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { limit = 20, page = 1, unreadOnly = false } = req.query;
    const limitNum = parseInt(limit as string);
    const skip = (parseInt(page as string) - 1) * limitNum;

    let query: any = { userId: user._id };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedErrand', 'title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error while fetching notifications' });
  }
};

// 알림을 읽음 처리
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: user._id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error while marking notification as read' });
  }
};

// 모든 알림을 읽음 처리
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await Notification.updateMany(
      { userId: user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Server error while marking all notifications as read' });
  }
};

// 알림 생성 헬퍼 함수
export const createNotification = async (
  userId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  type: 'errand_completed' | 'errand_accepted' | 'errand_disputed' | 'system',
  relatedErrand?: mongoose.Types.ObjectId
) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedErrand
    });

    await notification.save();
    console.log(`📢 알림 생성됨: ${title} (사용자: ${userId})`);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// 읽지 않은 알림 개수 조회
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error while fetching unread count' });
  }
};