# Routing Debug Instructions

## Current Issue
Users are still landing on SDP Dashboard instead of their department-specific dashboards.

## Debug Steps

### 1. Test the Frontend Directly
1. Open browser and go to: `http://localhost:5173`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try logging in with: `zondis411@gmail.com` / `password123`
5. Watch the console for routing debug messages

### 2. Expected Console Output
You should see messages like:
```
=== LOGIN ROUTING DEBUG ===
Raw user role: 7
Role type: number
SDP ID: 19
Department ID: 27
🎯 DETECTED QA MANAGER (Role 7) - Routing to QA Manager Dashboard
```

### 3. If You See Different Output
If you see messages like:
```
🏢 Routing to SDP Dashboard (SDP Affiliated)
```

This means the routing logic is falling through to the SDP Affiliated case instead of catching the department-specific cases.

### 4. Possible Issues

#### Issue A: Browser Cache
- Hard refresh the page (Ctrl+F5)
- Clear browser cache
- Try incognito/private browsing mode

#### Issue B: Frontend Not Updated
- Check if frontend process restarted successfully
- Look for compilation errors in the terminal

#### Issue C: Data Type Mismatch
- The role might be coming as a different data type than expected
- Check the exact values in the debug output

### 5. Quick Fix Test
If the routing is still not working, try this manual test:
1. Login with any of the problem users
2. In browser console, run:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Stored user:', user);
console.log('Role:', user.role, 'Type:', typeof user.role);
console.log('Department ID:', user.departmentId);
```

This will show exactly what data is being stored and used for routing decisions.

### 6. Expected Routes
- `zondis411@gmail.com` (Role 7) → `/qa-manager-dashboard`
- `maphangomaphango931@gmail.com` (Role 5) → `/logistics-manager-dashboard`  
- `nkwenkwezi68@gmail.com` (Role 3) → `/admin-manager-dashboard`

### 7. If Still Not Working
The issue might be that the routing logic needs to be more explicit or there's a data normalization problem in the backend API response.