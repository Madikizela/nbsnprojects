# Railway Persistent Volume Setup

## Problem
Railway uses ephemeral (temporary) storage. Every time the backend service redeploys,
all files in /app/uploads are deleted. This causes:
- Learner profile photos to disappear from PDFs
- Learner signatures to disappear from PDFs
- Any uploaded documents to be lost

## Solution: Add a Railway Volume

### Step 1 — Add Volume in Railway Dashboard
1. Go to https://railway.app → your project
2. Click on the **Backend** service
3. Click **Settings** tab
4. Scroll down to **Volumes**
5. Click **"+ Add Volume"**
6. Set:
   - **Mount Path**: `/app/uploads`
   - **Size**: 5 GB (or more as needed)
7. Click **Add Volume**
8. Service will automatically redeploy

### Step 2 — Verify Volume is Working
After redeploy, call:
```
GET https://nbsnprojects-production.up.railway.app/api/seed/storage-check
```

You should see:
```json
{
  "uploadsExists": true,
  "writable": true
}
```

### Step 3 — Re-upload Photos and Signatures
Since all files were wiped before the volume was added:
- Learners need to re-upload their profile photos via the Learner Portal
- Learner signatures are captured during attendance clocking
- These will now persist permanently

## Cost
Railway Volumes are charged based on usage:
- ~$0.25/GB/month
- 5GB = ~$1.25/month

## After Volume is Set Up
All uploads will persist across:
- Redeploys
- Service restarts
- Railway maintenance

The PDF attendance calendar will show:
✅ Learner profile photo
✅ Learner signature
✅ Facilitator signature
✅ System logo (always works - in wwwroot)
