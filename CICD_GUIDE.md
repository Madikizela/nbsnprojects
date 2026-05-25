# CI/CD Setup Guide for GitHub Actions

This guide explains how to set up the automated deployment for your NBSN System using GitHub Actions and cPanel.

## 1. Prerequisites
- Your code must be pushed to a GitHub repository.
- You must have SSH access enabled in your cPanel account.
- You must have FTP access details for your cPanel account.

## 2. GitHub Secrets Configuration
To enable the deployment, you need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** for each of the following:

### **Frontend (FTP)**
- `FTP_SERVER`: Your FTP host (e.g., `ftp.yourdomain.com`).
- `FTP_USERNAME`: Your FTP username.
- `FTP_PASSWORD`: Your FTP password.

### **Backend (SSH)**
- `SSH_HOST`: Your server IP or domain.
- `SSH_USERNAME`: Your cPanel username.
- `SSH_PRIVATE_KEY`: Your SSH private key.
  - *Generate this in cPanel under "SSH Access" and add the public key to "Authorized Keys".*
- `SSH_PORT`: (Optional) Usually `22` or `2222`.

## 3. How it Works
Every time you push code to the `main` branch:
1. **GitHub** builds your .NET backend and React frontend.
2. **Frontend** files are automatically uploaded to your `public_html` folder via FTP.
3. **Backend** binaries are uploaded to `~/nbsn_api` via SSH.
4. **Backend** process is automatically restarted on the server.

## 4. Mobile App (Manual Step)
CI/CD for mobile apps (APK) is possible but complex for cPanel. It is recommended to continue building the APK locally and uploading it to your site manually as needed.

## 5. Security Note
Your `.env` file should **NEVER** be pushed to GitHub. The backend on the server will use the `.env` file you manually created in the `~/nbsn_api` folder.
