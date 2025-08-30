import { Request, Response } from 'express';
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

    const isParticipant = errand.requestedBy.toString() === (user._id as mongoose.Types.ObjectId).toString() || 
                         (errand.acceptedBy && errand.acceptedBy.toString() === (user._id as mongoose.Types.ObjectId).toString());
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    const chat = await Chat.findOne({ errand: errandId })
      .populate('participants', 'name email avatar')
      .populate('messages.sender', 'name email avatar');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
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
    if (!chat.participants.includes(user._id as mongoose.Types.ObjectId)) {
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