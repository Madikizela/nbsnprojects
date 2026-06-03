# 🚂 Deploy NBSN System to Railway

This guide will help you deploy your NBSN web application to Railway!

## Prerequisites

- A GitHub account
- A Railway account (sign up at [railway.app](https://railway.app))
- Your code pushed to a GitHub repository

## Deployment Steps

### Step 1: Prepare Your GitHub Repository
1. Make sure all your changes are committed and pushed to GitHub
2. Your repository should have these files:
   - `railway.toml` (we created this)
   - `backend/Dockerfile.production`
   - `frontend/Dockerfile.production`
   - `.railwayignore`
3. Your database is already on Railway (you already have this!)

### Step 2: Create a Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → Choose **"Empty Project"**
3. (Optional) Rename your project to something like "NBSN System"

### Step 3: Deploy the Backend
1. In your project, click **"+ New"** → Choose **"GitHub Repo"**
2. Connect your GitHub account and select your repository
3. Configure the service:
   - **Branch**: Choose your main branch (e.g., `main` or `master`)
   - **Root Directory**: Set to `backend`
   - **Dockerfile Path**: Set to `backend/Dockerfile.production`
4. Add Environment Variables (go to **Variables** tab):
   ```
   # Database connection (your existing Railway DB)
   ConnectionStrings__DefaultConnection=Host=kodama.proxy.rlwy.net;Port=37095;Database=railway;Username=postgres;Password=HsHDTqivYAtEBXKhRbnWqWxEWVjsLFLO
   
   # JWT Settings (generate a secure secret!)
   JwtSettings__SecretKey=replace_this_with_a_very_long_secure_secret_key_at_least_32_characters
   JwtSettings__Issuer=DocumentManagementSystem
   JwtSettings__Audience=DocumentManagementUsers
   JwtSettings__ExpiryMinutes=60
   
   # Encryption
   Encryption__DataKey=replace_this_with_your_encryption_data_key
   
   # Email Settings (SMTP - replace with your own)
   Email__SmtpHost=smtp.gmail.com
   Email__SmtpPort=587
   Email__SmtpUsername=your_email@gmail.com
   Email__SmtpPassword=your_app_password_here
   Email__FromEmail=your_email@gmail.com
   Email__FromName=NBSN Team
   
   # Environment
   ASPNETCORE_ENVIRONMENT=Production
   ```
5. Generate a domain for your backend:
   - Go to **Settings** → **Networking** → Click **"Generate Domain"**
   - Copy the URL (it will look like `https://nbsn-backend-production.up.railway.app`)
6. Wait for the backend to deploy successfully!

### Step 4: Deploy the Frontend
1. In your project, click **"+ New"** → Choose **"GitHub Repo"**
2. Select your same repository
3. Configure the service:
   - **Branch**: Same as your backend
   - **Root Directory**: Set to `frontend`
   - **Dockerfile Path**: Set to `frontend/Dockerfile.production`
4. Add Environment Variables (go to **Variables** tab):
   ```
   # Use your backend's Railway domain here!
   VITE_API_URL=https://your-backend-domain.up.railway.app
   ```
5. Generate a domain for your frontend:
   - Go to **Settings** → **Networking** → Click **"Generate Domain"**
6. Wait for the frontend to deploy!

### Step 5: Test Your Deployment
1. Visit your frontend's domain in a browser
2. Try logging in to make sure everything works!

## Important Notes
- **Security**: Never commit your `.env` file to GitHub!
- **JWT Secret**: Make sure to generate a secure, random secret for production!
- **Email**: If you don't need email functionality, you can skip those variables
- **Database**: Your database is already on Railway, so no need to add another one!

## Troubleshooting
- If something goes wrong, check the **Logs** tab in each Railway service
- Make sure your environment variables are spelled correctly (case-sensitive!)
