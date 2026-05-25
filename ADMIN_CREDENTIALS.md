# RLMS Admin Credentials

## Current Status

### ✅ Verified Working
- **Database**: PostgreSQL on localhost:5432
- **Database Name**: rlms
- **Admin Account Exists**: YES
- **Password Hash Verified**: YES

### Admin Credentials (Verified in Database)
```
Email: admin@system.local
Password: Admin@123
```

The password `Admin@123` has been verified to match the hash in the PostgreSQL database using bcrypt.

### System Status
- Backend: Running on port 5213
- Frontend: Running on port 5173  
- PostgreSQL: Running on port 5432

### Issue
The login API is returning 401 Unauthorized even though:
1. The admin account exists in the database
2. The password hash is correct
3. BCrypt verification succeeds when tested directly

### Next Steps to Debug
1. Check if backend is actually querying PostgreSQL or a cached/different database
2. Add debug logging to the AuthController to see what's being compared
3. Verify the PasswordHashingService is using the same BCrypt work factor (12)

### Quick Test Commands
```powershell
# Verify admin in database
node check_admin_postgres.js

# Verify password hash
node verify_admin_password.js

# Test login
.\test_simple_login.ps1
```
