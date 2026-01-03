# Fake Broker - Trading Simulation

A full-stack trading platform with real-time price generation, user analytics, and AI-powered profiling.

## 🚀 Features

- Real-time trading simulation with live price updates
- JWT authentication with admin dashboard
- User behavior tracking and analytics
- AI-based user profiles (Ollama)
- Docker containerization

## 🛠️ Tech Stack

**Frontend**: React 19, Vite, React Router, Recharts, Axios  
**Backend**: Express.js, MongoDB, JWT, bcryptjs  
**AI**: Ollama (llama3.2:1b)  
**DevOps**: Docker, Docker Compose

## 📋 Setup

### Docker (Recommended)
```bash
docker-compose up
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

### Manual
```bash
# Backend
cd images/server && npm install && npm run dev

# Frontend  
cd images/client && npm install && npm run dev

# Ollama
ollama pull llama3.2:1b && ollama serve
```

**Don't forget**: `cp .env.example .env` and set `JWT_SECRET`!

## 📁 Project Structure

```
images/
├── client/          # React frontend
└── server/          # Express backend
prompts/             # AI conversation logs
```

## 🔧 Dev Commands

**Client**: `npm run dev | build | lint`  
**Server**: `npm run dev | start`  
**Docker**: `docker-compose up | down`

## 📚 Sources & References

1. **React 19 Documentation** - [react.dev](https://react.dev)  
   Used for component architecture and hooks

2. **Express.js Guide** - [expressjs.com](https://expressjs.com)  
   Backend API and middleware

3. **MongoDB Node.js Driver** - [mongodb.github.io](https://mongodb.github.io/node-mongodb-native)  
   Database connections and queries

4. **JWT Authentication** - [jwt.io](https://jwt.io)  
   Token-based authentication

5. **Ollama AI Integration** - [ollama.ai](https://ollama.ai)  
   Local AI models for user profiles

6. **Recharts Documentation** - [recharts.org](https://recharts.org)  
   Data visualization and charts

7. **Docker Compose** - [docs.docker.com](https://docs.docker.com/compose)  
   Containerization and deployment

## 💡 AI Prompts

Conversation logs and AI prompts are stored in `prompts/` directory for further analysis and improvement.

## 📄 License

GNU GPL v3.0 - see [LICENSE.md](./LICENSE.md)