# 위치 기반 심부름 웹앱 (Location-Based Errand Web App)

A comprehensive monorepo for a location-based errand service platform built with modern web technologies.

## 🏗️ Project Structure

```
errandwebapp/
├── apps/
│   ├── frontend/          # Next.js React frontend
│   └── backend/           # Express.js Node.js backend
├── packages/
│   └── shared/           # Shared types, utilities, and constants
└── [configuration files]
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Shared
- **TypeScript** - Shared types and utilities
- **Common constants** - API endpoints, error messages
- **Utility functions** - Distance calculation, formatting, validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- MongoDB 6.0 or later
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd errandwebapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example files and configure:
   ```bash
   # Root level
   cp .env.example .env
   
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   
   # Frontend
   cp apps/frontend/.env.local.example apps/frontend/.env.local
   ```

4. **Configure your environment files**
   
   **Backend (.env)**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/errandwebapp
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```
   
   **Frontend (.env.local)**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

5. **Start MongoDB**
   ```bash
   # Using MongoDB service (Windows/macOS)
   brew services start mongodb/brew/mongodb-community
   # or
   sudo systemctl start mongod  # Linux
   ```

6. **Build shared package**
   ```bash
   npm run build --workspace=packages/shared
   ```

7. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend only (localhost:3000)
   npm run dev:backend   # Backend only (localhost:5000)
   ```

## 📋 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all applications
- `npm run start` - Start production servers
- `npm run lint` - Run linting on all apps
- `npm run typecheck` - Type check all apps

### Frontend (apps/frontend)
- `npm run dev --workspace=apps/frontend` - Start development server
- `npm run build --workspace=apps/frontend` - Build for production
- `npm run start --workspace=apps/frontend` - Start production server
- `npm run lint --workspace=apps/frontend` - Run ESLint
- `npm run typecheck --workspace=apps/frontend` - Type check

### Backend (apps/backend)
- `npm run dev --workspace=apps/backend` - Start development server
- `npm run build --workspace=apps/backend` - Build TypeScript
- `npm run start --workspace=apps/backend` - Start production server
- `npm run lint --workspace=apps/backend` - Run ESLint
- `npm run typecheck --workspace=apps/backend` - Type check

### Shared Package (packages/shared)
- `npm run build --workspace=packages/shared` - Build shared package
- `npm run dev --workspace=packages/shared` - Build in watch mode

## 🌟 Key Features

### Core Functionality
- **사용자 인증** - 회원가입, 로그인, 프로필 관리
- **심부름 요청** - 위치 기반 심부름 생성 및 관리
- **지도 통합** - 구글 지도/카카오 지도/네이버 지도 API 지원
- **실시간 채팅** - Socket.IO를 통한 실시간 소통
- **상태 관리** - 심부름 진행 상태 추적
- **평가 시스템** - 사용자 간 평점 및 리뷰

### API Endpoints

#### Authentication
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 프로필 조회
- `PUT /api/auth/profile` - 프로필 업데이트

#### Errands
- `POST /api/errands` - 심부름 생성
- `GET /api/errands/nearby` - 주변 심부름 조회
- `GET /api/errands/user` - 내 심부름 조회
- `POST /api/errands/:id/accept` - 심부름 수락
- `PUT /api/errands/:id/status` - 상태 업데이트
- `DELETE /api/errands/:id` - 심부름 취소

#### Chat
- `GET /api/chat/errand/:errandId` - 채팅방 조회
- `POST /api/chat/:chatId/message` - 메시지 전송
- `PUT /api/chat/:chatId/read` - 메시지 읽음 처리

#### Users
- `GET /api/users/:id` - 사용자 정보 조회
- `PUT /api/users/location` - 위치 업데이트
- `GET /api/users/:id/ratings` - 사용자 평점 조회

## 🔧 Development

### Database Schema

The application uses MongoDB with the following main collections:

- **Users** - User profiles, authentication, location data
- **Errands** - Errand requests with geospatial data
- **Chats** - Real-time messaging between users

### Real-time Features

Socket.IO events:
- `join_chat` / `leave_chat` - Chat room management
- `send_message` / `new_message` - Real-time messaging
- `errand_status_update` / `errand_updated` - Status updates
- `update_location` / `user_location_updated` - Location tracking

### Type Safety

The project uses TypeScript throughout with shared types in `packages/shared`:
- API request/response types
- Database model interfaces  
- Socket.IO event types
- Utility function types

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
Ensure all environment variables are properly set for production deployment.

### Recommended Deployment Platforms
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, AWS EC2
- **Database**: MongoDB Atlas

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 API Documentation

For detailed API documentation, start the development server and visit the API endpoints or refer to the controller files in `apps/backend/src/controllers/`.

## ⚡ Performance Considerations

- Geospatial indexing for efficient location-based queries
- Connection pooling for MongoDB
- Real-time updates via Socket.IO
- Image optimization and compression
- Pagination for large data sets

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Environment variable protection