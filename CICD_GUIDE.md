# CI/CD Multi-Environment Setup Guide

This guide explains how to manage two separate environments (**Staging** and **Production**) using GitHub Actions and cPanel.

## 1. Environment Logic
The system uses branch-based deployment:
- **`develop` branch**: Deploys automatically to your **Staging** server.
- **`main` branch**: Deploys automatically to your **Production** server.

## 2. GitHub Secrets Configuration
You must configure separate secrets for both environments in GitHub (**Settings** > **Secrets** > **Actions**).

### **Production Secrets (main branch)**
- `PROD_FTP_SERVER`
- `PROD_FTP_USERNAME`
- `PROD_FTP_PASSWORD`
- `PROD_SSH_HOST`
- `PROD_SSH_USERNAME`
- `PROD_SSH_PRIVATE_KEY`
- `PROD_SSH_PORT` (Optional)

### **Staging Secrets (develop branch)**
- `STAGING_FTP_SERVER`
- `STAGING_FTP_USERNAME`
- `STAGING_FTP_PASSWORD`
- `STAGING_SSH_HOST`
- `STAGING_SSH_USERNAME`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_SSH_PORT` (Optional)

## 3. Deployment Workflow
1.  **Develop & Test**: Work on your features in a local branch.
2.  **Push to Staging**: Merge your changes into the `develop` branch and push to GitHub. The system will build and deploy to your Staging server.
3.  **Verify**: Test your changes on the Staging URL.
4.  **Go Live**: Once verified, create a Pull Request from `develop` to `main`. After merging, the system will build and deploy to your Production server.

## 4. Server Folder Structure
To keep environments separate on your cPanel account, it is recommended to use different subdomains or folders:
- **Production**: `public_html` and `~/nbsn_api`
- **Staging**: `public_html/staging` (or a subdomain folder) and `~/nbsn_api_staging`

*Note: You will need to update the `server-dir` and `target` paths in `.github/workflows/deploy.yml` if your staging folders are different from production.*

## 5. Environment Variables (.env)
Each server must have its own `.env` file in its respective backend folder.
- **Staging `.env`**: Point to a staging database (e.g., `user_nbsn_staging`).
- **Production `.env`**: Point to the live production database.
