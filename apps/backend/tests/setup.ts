import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import createApp from '../src/app';

let mongoServer: MongoMemoryServer;
let app: Express;

// 테스트 시작 전 MongoDB 메모리 서버 시작
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Express 앱 생성
  app = createApp();
});

// 각 테스트 전 데이터베이스 초기화
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 테스트 종료 후 정리
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Helper function to create auth token for testing
export const createTestToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
};

// 테스트용 앱 export
export { app };