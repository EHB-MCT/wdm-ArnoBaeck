# Project Standards

## Development Commands

### Client (React/Vite)
- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Server (Node.js/Express)
- `npm run dev` - Start with nodemon (port 3000)
- `npm start` - Start production server

### Docker
- `docker-compose up` - Start all services (client, server, mongodb, ollama)

## Code Style Guidelines

### General
- Use ES6+ modules and modern JavaScript features
- Follow ESLint configuration in client/eslint.config.js
- Use camelCase for variables and functions
- Use PascalCase for React components

### React/Client
- Functional components with hooks
- Import React hooks individually: `import { useState } from "react"`
- Use default exports for components
- Props destructuring in function parameters
- Event handlers prefixed with `on` (onClick, onMouseEnter)

### Server
- Express.js with async/await
- Error handling with try/catch blocks
- Environment variables for configuration
- MongoDB with MongoClient
- Proper HTTP status codes and error responses

## File Structure
- Client components in `client/src/components/`
- Pages in `client/src/pages/`
- Server entry point: `server/src/server.js`
- Use absolute imports from src directory

## Data Logging
- Log every conversation in a map called `prompts`
- Structure: `prompts => [DATE] => [TITLE OF SESSION] => [ALL PROMPTS AND ANSWERS]`

## Styling Guidelines
- Use CSS only - no Tailwind or other styling frameworks
- No inline styling
- Use dedicated CSS files with naming convention `[name].css`
- Import CSS files in components as needed