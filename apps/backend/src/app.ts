import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import errandRoutes from './routes/errands';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import { errorHandler } from './middleware/errorHandler';

const createApp = () => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/errands', errandRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/payments', paymentRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      error: `Route ${req.originalUrl} not found` 
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

export default createApp;