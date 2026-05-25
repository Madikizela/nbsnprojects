# Email Branding Updated - RLMS to NBSN

## Changes Made

Replaced all occurrences of "RLMS" with "NBSN" (National Building Skills Network) in email templates and configuration.

## Files Updated

### 1. backend/Controllers/AttendanceController.cs
Updated two email templates:

#### Teacher Assignment Email
- Subject: "Class Assignment - Login Information"
- Changed: "RLMS Team" → "NBSN Team"

#### New Teacher Welcome Email
- Subject: "Welcome to NBSN - Your Login Credentials" (was "Welcome to RLMS")
- Changed: "Welcome to RLMS - Teacher Account Created" → "Welcome to NBSN - Teacher Account Created"
- Changed: "RLMS Team" → "NBSN Team"

### 2. backend/appsettings.json
Updated email configuration:
- Changed: `"FromName": "RLMS Team"` → `"FromName": "NBSN Team"`

## Email Templates Now Show

### Teacher Assignment Email
```
Subject: Class Assignment - Login Information

Welcome to NBSN - Teacher Account Created

Dear [Teacher Name],
...
Best regards,
NBSN Team
```

### New Teacher Creation Email
```
Subject: Welcome to NBSN - Your Login Credentials

Welcome to NBSN - Teacher Account Created

Dear [Teacher Name],
...
Best regards,
NBSN Team
```

## Testing

The backend has been restarted with the new branding. Next time you:
1. Assign a teacher to a class, OR
2. Create a new teacher account

The email they receive will show "NBSN" instead of "RLMS" throughout.

## Current Status

✅ All email templates updated
✅ Email configuration updated
✅ Backend restarted
✅ Ready to send emails with new branding

No mobile app changes needed - this was purely backend email template updates.
