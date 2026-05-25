# Site Expandability and Administrator Button Fix

## Issues Fixed

### 1. Administrator "Add Site" Button Removed
**Problem**: Administrator users were seeing the "Add Site" button, but they should only be able to view sites, not add them.

**Solution**: Added conditional rendering to only show the "Add Site" button for Logistics managers:

```tsx
{/* Only Logistics can add sites, Administrator can only view */}
{user?.role === 'SDPLogistics' && (
  <button
    className="btn btn-light btn-sm"
    onClick={() => {
      setAddSiteForm(prev => ({ ...prev, projectId: project.id }));
      setShowAddSiteModal(true);
    }}
  >
    ➕ Add Site
  </button>
)}
```

### 2. Site Expandability Enhanced
**Problem**: Sites might not appear clearly clickable for expansion.

**Solution**: Enhanced the site name button styling to make it more obvious it's clickable:

```tsx
<button
  className="btn btn-link text-white text-decoration-none p-0 text-start w-100"
  onClick={() => toggleSiteExpansion(site.id)}
  style={{cursor: 'pointer'}}
>
  <h6 className="card-title mb-0">
    {isSiteExpanded ? '▼' : '▶'} {site.siteName}
  </h6>
</button>
```

## How It Works Now

### For Logistics Managers (SDPLogistics)
1. Can see all sites under projects
2. Can click "Add Site" button to create new sites
3. Can click on site names to expand/collapse them
4. When expanded, sites show:
   - Full site details (address, contact info, coordinates)
   - "Add Class" button
   - List of classes
5. Can delete sites and classes

### For Administrators (SDPAdministrator)
1. Can see all sites under projects
2. **CANNOT** see "Add Site" button (view-only for sites)
3. Can click on site names to expand/collapse them
4. When expanded, sites show:
   - Full site details (address, contact info, coordinates)
   - "Add Class" button
   - List of classes
5. Can delete sites and classes

## Visual Indicators

### Site Expansion
- **Collapsed**: Shows `▶` arrow before site name
- **Expanded**: Shows `▼` arrow before site name
- Clicking the site name toggles expansion
- Cursor changes to pointer on hover

### Site Display
- **Collapsed view**: Shows basic info (code, category, location, beneficiaries, status)
- **Expanded view**: Shows all details plus classes section

## Testing

To test the changes:

1. **Login as Logistics Manager** (`admin.manager@masakhane.com` / `password123`)
   - Navigate to Projects
   - Expand a project
   - Verify "Add Site" button is visible
   - Click on a site name to expand it
   - Verify classes section appears with "Add Class" button

2. **Login as Administrator** (create one if needed)
   - Navigate to Projects
   - Expand a project
   - Verify "Add Site" button is NOT visible
   - Click on a site name to expand it
   - Verify classes section appears with "Add Class" button

## Files Modified

- `frontend/src/components/SDPManagerDashboard.tsx`
  - Added conditional rendering for "Add Site" button (Logistics only)
  - Enhanced site name button styling for better clickability
