# Blank Screen Troubleshooting Guide

## Current Issue
After login, users see a blank screen instead of their dashboard.

## Possible Causes & Solutions

### 1. Dashboard Component Error
**Symptoms:** Routing works but dashboard shows blank
**Test:** Try accessing `/test-dashboard` after login
**Solution:** Check dashboard component for errors

### 2. Routing Logic Error  
**Symptoms:** No navigation happens after login
**Test:** Check browser console for routing debug messages
**Solution:** Fix routing conditions

### 3. Route Not Defined
**Symptoms:** 404 or blank page on specific routes
**Test:** Access dashboard routes directly (e.g., `/qa-manager-dashboard`)
**Solution:** Verify routes are defined in App.tsx

### 4. Component Import Error
**Symptoms:** Blank screen on specific routes
**Test:** Check browser console for import errors
**Solution:** Fix import statements

### 5. CSS/Styling Issue
**Symptoms:** Content exists but not visible
**Test:** Inspect element to see if content is there
**Solution:** Fix CSS styling

## Debugging Steps

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Login and check for errors
4. Look for routing debug messages

### Step 2: Test Simple Component
1. Login with QA manager (zondis411@gmail.com)
2. Should route to `/test-dashboard`
3. If you see "Test Dashboard" page, routing works
4. If blank screen, routing logic issue

### Step 3: Test Direct Route Access
1. Go directly to: `http://localhost:5173/test-dashboard`
2. Should show test dashboard
3. If blank, component loading issue

### Step 4: Check Network Tab
1. Open Network tab in Developer Tools
2. Login and check for failed requests
3. Look for 404s or 500 errors

## Current Test Setup
- Modified QA manager to route to `/test-dashboard`
- Added simple TestDashboard component
- This isolates routing vs component issues

## Next Steps Based on Results

### If Test Dashboard Shows:
- Routing works ✅
- Issue is with dashboard components
- Revert to original routing
- Fix dashboard component errors

### If Still Blank Screen:
- Routing logic issue ❌
- Check console for errors
- Verify user data structure
- Debug routing conditions

### If 404 Error:
- Route definition issue ❌
- Check App.tsx routes
- Verify component imports