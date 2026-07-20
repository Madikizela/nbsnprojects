# 🚦 Services Status

**Updated**: July 15, 2026 - 11:40 AM

---

## Current Status

| Service | Status | Details |
|---------|--------|---------|
| **PostgreSQL 18** | ⚠️ NEEDS START | Not running - start manually |
| **Backend API** | ⏳ WAITING | Waiting for PostgreSQL (Terminal 2) |
| **Frontend** | ✅ RUNNING | http://192.168.0.53:5174 (Terminal 3) |

---

## 🔴 Action Required: Start PostgreSQL

PostgreSQL needs to be started manually. Choose one method:

### Method 1: Services (Easiest)
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "postgresql-x64-18" in the list
4. Right-click → Start

### Method 2: Command Line
```powershell
# Run as Administrator
net start postgresql-x64-18
```

### Method 3: Use the Script
```powershell
.\start_all_services.ps1
```

---

## Once PostgreSQL Starts

The backend (Terminal 2) will automatically connect and start serving on:
- **URL**: http://192.168.0.53:5213
- **Status**: Will show "Now listening on: http://192.168.0.53:5213"

---

## ✅ Frontend Already Running

- **URL**: http://192.168.0.53:5174
- **Terminal**: 3
- **Status**: Ready and serving

---

## 📱 Next Steps After Services Running

Once all services are up:

1. **Check Backend Status**
   - Visit: http://192.168.0.53:5213/api/health (should return OK)

2. **Check Frontend**
   - Visit: http://192.168.0.53:5174 (should load the app)

3. **Deploy Mobile App**
   - Connect Samsung phone
   - Run: `cd mobile_flutter` then `.\deploy_to_phone.ps1`

---

## 🔍 Service Details

### PostgreSQL 18
- **Port**: 5432
- **Database**: nbsnproject
- **Username**: postgres
- **Password**: your_password_here

### Backend API
- **Port**: 5213
- **Host**: 192.168.0.53
- **Terminal**: 2 (waiting for PostgreSQL)
- **Log**: Shows database connection status

### Frontend
- **Port**: 5174
- **Host**: 192.168.0.53
- **Terminal**: 3 (running ✅)
- **Tech**: Vite + React

---

## 📖 Documentation

- **Start Services**: `start_all_services.ps1`
- **Deploy Mobile**: `README_START_HERE.md`
- **Visual Status**: `VISUAL_STATUS.md`
- **Deployment Guide**: `DEPLOY_MOBILE_NOW.md`

---

**Action**: Start PostgreSQL using one of the methods above 👆
