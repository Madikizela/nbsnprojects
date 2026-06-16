# Railway.com Deployment Guide 🚀

## Overview
This guide will help you deploy your NBSN project to Railway.com while keeping your local development environment intact.

## Prerequisites
- Railway.com account
- Git repository (GitHub recommended)
- Current project working locally

## Deployment Architecture
```
Railway Services:
├── 📊 PostgreSQL Database (Plugin)
├── 🔧 Backend API (.NET 9)
└── 🌐 Frontend Web (React + Nginx)
```

## Step-by-Step Deployment

### 1. Prepare Your Repository
Make sure your code is committed to Git:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Railway Project Setup

#### A. Create New Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository

#### B. Add PostgreSQL Database
1. In your Railway project, click "New" 
2. Select "Database" → "PostgreSQL"
3. Railway will create a Postgres instance and provide connection details

### 3. Deploy Backend Service

#### A. Create Backend Service
1. Click "New" → "GitHub Repo" → Select your repo
2. Set **Root Directory**: `backend`
3. Railway will auto-detect Dockerfile and build

#### B. Configure Backend Environment Variables
In the Backend service, go to "Variables" tab and add:

```env
# Database (Railway Auto-injects DATABASE_URL, but you can also set manually)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASS=${{Postgres.PGPASSWORD}}

# JWT - Generate strong secrets!
JWT_SECRET=your-very-long-random-secret-key-minimum-32-characters
JWT_ISSUER=DocumentManagementSystem
JWT_AUDIENCE=DocumentManagementUsers
JWT_EXPIRY_MINUTES=60

# Encryption - Generate a secure encryption key
ENCRYPTION_DATA_KEY=your-encryption-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=NBSN Team

# ASP.NET Core
ASPNETCORE_ENVIRONMENT=Production
DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

**🔥 IMPORTANT**: Replace placeholder values with real ones:
- Generate a strong JWT_SECRET (32+ characters)
- Set your real email credentials
- Generate a secure ENCRYPTION_DATA_KEY

#### C. Note Your Backend URL
After deployment, your backend will have a URL like:
`https://your-backend-service.up.railway.app`

### 4. Deploy Frontend Service

#### A. Create Frontend Service
1. Click "New" → "GitHub Repo" → Select your repo again
2. Set **Root Directory**: `frontend`
3. Railway will auto-detect Dockerfile and build

#### B. Configure Frontend Environment Variables
In the Frontend service, go to "Variables" tab and add:

```env
# Point to your Railway backend URL (replace with actual URL)
VITE_API_URL=https://your-backend-service.up.railway.app
```

### 5. Database Setup

#### A. Run Migrations
You need to initialize your database. You can:

**Option 1: Local Migration (Recommended)**
1. Update your local `.env` with Railway database credentials temporarily:
```env
DB_HOST=your-railway-postgres-host
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASS=your-railway-password
```
2. Run migrations locally:
```bash
cd backend
dotnet ef database update
```
3. Restore your local `.env` file

**Option 2: Via Railway CLI**
```bash
railway login
railway link [your-project-id]
railway run dotnet ef database update
```

### 6. Testing Deployment

#### A. Check Services
1. Backend: Visit `https://your-backend.up.railway.app/api/health` or similar
2. Frontend: Visit your frontend URL
3. Database: Check Railway dashboard for connection status

#### B. Test Core Features
- User login
- Data display
- File uploads
- Assessment functionality

## Managing Two Environments

### Local Development (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nbsn_local
DB_USER=postgres
DB_PASS=your-local-password
JWT_SECRET=your-local-secret
ASPNETCORE_ENVIRONMENT=Development
```

### Production (.env.railway - for reference)
```env
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASS=${{Postgres.PGPASSWORD}}
JWT_SECRET=your-production-secret
ASPNETCORE_ENVIRONMENT=Production
```

### Frontend Environment
- **Local**: `VITE_API_URL=http://localhost:5213`
- **Production**: `VITE_API_URL=https://your-backend.up.railway.app`

## Mobile App Configuration
Update your mobile app to allow switching between environments:

```dart
// In server_config_service.dart
class ServerConfigService {
  static const String localUrl = 'http://192.168.0.68:5213';
  static const String productionUrl = 'https://your-backend.up.railway.app';
  
  // Add environment switcher in settings
}
```

## Monitoring & Maintenance

### Railway Dashboard Features
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Deployments**: Track deployment history
- **Environment Variables**: Manage secrets securely

### Updating Your App
1. Push changes to your GitHub repo
2. Railway auto-deploys changes
3. Monitor logs for any issues

### Database Backups
Railway provides automatic backups for PostgreSQL, but you can also:
```bash
railway postgres backup create
```

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Verify environment variables are set correctly
   - Check Railway database is running

2. **CORS Errors**
   - Ensure frontend URL is in backend CORS configuration
   - Update `Program.cs` with Railway frontend URL

3. **File Upload Issues**
   - Railway has ephemeral storage
   - Consider adding cloud storage (AWS S3, Cloudinary) later

4. **Environment Variable Issues**
   - Check Railway dashboard Variables tab
   - Restart services after variable changes

### Getting Help
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Check Railway service logs for detailed errors

## Security Checklist ✅
- [ ] Strong JWT secret (32+ characters)
- [ ] Secure database password
- [ ] HTTPS enabled (Railway provides this)
- [ ] Email credentials secured
- [ ] CORS configured properly
- [ ] Environment variables not exposed in client code

## Cost Management
- Railway has generous free tier
- Monitor usage in Railway dashboard
- Consider upgrading to Pro if needed ($5/month)

---

## Quick Commands Reference

```bash
# Railway CLI
railway login
railway link [project-id]
railway logs
railway status
railway shell

# Local Development  
dotnet run                    # Backend
npm run dev                  # Frontend
flutter run                  # Mobile

# Production URLs
Backend:  https://your-backend.up.railway.app
Frontend: https://your-frontend.up.railway.app
```

Good luck with your deployment! 🚀