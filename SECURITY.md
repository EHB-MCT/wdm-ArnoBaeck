# Security Setup Instructions

## 🚨 CRITICAL SECURITY SETUP REQUIRED

### 1. Generate Secure JWT Secret
```bash
# Generate a cryptographically secure secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Create Environment File
```bash
# Copy example and fill with secure values
cp .env.example .env
```

### 3. Secure Configuration
```bash
# Set your secure JWT secret
JWT_SECRET=your_generated_secure_secret_here
VITE_ADMIN_EMAILS=your-admin-email@example.com

# Production settings
FRONTEND_URL=https://your-domain.com
MONGODB_URL=mongodb://username:password@localhost:27017/brokerdb
```

### 4. MongoDB Security
Enable MongoDB authentication:
```bash
# In MongoDB shell
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

use brokerdb
db.createUser({
  user: "brokeruser", 
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### 5. NEVER Commit These Files
- ✅ `.env` (in .gitignore)
- ✅ Any real secrets
- ✅ Production passwords

### Security Checklist:
- [ ] JWT secret is 32+ random characters
- [ ] MongoDB authentication enabled
- [ ] Admin emails are real and secure
- [ ] No hardcoded secrets in code
- [ ] Environment files not committed

### Production Deployment:
- Use environment variables in Docker/Kubernetes
- Enable HTTPS/TLS
- Use production MongoDB with authentication
- Set secure FRONTEND_URL
- Monitor for security updates