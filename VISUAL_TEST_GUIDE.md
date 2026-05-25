# Visual Test Guide - Site Expandability & Class Management

## Test Scenario 1: Logistics Manager View

### Login
- Email: `admin.manager@masakhane.com`
- Password: `password123`
- Expected Role: SDPLogistics (or SDPAdministrator based on current data)

### Steps to Test

1. **Navigate to Projects Section**
   - Click on "Projects" in the navigation
   - You should see a list of projects

2. **Expand a Project**
   - Click "▶ Show Details" button on any project
   - Project should expand to show learning pathways and qualifications

3. **View Sites Section**
   - Scroll down in the expanded project
   - You should see "🏢 Project Sites" section
   - **For Logistics**: "➕ Add Site" button should be visible
   - **For Administrator**: "➕ Add Site" button should NOT be visible

4. **Expand a Site**
   - Look for a site in the list (if none exist, create one first)
   - Site should show:
     - `▶ Site Name` (collapsed state)
     - Basic info: Code, Category, Location, Beneficiaries, Status
   - Click on the site name (the entire line with the arrow)
   - Arrow should change from `▶` to `▼`
   - Site should expand to show:
     - Full address
     - Contact person details
     - Coordinates
     - **🎓 Classes** section with "➕ Add Class" button

5. **Add a Class**
   - Click "➕ Add Class" button
   - Modal should open with title "🎓 Class Information"
   - Fill in:
     - Class Name: "Plumbing Class A" (only letters and spaces)
     - Maximum Learners: "25" (positive number)
   - Click "🎓 Add Class" button
   - Class should appear in the list

6. **View Class List**
   - Classes should display in cards showing:
     - Class name
     - Max Learners
     - Status badge (Active)
     - Delete button (🗑️)

7. **Collapse Site**
   - Click on the site name again
   - Arrow should change from `▼` to `▶`
   - Classes section should hide
   - Only basic site info should remain visible

## Test Scenario 2: Administrator View

### Login as Administrator
- Create an administrator user if needed
- Or use existing administrator credentials

### Steps to Test

1. **Navigate to Projects Section**
   - Same as Logistics manager

2. **Expand a Project**
   - Same as Logistics manager

3. **View Sites Section**
   - Should see "🏢 Project Sites" section
   - **"➕ Add Site" button should NOT be visible** ✅ This is the key difference

4. **Expand a Site**
   - Same as Logistics manager
   - Can still expand/collapse sites
   - Can still see all site details
   - Can still see and manage classes

5. **Add a Class**
   - Same as Logistics manager
   - Administrator CAN add classes (just not sites)

## Visual Indicators to Look For

### Site Expansion States

**Collapsed:**
```
▶ Test Training Site
Code: TTS001
Category: Workplace
Location: Johannesburg, Gauteng
Beneficiaries: 50
[Active]
```

**Expanded:**
```
▼ Test Training Site
Code: TTS001
Category: Workplace
Location: Johannesburg, Gauteng
Beneficiaries: 50
[Active]
─────────────────────────────
Address: 123 Test Street
Contact: John Doe (0821234567)
Email: john.doe@test.com
Coordinates: -26.2041, 28.0473

🎓 Classes                    [➕ Add Class]
┌─────────────────────────────────────────┐
│ Plumbing Class A              [🗑️]      │
│ Max Learners: 25                        │
│ [Active]                                │
└─────────────────────────────────────────┘
```

## Common Issues & Solutions

### Issue: Site doesn't expand when clicked
**Solution**: Make sure you're clicking on the site name itself (the text with the arrow), not just anywhere on the card.

### Issue: Classes don't load
**Solution**: Check browser console for errors. Verify backend is running on port 5213.

### Issue: "Add Site" button visible for Administrator
**Solution**: Clear browser cache and refresh. Verify user role is correct.

### Issue: Validation errors when adding class
**Solution**: 
- Class name must contain only letters and spaces (no numbers, no special characters)
- Max learners must be a positive number (greater than 0)

## Browser Console Checks

Open browser console (F12) and check for:
- No JavaScript errors
- Network requests to `/api/SiteClasses/site/{id}` should return 200 OK
- Network requests to `/api/SiteClasses` POST should return 201 Created

## Expected API Calls

When expanding a site:
```
GET /api/SiteClasses/site/2
Response: 200 OK
[
  {
    "id": 1,
    "projectSiteId": 2,
    "siteName": "Test Training Site",
    "className": "Plumbing Class A",
    "maxLearners": 25,
    "status": "Active",
    ...
  }
]
```

When adding a class:
```
POST /api/SiteClasses
Body: {
  "projectSiteId": 2,
  "className": "Electrical Class B",
  "maxLearners": 30
}
Response: 201 Created
```
