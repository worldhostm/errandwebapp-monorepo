import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import createApp from './app';
import { setupSocketIO } from './services/socketService';
import { setIO } from './services/socketInstance';
import { SchedulerService } from './services/schedulerService';

dotenv.config();

const app = createApp();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8090;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/errandwebapp';

// Setup Socket.IO
setIO(io);
setupSocketIO(io);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│         부름이 백엔드 서버 시작 중...         │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');

    console.log('📦 MongoDB 연결 시도 중...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB 연결 성공');
    console.log(`   - Database: ${MONGODB_URI}`);
    console.log('');

    server.listen(PORT, () => {
      console.log('┌─────────────────────────────────────────────────┐');
      console.log('│       🚀 서버가 성공적으로 시작되었습니다!      │');
      console.log('└─────────────────────────────────────────────────┘');
      console.log('');
      console.log('📍 서버 정보:');
      console.log(`   - 포트: ${PORT}`);
      console.log(`   - API URL: http://localhost:${PORT}`);
      console.log(`   - Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3001"}`);
      console.log(`   - 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('🔌 사용 가능한 엔드포인트:');
      console.log(`   - POST   /api/auth/register          - 회원가입`);
      console.log(`   - POST   /api/auth/login             - 로그인`);
      console.log(`   - POST   /api/auth/send-verification - 이메일 인증 코드 발송`);
      console.log(`   - POST   /api/auth/verify-email      - 이메일 인증 확인`);
      console.log(`   - GET    /api/auth/profile           - 프로필 조회`);
      console.log(`   - POST   /api/errands                - 심부름 등록`);
      console.log(`   - GET    /api/errands                - 심부름 목록`);
      console.log(`   - POST   /api/chats                  - 채팅 생성`);
      console.log(`   - GET    /api/chats/:id/messages     - 메시지 조회`);
      console.log('');
      console.log('⚡ Socket.IO 활성화됨');
      console.log('');

      // 자동 결제 스케줄러 시작
      console.log('⏰ 자동 결제 스케줄러 시작 중...');
      SchedulerService.startScheduler();
      console.log('✅ 스케줄러 시작 완료');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (error) {
    console.log('');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│              ❌ 서버 시작 실패                  │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');
    console.error('MongoDB 연결 실패:', error);
    console.log('');
    console.log('💡 확인사항:');
    console.log('   1. MongoDB 서버가 실행 중인지 확인');
    console.log('   2. .env 파일의 MONGODB_URI 확인');
    console.log('   3. 네트워크 연결 확인');
    console.log('');
    process.exit(1);
  }
};

startServer();

export default app;