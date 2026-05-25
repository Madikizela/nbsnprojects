# Production Deployment Guide - NBSN System

This guide provides instructions for deploying the system to a production environment using Docker and Docker Compose.

## Prerequisites
- A server with Docker and Docker Compose installed.
- A registered domain name (optional, but recommended for SSL).
- SMTP credentials for email notifications.

## 1. Environment Configuration
Create a `.env` file in the root directory of the project on the production server. You can use the provided `.env.example` as a template.

**Crucial Settings:**
- `DB_PASS`: A strong password for the PostgreSQL database.
- `JWT_SECRET`: A long, unique string for securing authentication tokens.
- `ENCRYPTION_DATA_KEY`: A secure key for encrypting learner documents.
- `SMTP_*`: Your production email server details.

## 2. Deployment Steps

1. **Copy Files to Server**
   Copy the following files/directories to your production server:
   - `backend/`
   - `frontend/`
   - `docker-compose.prod.yml`
   - `.env`

2. **Build and Start Containers**
   Run the following command in the root directory:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Verify Deployment**
   - Backend API: `http://<your-server-ip>:5213/api/test/ping`
   - Frontend: `http://<your-server-ip>`

## 3. Database Management
The database is persistent via the `postgres_prod_data` volume. To perform backups:
```bash
docker exec rlms-db-prod pg_dump -U postgres rlms > backup_$(date +%F).sql
```

## 4. Security Recommendations
- **Enable SSL**: Use a reverse proxy like Nginx with Certbot (Let's Encrypt) on the host machine to handle HTTPS on port 443.
- **Firewall**: Ensure only ports 80 (and 443 if using SSL) are open to the public. Keep 5432 and 5213 internal.
- **Secrets**: Never commit your `.env` file to version control.

## 5. Troubleshooting
Check logs if any service fails to start:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```
