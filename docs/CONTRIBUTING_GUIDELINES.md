# Contributing Guidelines

Thank you for your interest in contributing to our full-stack web application! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized development)
- Git

### Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React contexts for state management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS stylesheets
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express.js backend API
│   ├── src/
│   │   ├── auth.js         # Authentication middleware
│   │   └── server.js       # Main server file
│   └── package.json
├── docker-compose.yml      # Docker services configuration
└── AGENTS.md              # Development commands and guidelines
```

### Development Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd [repository-name]
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd images/client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Start development servers**
   ```bash
   # Start client (port 8080)
   cd images/client
   npm run dev
   
   # Start server (port 3000)
   cd ../server
   npm run dev
   ```

4. **Or use Docker Compose**
   ```bash
   docker-compose up
   ```

## Code Style Guidelines

### General Standards

- Use ES6+ modules and modern JavaScript features
- Follow ESLint configuration (client/eslint.config.js)
- Use camelCase for variables and functions
- Use PascalCase for React components and classes
- Write clear, descriptive variable and function names
- Add comments for complex logic only when necessary

### React/Client Guidelines

- Use functional components with hooks
- Import React hooks individually: `import { useState } from "react"`
- Use default exports for components
- Use props destructuring in function parameters
- Event handlers should be prefixed with "on" (onClick, onMouseEnter)
- Follow the existing component structure and patterns

#### Example Component Structure:
```jsx
import { useState, useEffect } from "react";
import "./ComponentName.css";

function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  const handleClick = () => {
    // Handle event
  };

  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
}

export default ComponentName;
```

### Server Guidelines

- Use Express.js with async/await patterns
- Implement proper error handling with try/catch blocks
- Use environment variables for configuration
- Follow RESTful API conventions
- Use proper HTTP status codes and error responses
- Implement security best practices with helmet and rate limiting

#### Example Route Structure:
```javascript
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const router = express.Router();

// Example rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.get("/endpoint", limiter, async (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### Styling Guidelines

- Use CSS only - no Tailwind or other styling frameworks
- No inline styling in JSX
- Use dedicated CSS files with naming convention `[name].css`
- Import CSS files in components as needed
- Follow BEM methodology for CSS class names when appropriate

#### CSS Example:
```css
.component-name {
  display: flex;
  padding: 1rem;
}

.component-name__title {
  font-size: 1.5rem;
  font-weight: bold;
}

.component-name--active {
  background-color: #007bff;
}
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the code style guidelines
- Ensure your code is well-tested
- Update documentation if necessary
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run client linting
cd images/client
npm run lint

# Build client to check for errors
npm run build

# Test server functionality
cd ../server
npm run dev
```

### 4. Submit a Pull Request

- Use clear, descriptive commit messages
- Reference any related issues in your PR description
- Ensure your PR passes all checks
- Request code review from maintainers

## Testing

### Client Testing
- Run `npm run lint` to check for code style issues
- Test components manually in the development environment
- Use React DevTools for component inspection

### Server Testing
- Test all API endpoints manually or with tools like Postman
- Verify error handling and edge cases
- Check database interactions and data flow

## Data Logging

Our application includes a conversation logging system. When working with features that involve user interactions:

- Log every conversation in a map called `prompts`
- Structure: `prompts => [DATE] => [TITLE OF SESSION] => [ALL PROMPTS AND ANSWERS]`
- Ensure proper data privacy and compliance

## Security Considerations

- Never commit secrets, API keys, or sensitive information
- Use environment variables for configuration
- Implement proper authentication and authorization
- Validate all user inputs
- Use HTTPS in production
- Follow OWASP security guidelines

## Submitting Issues

When reporting bugs or requesting features:

1. Check existing issues to avoid duplicates
2. Use clear, descriptive titles
3. Provide detailed steps to reproduce bugs
4. Include environment details (OS, Node.js version, browser)
5. Add relevant screenshots or error messages

## Code Review Process

1. All changes must go through pull request review
2. Maintain at least one approving review before merge
3. Address all review comments before merging
4. Ensure CI/CD checks pass
5. Squash commits for clean history when appropriate

## Community Guidelines

- Be respectful and constructive in all interactions
- Help others learn and grow
- Follow the Code of Conduct
- Participate in discussions and code reviews
- Share knowledge and document your findings

## Questions?

- Check the [AGENTS.md](../AGENTS.md) file for development commands
- Review existing code for patterns and conventions
- Ask questions in issues or discussions
- Reach out to maintainers for guidance

Thank you for contributing to our project! Your efforts help make this application better for everyone.