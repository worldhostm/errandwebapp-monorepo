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

    const isRequester = errand.requestedBy.toString() === (user._id as mongoose.Types.ObjectId).toString();
    const isAcceptor = errand.acceptedBy && errand.acceptedBy.toString() === (user._id as mongoose.Types.ObjectId).toString();
    
    // 심부름 요청자는 항상 접근 가능
    // 다른 사용자는 심부름이 pending 상태이거나 자신이 수락한 경우에만 접근 가능
    const canAccess = isRequester || 
                     (errand.status === 'pending') || 
                     (isAcceptor);
    
    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    let chat = await Chat.findOne({ errand: errandId })
      .populate('participants', 'name email avatar')
      .populate('messages.sender', 'name email avatar');

    // 채팅방이 없으면 새로 생성
    if (!chat) {
      const participants = [errand.requestedBy];
      
      // 현재 사용자가 요청자가 아니면 참여자로 추가
      if (!isRequester) {
        participants.push(user._id as mongoose.Types.ObjectId);
      }
      
      // 수락자가 있고, 요청자나 현재 사용자와 다르면 추가
      if (errand.acceptedBy && 
          errand.acceptedBy.toString() !== errand.requestedBy.toString() &&
          errand.acceptedBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
        participants.push(errand.acceptedBy);
      }

      console.log('Creating chat with participants:', participants.map(p => p.toString()));
      console.log('Current user:', (user._id as mongoose.Types.ObjectId).toString());
      console.log('Is requester:', isRequester);


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
    } else {
      // 기존 채팅방이 있지만 현재 사용자가 참여자가 아닌 경우 추가
      const currentUserInChat = chat.participants.some(p => 
        p._id?.toString() === (user._id as mongoose.Types.ObjectId).toString()
      );
      
      console.log('Existing chat - Current user in chat:', currentUserInChat);
      
      if (!currentUserInChat) {
        console.log('Adding current user to existing chat');
        await Chat.updateOne(
          { _id: chat._id },
          { $addToSet: { participants: user._id } }
        );
        
        // 다시 로드
        chat = await Chat.findById(chat._id)
          .populate('participants', 'name email avatar')
          .populate('messages.sender', 'name email avatar');
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

    // Check if user is a participant
    console.log('SendMessage - User ID:', (user._id as mongoose.Types.ObjectId).toString());
    console.log('SendMessage - Chat participants:', chat.participants.map(p => p.toString()));
    
    const isParticipant = chat.participants.some(participantId => 
      participantId.toString() === (user._id as mongoose.Types.ObjectId).toString()
    );
    
    console.log('SendMessage - Is participant:', isParticipant);
    
    if (!isParticipant) {
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

    // Check if user is a participant
    if (!chat.participants.includes(user._id as mongoose.Types.ObjectId)) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
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