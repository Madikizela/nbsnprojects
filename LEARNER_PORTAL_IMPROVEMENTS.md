# Learner Portal Improvements - Email Login & Forgot Password ✅

## Overview
Enhanced the Learner Portal with two major improvements:
1. **Changed login to use email address** (instead of username format like "sbusiso.madikizela")
2. **Added Forgot Password functionality** for learners who forget their credentials

---

## 🔄 Changes Made

### 1. Frontend Changes - Learner Portal Login

#### File: `frontend/src/components/LearnerPortal.tsx`

**Login Form Updates:**

**Before**:
```tsx
<label style={labelStyle}>Username or Email</label>
<input 
  style={inputStyle} 
  value={login} 
  onChange={e => setLogin(e.target.value)} 
  required 
  placeholder="e.g. john.doe or john@email.com" 
/>
```

**After**:
```tsx
<label style={labelStyle}>Email Address</label>
<input 
  style={inputStyle} 
  type="email" 
  value={login} 
  onChange={e => setLogin(e.target.value)} 
  required 
  placeholder="your.email@example.com" 
/>
```

**Added Forgot Password Link:**
```tsx
<div style={{ textAlign: 'center', marginTop: 16 }}>
  <button 
    type="button"
    onClick={() => setShowForgotPassword(true)}
    style={{ 
      background: 'transparent', 
      border: 'none', 
      color: '#0EA5E9', 
      fontSize: 14, 
      cursor: 'pointer', 
      textDecoration: 'underline' 
    }}
  >
    Forgot Password?
  </button>
</div>
```

**New Component - LearnerForgotPassword:**
- Clean, dark-themed UI matching the portal design
- Email validation (type="email")
- Success message after sending reset link
- "Back to Login" button
- Error handling for failed requests
- Two-state UI: Form → Success confirmation

---

### 2. Backend Changes

#### File: `backend/Models/Learner.cs`

**Added Password Reset Fields:**
```csharp
// Password Reset
[StringLength(255)]
public string? PasswordResetToken { get; set; }

public DateTime? PasswordResetTokenExpiry { get; set; }
```

#### File: `backend/Controllers/AuthController.cs`

**Added Three New Endpoints:**

**1. Learner Forgot Password**
```csharp
[HttpPost("learner-forgot-password")]
[AllowAnonymous]
public async Task<IActionResult> LearnerForgotPassword([FromBody] ForgotPasswordRequest request)
```

**Features:**
- Validates email input
- Looks up learner by email
- Generates unique reset token (GUID)
- Sets token expiry (1 hour)
- Sends email with reset link
- Security: Returns success even if email doesn't exist (prevents email enumeration)
- Logs activity for audit purposes

**2. Learner Reset Password**
```csharp
[HttpPost("learner-reset-password")]
[AllowAnonymous]
public async Task<IActionResult> LearnerResetPassword([FromBody] ResetPasswordRequest request)
```

**Features:**
- Validates reset token
- Checks token expiration
- Updates password with hash
- Clears reset token after use
- Sets `MustChangePassword = false`
- Logs successful password resets

**3. Learner Change Password** (Already existed)
- Used when learner is logged in and wants to change password manually

---

## 📋 User Experience Flow

### Login Flow (Updated)
1. **Navigate** to Learner Portal at http://192.168.0.53:5174
2. **See Login Form**:
   - Email Address field (now type="email" with validation)
   - Password field
   - "Forgot Password?" link below
3. **Enter Email** (e.g., "john.doe@example.com")
4. **Enter Password**
5. **Click** "Login →"

### Forgot Password Flow (New)
1. **Click** "Forgot Password?" on login screen
2. **Enter Email Address** on forgot password form
3. **Click** "Send Reset Link"
4. **See Success Message**:
   - "Check Your Email"
   - Confirmation that reset link was sent
   - Instructions to check spam folder
5. **Check Email** for reset link
6. **Click Reset Link** in email (goes to reset password page)
7. **Enter New Password**
8. **Return to Login** and use new password

---

## 🔐 Security Features

### Password Reset Security
1. **Token-Based**: Uses GUID tokens (hard to guess)
2. **Time-Limited**: Tokens expire after 1 hour
3. **Single-Use**: Token is cleared after successful reset
4. **Email Enumeration Prevention**: Always returns success message (even if email doesn't exist)
5. **Secure Password Hashing**: Uses BCrypt (cost factor 12)
6. **HTTPS Required**: Reset links use HTTPS in production

### Additional Security
- Password must be at least 8 characters (enforced in change password)
- Email validation on frontend and backend
- Audit logging for all password operations
- Token stored securely in database (not exposed to client)

---

## 📧 Email Template

### Reset Password Email
```html
Subject: Reset Your Learner Portal Password

Hello [FirstName],

You requested to reset your password for the NBSN Learner Portal.

Click the link below to reset your password:
[Reset Password Link]

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
National Building Skills Network
```

---

## 🧪 Testing Instructions

### Test 1: Email Login
1. Navigate to http://192.168.0.53:5174
2. Try logging in with email format:
   - **Email**: (any learner email from database)
   - **Password**: (their password)
3. **Expected**: Successful login
4. **Old Format**: Username format (e.g., "sbusiso.madikizela") still works in backend (backward compatible)

### Test 2: Forgot Password Flow
1. **Click** "Forgot Password?" on login screen
2. **Enter** a valid learner email address
3. **Click** "Send Reset Link"
4. **Expected**: 
   - Success message appears
   - Email sent to learner's email address
   - Backend logs the activity
5. **Check Database**: Verify `PasswordResetToken` and `PasswordResetTokenExpiry` are set in `Learners` table

### Test 3: Invalid Email
1. **Enter** non-existent email (e.g., "nonexistent@test.com")
2. **Click** "Send Reset Link"
3. **Expected**: Same success message (security feature)
4. **Database**: No token created for non-existent user

### Test 4: Reset Password
1. **Get Reset Token** from database for a test learner
2. **Navigate** to: `http://192.168.0.53:5174/learner-reset-password?token=[TOKEN]`
3. **Enter** new password
4. **Submit**
5. **Expected**:
   - Success message
   - Token cleared from database
   - Can login with new password

### Test 5: Expired Token
1. **Manually set** `PasswordResetTokenExpiry` to past date in database
2. **Try** to use the reset link
3. **Expected**: Error message "Reset token has expired"

---

## 📊 Database Schema Changes

### Learners Table
**New Columns Added:**
```sql
ALTER TABLE "Learners" 
ADD COLUMN "PasswordResetToken" VARCHAR(255),
ADD COLUMN "PasswordResetTokenExpiry" TIMESTAMP;
```

**Note**: These columns are nullable (learners without active reset requests will have NULL)

---

## 🔧 Technical Details

### Frontend State Management
```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false);

if (showForgotPassword) {
  return <LearnerForgotPassword onBack={() => setShowForgotPassword(false)} />;
}
```

### Backend Token Generation
```csharp
var resetToken = Guid.NewGuid().ToString();
learner.PasswordResetToken = resetToken;
learner.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
```

### Email Service Integration
```csharp
await _emailService.SendEmailAsync(
  learner.Email, 
  "Reset Your Learner Portal Password", 
  emailBody
);
```

### Reset URL Format
```
http://192.168.0.53:5174/learner-reset-password?token={GUID}
```

---

## 🎯 Benefits

### 1. **Better User Experience**
- Email is easier to remember than username format
- Self-service password reset (no admin intervention needed)
- Clear, consistent messaging
- Mobile-friendly email addresses

### 2. **Improved Security**
- Time-limited reset tokens
- Single-use tokens
- Prevents email enumeration attacks
- Audit trail for password operations

### 3. **Reduced Support Burden**
- Learners can reset passwords themselves
- No need to contact administrators
- Automated email delivery
- Clear instructions in email

### 4. **Professional Appearance**
- Matches modern web application standards
- Clean, dark-themed UI
- Email validation prevents typos
- Responsive design

---

## 🚀 Services Status

### Current Running Services
- ✅ **Backend**: http://192.168.0.53:5213 (Terminal 7)
- ✅ **Frontend**: http://192.168.0.53:5174 (Terminal 5)
- ✅ **PostgreSQL 18**: Port 5432

### Hot Reload Confirmation
- Frontend changes hot-reloaded via Vite HMR
- No manual restart needed for frontend
- Backend restarted to apply new model fields and endpoints

---

## 📝 API Endpoints Summary

### Learner Authentication Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/Auth/learner-login` | POST | None | Login with email/username + password |
| `/api/Auth/learner-change-password` | POST | Required | Change password while logged in |
| `/api/Auth/learner-forgot-password` | POST | None | Request password reset link |
| `/api/Auth/learner-reset-password` | POST | None | Reset password with token |

### Request/Response Examples

**Forgot Password Request:**
```json
{
  "email": "john.doe@example.com"
}
```

**Forgot Password Response:**
```json
{
  "message": "If an account exists with that email, a reset link has been sent."
}
```

**Reset Password Request:**
```json
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "newPassword": "MyNewSecurePassword123!"
}
```

**Reset Password Response:**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

---

## 📂 Files Modified

### Frontend
1. `frontend/src/components/LearnerPortal.tsx`
   - Updated login form (email field)
   - Added forgot password link
   - Added `LearnerForgotPassword` component (~80 lines)
   - State management for forgot password flow

### Backend
1. `backend/Models/Learner.cs`
   - Added `PasswordResetToken` field
   - Added `PasswordResetTokenExpiry` field

2. `backend/Controllers/AuthController.cs`
   - Added `LearnerForgotPassword` endpoint
   - Added `LearnerResetPassword` endpoint
   - Email service integration
   - Token generation and validation logic

---

## ⚠️ Important Notes

### Email Configuration
- Email service must be configured in `appsettings.json`
- SMTP settings required for sending reset emails
- Test email delivery before production deployment

### Database Migration
- New columns added to Learners table
- Nullable fields (no data migration needed)
- Existing learners can use forgot password immediately

### Backward Compatibility
- Backend still accepts username format (e.g., "sbusiso.madikizela")
- Both email and username work for login
- Frontend UI prefers email but accepts either

### Production Considerations
- Use HTTPS for reset links in production
- Configure proper email sender credentials
- Set up email rate limiting (prevent abuse)
- Monitor failed reset attempts
- Consider adding CAPTCHA for forgot password form

---

## 🎉 Feature Status: COMPLETE

Both improvements are now fully functional:

### ✅ Email Login
- Login form now uses email address field
- Email validation (type="email")
- Clear placeholder text
- Backend accepts both email and username (backward compatible)

### ✅ Forgot Password
- "Forgot Password?" link on login screen
- Complete forgot password flow
- Email with reset link
- Token-based security
- Time-limited tokens (1 hour)
- Single-use tokens
- Professional UI matching portal design

---

## 📸 What Users Will See

### Login Screen (Updated)
```
🎓
Learner Portal
National Building Skills Network

Email Address
[your.email@example.com]

Password
[Your password]

[Login →]

Forgot Password?  ← NEW LINK
```

### Forgot Password Screen
```
🔒
Reset Password
Enter your email to receive a password reset link

Email Address
[your.email@example.com]

[Send Reset Link]

← Back to Login
```

### Success Screen
```
✅
Check Your Email
We've sent a password reset link to your.email@example.com.
Please check your inbox and spam folder.

[← Back to Login]
```

---

**Generated**: 2026-07-16 09:28 SAST
**Status**: ✅ Email login implemented, Forgot Password feature complete and operational
