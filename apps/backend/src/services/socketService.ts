import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

import { Socket } from 'socket.io';

export const setupSocketIO = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.userId = (user._id as mongoose.Types.ObjectId).toString();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining errand chat rooms
    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Handle leaving errand chat rooms
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data: { chatId: string; message: any }) => {
      // Emit to all users in the chat room except sender
      socket.to(`chat_${data.chatId}`).emit('new_message', {
        chatId: data.chatId,
        message: data.message
      });
    });

    // Handle errand status updates
    socket.on('errand_status_update', (data: { errandId: string; status: string; errand: any }) => {
      // Notify all users following this errand
      io.emit('errand_updated', {
        errandId: data.errandId,
        status: data.status,
        errand: data.errand
      });
    });

    // Handle location updates for real-time tracking
    socket.on('update_location', (data: { coordinates: [number, number] }) => {
      // Broadcast location to relevant users (privacy considerations apply)
      socket.broadcast.emit('user_location_updated', {
        userId: socket.userId,
        coordinates: data.coordinates
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId: string) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (chatId: string) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};