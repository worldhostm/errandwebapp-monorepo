import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import createApp from './app';
import { setupSocketIO } from './services/socketService';

dotenv.config();

const app = createApp();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/errandwebapp';

// Setup Socket.IO
setupSocketIO(io);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();

export default app;