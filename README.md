# Fake Broker - Full-Stack Trading Simulation

A sophisticated full-stack web application that simulates a trading platform with real-time price generation, user behavior tracking, and AI-powered user profiling. Built with React, Express.js, MongoDB, and Ollama for machine learning insights.

## 🚀 Features

- **Real-time Trading Simulation**: Live price updates with realistic market movements
- **User Authentication**: Secure JWT-based authentication with admin controls
- **Behavior Analytics**: Comprehensive tracking of user interactions and session data
- **AI-Powered Profiling**: Automated user behavior classification using Ollama
- **Admin Dashboard**: Advanced user management and analytics interface
- **Docker Support**: Complete containerized deployment setup

## 🏗️ Architecture

### Frontend (React 19 + Vite)
- **Framework**: React 19 with functional components and hooks
- **Styling**: Pure CSS with modular architecture
- **Charts**: Recharts for data visualization
- **Routing**: React Router v7 for navigation
- **HTTP Client**: Axios for API communication

### Backend (Node.js + Express)
- **API**: RESTful Express.js server with async/await
- **Database**: MongoDB with MongoClient
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting
- **AI Integration**: Ollama for user profiling

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot-reload for both frontend and backend
- **Database**: MongoDB with session and event collections
- **ML Service**: Ollama for behavioral analysis

## 📋 Prerequisites

- **Node.js**: v16 or higher
- **npm**: v8 or higher  
- **MongoDB**: v5.0 or higher
- **Docker**: v20.10+ (optional, for containerized setup)
- **Ollama**: Latest version (for AI profiling)

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/EHB-MCT/wdm-ArnoBaeck.git
cd wdm-ArnoBaeck
```

### 2. Security Setup (REQUIRED)

⚠️ **CRITICAL**: Before running the application, you MUST set up secure environment variables:

```bash
# Copy the example environment file
cp .env.example .env

# Generate a secure JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env with your secure values
JWT_SECRET=your_generated_secure_secret_here
VITE_ADMIN_EMAILS=your-admin-email@example.com
```

**Read the complete security setup guide**: [SECURITY.md](./SECURITY.md)

### 3. Local Development Setup

#### Option A: Docker Compose (Recommended)
```bash
# Start all services (client, server, mongodb, ollama)
docker-compose up

# Services will be available at:
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
# MongoDB: mongodb://localhost:27017
# Ollama: http://localhost:11434
```

#### Option B: Manual Setup

**Start MongoDB:**
```bash
# Ensure MongoDB is running on default port
mongod --port 27017 --dbpath /path/to/your/db
```

**Start Backend:**
```bash
cd images/server
npm install
npm run dev  # Development with hot-reload (port 3000)
# OR
npm start    # Production mode
```

**Start Frontend:**
```bash
cd images/client
npm install
npm run dev  # Development server (port 8080)
```

**Start Ollama:**
```bash
# Pull the required model
ollama pull llama3.2:1b

# Start Ollama service
ollama serve
```

## 🎯 Quick Start Guide

1. **Register Account**: Visit http://localhost:8080 and create a new account
2. **Login**: Use your credentials to access the trading interface
3. **Start Trading**: Buy/sell buttons with real-time price updates
4. **View Dashboard**: Access http://localhost:8080/dashboard for analytics
5. **Admin Access**: Add your email to `VITE_ADMIN_EMAILS` for admin dashboard

## 📁 Project Structure

```
├── images/
│   ├── client/                 # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # Reusable React components
│   │   │   ├── contexts/       # React contexts for state management
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Page components
│   │   │   ├── styles/         # CSS stylesheets
│   │   │   └── utils/          # Utility functions
│   │   ├── package.json
│   │   └── vite.config.js
│   └── server/                 # Express.js backend API
│       ├── src/
│       │   ├── auth.js         # Authentication middleware
│       │   └── server.js       # Main server file
│       └── package.json
├── docs/                       # Documentation files
├── prompts/                    # Conversation logging
├── docker-compose.yml          # Docker services configuration
├── AGENTS.md                   # Development commands
└── README.md                   # This file
```

## 🔧 Development Commands

### Frontend (React/Vite)
```bash
cd images/client
npm run dev          # Start development server (port 8080)
npm run build         # Build for production
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

### Backend (Node.js/Express)
```bash
cd images/server
npm run dev           # Start with nodemon (port 3000)
npm start             # Start production server
```

### Docker
```bash
docker-compose up       # Start all services
docker-compose down     # Stop all services
docker-compose logs    # View logs
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 10 salt rounds
- **Rate Limiting**: API protection against abuse
- **Security Headers**: Helmet.js for HTTP security
- **CORS Protection**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive input sanitization
- **Admin Controls**: Role-based access control

## 📊 Data & Analytics

### Session Tracking
- Session start/end events
- User agent and device detection
- Time-based activity patterns
- Session duration analysis

### User Behavior
- Click tracking (buy/sell buttons)
- Hover duration measurement
- Price interaction patterns
- Navigation flow analysis

### AI Profiling
- Automated user classification
- Behavioral pattern recognition
- Real-time profile updates
- Multiple trader archetypes

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - User profile

### Trading
- `GET /price` - Current price with history
- `POST /event` - Log user interaction

### Analytics
- `GET /api/user/data` - User analytics
- `GET /profile` - AI-generated user profile
- `POST /session-event` - Session tracking

### Admin
- `GET /api/admin/search-users` - User search
- `GET /api/admin/user/:userId/data` - User analytics

## 🛠️ Technology Stack

### Frontend
- **React 19**: Latest React with concurrent features
- **Vite 7**: Fast build tool and dev server
- **React Router 7**: Modern routing solution
- **Recharts 3**: Chart library for data visualization
- **Axios**: HTTP client for API requests

### Backend
- **Express 5**: Web framework for Node.js
- **MongoDB 6**: NoSQL document database
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Ollama**: Local AI model integration

### Development & Deployment
- **Docker**: Containerization and orchestration
- **ESLint**: Code linting and quality checks
- **Nodemon**: Development auto-restart

## 🐛 Troubleshooting

### Common Issues

**JWT Secret Error**:
```bash
Error: JWT_SECRET environment variable is required
```
**Solution**: Run `cp .env.example .env` and set a secure JWT secret.

**MongoDB Connection Failed**:
```bash
Error: Database connection failed
```
**Solution**: Ensure MongoDB is running on port 27017.

**Ollama Not Found**:
```bash
Error: Failed to build profile
```
**Solution**: Install Ollama and run `ollama pull llama3.2:1b`.

### Port Conflicts
- Frontend: 8080
- Backend: 3000
- MongoDB: 27017
- Ollama: 11434

## 📝 Development Guidelines

This project follows strict development guidelines documented in:
- [CONTRIBUTING_GUIDELINES.md](./docs/CONTRIBUTING_GUIDELINES.md)
- [CODE_OF_CONDUCT.md](./docs/CODE_OF_CONDUCT.md)
- [AGENTS.md](./AGENTS.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0. See [LICENSE.md](./LICENSE.md) for details.

## 🆘 Support

For support and questions:
- Review development guidelines in [AGENTS.md](./AGENTS.md)
- Open an issue for bugs or feature requests

---

**⚠️ Security Notice**: Always ensure proper security setup before deployment.