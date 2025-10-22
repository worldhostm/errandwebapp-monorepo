import { Response } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Errand from '../models/Errand';
import { AuthRequest } from '../middleware/auth';

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

    // 요청자가 자신의 심부름에 채팅 시도하는 경우 차단
    if (isRequester && !errand.acceptedBy) {
      return res.status(403).json({
        error: '자신이 등록한 심부름에는 채팅을 시작할 수 없습니다. 다른 사용자가 채팅을 시작하면 대화할 수 있습니다.'
      });
    }

    // 심부름 요청자 또는 관련 사용자만 접근 가능
    const canAccess = isRequester ||
                     (errand.status === 'pending') ||
                     (isAcceptor);

    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // 1:1 채팅방 찾기: 요청자와 현재 사용자 간의 채팅
    // participants 배열이 정확히 두 명이고, 그 두 명이 requester와 현재 사용자인 채팅방
    // Helper가 채팅을 시작할 때의 participants 설정
    const otherUserId = isRequester ? errand.acceptedBy : user._id;

    if (!otherUserId) {
      return res.status(400).json({
        error: '채팅 상대방을 찾을 수 없습니다.'
      });
    }

    // 항상 일관된 순서로 정렬 (작은 ID가 먼저)
    const participants = [errand.requestedBy, otherUserId].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

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

    // 사용자가 이 채팅의 심부름과 관련된 사람인지 확인
    const errand = await Errand.findById(chat.errand);
    if (!errand) {
      return res.status(404).json({ error: 'Associated errand not found' });
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const requesterId = errand.requestedBy.toString();
    const acceptorId = errand.acceptedBy?.toString();

    // 요청자 또는 수락자만 메시지를 보낼 수 있음
    const isAuthorized = userId === requesterId || userId === acceptorId;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
    }

    // participants 배열에 추가 (만약 없다면)
    if (!chat.participants.some(p => p.toString() === userId)) {
      console.log('Adding user to chat participants');
      chat.participants.push(user._id as mongoose.Types.ObjectId);
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

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error while sending message' });
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

    // 사용자가 이 채팅의 심부름과 관련된 사람인지 확인
    const errand = await Errand.findById(chat.errand);
    if (!errand) {
      return res.status(404).json({ error: 'Associated errand not found' });
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const requesterId = errand.requestedBy.toString();
    const acceptorId = errand.acceptedBy?.toString();

    // 요청자 또는 수락자만 접근 가능
    const isAuthorized = userId === requesterId || userId === acceptorId;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // participants 배열에 추가 (만약 없다면)
    if (!chat.participants.some(p => p.toString() === userId)) {
      chat.participants.push(user._id as mongoose.Types.ObjectId);
    }

    // Mark messages as read for this user
    chat.messages.forEach(message => {
      if (message.sender.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
        message.isRead = true;
      }
    });

    await chat.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Server error while marking messages as read' });
  }
};