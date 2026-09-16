import { Response } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Errand from '../models/Errand';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../services/socketInstance';
import { createNotification } from './notificationController';

export const getChatByErrand = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { errandId } = req.params;

    // Check if user is part of the errand
    const errand = await Errand.findById(errandId);
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const requesterId = errand.requestedBy.toString();
    const isRequester = requesterId === userId;
    const isAcceptor = errand.acceptedBy && errand.acceptedBy.toString() === userId;

    // 심부름 요청자, 수락자, 또는 pending 상태(채팅 시작 가능)인 경우만 접근 허용
    const canAccess = isRequester || isAcceptor || errand.status === 'pending';

    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // 이미 존재하는 채팅방 찾기
    let chat = await Chat.findOne({
      errand: errandId
    })
      .populate('participants', 'name email avatar')
      .populate('messages.sender', 'name email avatar');

    // 채팅방이 없으면 새로 생성 (helper만 생성 가능)
    if (!chat) {
      if (isRequester) {
        // 요청자는 채팅방을 만들 수 없음 (다른 사람이 먼저 채팅을 시작해야 함)
        return res.status(403).json({
          error: '채팅방이 아직 생성되지 않았습니다. 다른 사용자가 먼저 채팅을 시작해야 합니다.'
        });
      }

      // Helper가 채팅 시작 - participants 구성
      const otherUserId = user._id;
      if (!otherUserId) {
        return res.status(400).json({ error: '채팅 상대방을 찾을 수 없습니다.' });
      }

      // 항상 일관된 순서로 정렬 (작은 ID가 먼저)
      const participants = [errand.requestedBy, otherUserId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      // Helper가 채팅 시작
      console.log('Creating chat with participants:', participants.map(p => (p as mongoose.Types.ObjectId).toString()));
      console.log('Current user:', userId);

      try {
        chat = new Chat({
          errand: errandId,
          participants,
          messages: []
        });

        await chat.save();

        // 다시 populate해서 가져오기
        chat = await Chat.findById(chat._id)
          .populate('participants', 'name email avatar')
          .populate('messages.sender', 'name email avatar');
      } catch (error: any) {
        // 동시에 여러 요청이 들어온 경우 중복 키 에러가 발생할 수 있음
        // 이미 생성된 채팅방을 찾아서 반환
        if (error.code === 11000) {
          console.log('Chat already exists, fetching existing chat');
          chat = await Chat.findOne({
            errand: errandId
          })
            .populate('participants', 'name email avatar')
            .populate('messages.sender', 'name email avatar');

          if (!chat) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Server error while fetching chat' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { chatId } = req.params;
    const { content, messageType = 'text' } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();

    // 채팅방 participants에 속한 사용자만 메시지 전송 가능
    const isAuthorized = chat.participants.some(p => p.toString() === userId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
    }

    const newMessage = {
      sender: user._id as mongoose.Types.ObjectId,
      content,
      messageType,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);
    chat.lastMessage = newMessage;
    await chat.save();

    await chat.populate('messages.sender', 'name email avatar');
    
    const populatedMessage = chat.messages[chat.messages.length - 1];

    // Socket.IO로 채팅방의 다른 참여자에게 실시간 전송
    try {
      getIO().to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message: populatedMessage
      });
    } catch {
      // io 미초기화 시 무시 (REST 응답은 정상 반환)
    }

    // 수신자에게 알림 생성 + 소켓 push
    try {
      const receiverId = chat.participants.find(p => p.toString() !== userId);
      if (receiverId) {
        const notification = await createNotification(
          receiverId as mongoose.Types.ObjectId,
          '새 메시지',
          `${(user as { name?: string }).name || '상대방'}님이 메시지를 보냈습니다: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
          'chat_message',
          chat.errand as mongoose.Types.ObjectId
        );
        try {
          const unreadCount = await (await import('../models/Notification')).default.countDocuments({
            userId: receiverId,
            isRead: false
          });
          getIO().to(`user_${receiverId}`).emit('new_notification', {
            notification,
            unreadCount
          });
        } catch {
          // 소켓 push 실패 무시
        }
      }
    } catch {
      // 알림 생성 실패 무시 (메시지 전송은 정상 처리)
    }

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error while sending message' });
  }
};

// 내 채팅방들의 심부름별 미읽음 메시지 카운트
export const getChatUnreadCounts = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();

    const chats = await Chat.find({ participants: user._id });

    const counts: Record<string, number> = {};
    for (const chat of chats) {
      const errandId = chat.errand.toString();
      const unread = chat.messages.filter(
        m => m.sender.toString() !== userId && !m.isRead
      ).length;
      if (unread > 0) {
        counts[errandId] = (counts[errandId] || 0) + unread;
      }
    }

    res.json({ success: true, counts });
  } catch (error) {
    console.error('Get chat unread counts error:', error);
    res.status(500).json({ error: 'Server error while fetching unread counts' });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();

    const isAuthorized = chat.participants.some(p => p.toString() === userId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // Mark messages as read for this user
    chat.messages.forEach(message => {
      if (message.sender.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
        message.isRead = true;
      }
    });

    await chat.save();

    // 채팅방 참여자들에게 읽음 처리 알림
    try {
      getIO().to(`chat_${chatId}`).emit('messages_read', {
        chatId,
        readerId: userId
      });
    } catch {
      // 소켓 미초기화 시 무시
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Server error while marking messages as read' });
  }
};