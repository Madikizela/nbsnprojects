# Reports Button Added to SDP Manager Dashboard

## Problem
The Reports page (containing Funder PDF, Competency Certificate, Monthly Attendance, and Stipend Schedule downloads) was not accessible from the SDP Manager Dashboard navigation panel.

## Solution
Added a "Reports & Certificates" button to the sidebar navigation for SDPAdministrators and SDPModerators.

## Changes Made

### 1. Updated `frontend/src/components/SDPManagerDashboard.tsx`
- **Imported FunderReport component** at the top of the file
- **Added Reports button** to the navigation sidebar (line ~10697)
  - Only visible for `isAdmin` or `isQA` users
  - Icon: 📄
  - Label: "Reports & Certificates"
- **Added rendering logic** for the reports section (line ~10826)
  - Renders `<FunderReport />` component when `activeSection === 'reports'`

### 2. Access Control
The Reports button is only visible to users with these roles:
- **SDPAdministrator (Role 3)** with a Department assigned
- **SDPModerator (Role 7)** - QA Manager
- **SDPAssessor (Role 8)**
- Any role with department name containing "admin", "quality", "moderator", or "assessor"

## Users with Access

Based on your current database:

### ✅ Users with Access:
1. **Nokwe Ngidi** - `ngidinokwe@gmail.com`
   - Role: SDPAdministrator (Administration Department)

2. **Ntsika Maphango** - `maphangosbusiso@gmail.com`
   - Role: SDPModerator (Quality Assurance Department)

## Features Available in Reports Section

Once logged in as one of the above users, they can access:

1. **📄 Funder / SETA Compliance Report (PDF)**
   - Full project compliance report
   - Learner headcount, attendance %, document compliance, competency rates

2. **🎓 Competency Certificate (PDF)**
   - Individual certificate for learners who achieved competency
   - Per learner, per project

3. **📅 Monthly Attendance Register (Excel)**
   - Monthly attendance reports by project
   - Select year and month

4. **💳 Stipend Schedule (Excel)**
   - Payment schedule based on attendance
   - Configurable daily rate

## How to Access

1. Log in with one of the authorized user accounts
2. Navigate to **SDP Manager Dashboard**
3. Click **"Reports & Certificates"** in the left sidebar
4. Select a project from the dropdown
5. Download the desired report

## Status
✅ **COMPLETED** - Changes deployed and frontend hot-reloaded successfully.

## Testing
To test, log in as:
- `ngidinokwe@gmail.com` (Admin)
- `maphangosbusiso@gmail.com` (QA Manager)

And verify the "Reports & Certificates" button appears in the sidebar.
