# cPanel Deployment Guide - NBSN System

Deploying a .NET Core and React system to cPanel requires a few specific steps since cPanel is primarily designed for PHP.

## 1. Database Setup (MySQL)
Standard cPanel hosting uses MySQL.
1. Log in to cPanel.
2. Go to **MySQL® Database Wizard**.
3. Create a database (e.g., `youruser_nbsn`).
4. Create a user and a strong password.
5. Grant **All Privileges** to the user for that database.
6. Note down the **Database Name**, **Username**, and **Password**.

## 2. Backend Deployment (.NET)
Since cPanel usually runs on Linux, you need to publish your app as a **Self-Contained Linux** application.

### Build Locally (on your computer):
Run this command in the `backend` folder:
```bash
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
```

### Upload to cPanel:
1. In cPanel, use **File Manager** to create a folder outside `public_html` (e.g., `/home/youruser/nbsn_api`).
2. Zip the contents of the `publish` folder and upload them to `/home/youruser/nbsn_api`.
3. **CRITICAL**: Copy your `.env` file from the project root into this same `/home/youruser/nbsn_api` folder.
4. Set the permission of the main executable file (named `backend`) to **755** (Executable).

Your server folder should look like this:
```text
/home/youruser/nbsn_api/
  ├── backend (executable)
  ├── backend.dll
  ├── .env  <-- IMPORTANT: Copy from your root folder
  ├── appsettings.json
  └── (other published files...)
```

## 3. Frontend Deployment (React)
The frontend build process automatically picks up variables from your root `.env` file.

### Build Locally:
1. Ensure your root `.env` has `VITE_API_URL=/api` set.
2. Open a terminal in the `frontend` folder.
3. Run the build command:
```bash
npm run build
```
*This creates a `dist` folder inside `frontend/`.*

### Upload to cPanel:
1. In cPanel **File Manager**, go to the `public_html` folder.
2. Upload all files and folders from inside `frontend/dist` directly into `public_html`.

---

## 4. Apache Configuration (.htaccess)
Since your `.env` file and project structure are organized at the root level locally, you need to tell Apache (cPanel) how to handle the React routing and the API proxy.

Create a file named `.htaccess` in your `public_html` folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Proxy API requests to the .NET Backend
  # Assuming the backend will run on port 5213
  RewriteRule ^api/(.*)$ http://127.0.0.1:5213/api/$1 [P,L]

  # 2. React SPA Routing
  # If the request is not for a real file or directory, serve index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## 5. Starting the Backend
On a VPS with cPanel, you can use **Terminal** or **SSH** to start the app:
```bash
cd ~/nbsn_api
nohup ./backend --urls "http://127.0.0.1:5213" > app.log 2>&1 &
```
*Note: If you are on shared hosting, you may need to ask your provider to allow running a persistent process or use a "Python/Node.js App" tool in cPanel if available to wrap the executable.*

## 7. Mobile App Deployment (Flutter)
Since you are moving to production, the mobile app needs to point to your new production URL.

### 1. Update the API URL:
Open `mobile/lib/services/api_service.dart` and change the `baseUrl`:
```dart
static const String baseUrl = 'https://yourdomain.com'; // Replace with your production domain
```

### 2. Build the Android APK:
In your terminal, navigate to the `mobile` folder and run:
```bash
flutter build apk --release
```
*This will generate a production-ready APK at `mobile/build/app/outputs/flutter-apk/app-release.apk`.*

### 3. Distribution:
- **Direct Download**: You can upload the `app-release.apk` to your cPanel `public_html` folder (e.g., `public_html/app.apk`) so users can download it directly from `yourdomain.com/app.apk`.
- **Play Store**: If you have a Google Play Console account, you can upload this APK (or an App Bundle) for official distribution.

---

## Final Checklist for cPanel
- [ ] Database created and privileges granted.
- [ ] Backend `.env` updated with production DB credentials.
- [ ] Backend binary permission set to **755**.
- [ ] Frontend built with `VITE_API_URL=/api` and uploaded to `public_html`.
- [ ] `.htaccess` file created in `public_html` for proxying and routing.
- [ ] Mobile app `baseUrl` updated and APK built for distribution.
