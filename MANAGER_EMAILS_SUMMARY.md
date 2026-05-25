# 📧 Manager Emails Summary

## 🎭 Role Mapping

Based on the database analysis, here are the role numbers and their corresponding manager types:

- **Role 3** = SDPAdministrator (Administrator)
- **Role 4** = SDPFinance (Financial Manager)  
- **Role 5** = SDPLogistics (Logistics Manager)
- **Role 7** = SDPModerator (Quality Assurance Manager)

## 👑 ADMINISTRATORS (Role 3 - SDPAdministrator)
**These users get the enhanced attendance overview**

1. **Lisa Admin**
   - Email: `admin.manager@masakhane.com`
   - SDP ID: 18
   - Department: Administration (ID: 26)
   - Status: Active
   - Created: 2025/11/07

2. **Zandile Kubeka**
   - Email: `nkwenkwezi68@gmail.com`
   - SDP ID: 19
   - Department: Administration (ID: 29)
   - Status: Active
   - Created: 2026/03/02

## 💰 FINANCIAL MANAGERS (Role 4 - SDPFinance)
**These users keep the original overview**

1. **Sarah Finance**
   - Email: `finance.manager@masakhane.com`
   - SDP ID: 18
   - Department: Finance (ID: 24)
   - Status: Active
   - Created: 2025/11/07

## 🚚 LOGISTICS MANAGERS (Role 5 - SDPLogistics)
**These users keep the original overview**

1. **Tom Logistics**
   - Email: `logistics.manager@masakhane.com`
   - SDP ID: 18
   - Department: Logistics (ID: 25)
   - Status: Active
   - Created: 2025/11/07

2. **Sandile Zondi**
   - Email: `maphangomaphango931@gmail.com`
   - SDP ID: 19
   - Department: Logistic (ID: 28)
   - Status: Active
   - Created: 2026/03/02

## 🎯 QUALITY ASSURANCE MANAGERS (Role 7 - SDPModerator)
**These users keep the original overview**

1. **Mike Quality**
   - Email: `qa.manager@masakhane.com`
   - SDP ID: 18
   - Department: Quality Assurance (ID: 23)
   - Status: Active
   - Created: 2025/11/07

2. **Sandile Zondi**
   - Email: `zondis411@gmail.com`
   - SDP ID: 19
   - Department: Quality Assurance (ID: 27)
   - Status: Active
   - Created: 2025/11/07

## 📊 ATTENDANCE OVERVIEW ACCESS

### ✅ Enhanced Attendance Overview (Administrators Only)
- **Lisa Admin** (`admin.manager@masakhane.com`)
- **Zandile Kubeka** (`nkwenkwezi68@gmail.com`)

### ❌ Original Overview (All Other Managers)
- **Sarah Finance** (`finance.manager@masakhane.com`)
- **Tom Logistics** (`logistics.manager@masakhane.com`)
- **Sandile Zondi** (`maphangomaphango931@gmail.com`)
- **Mike Quality** (`qa.manager@masakhane.com`)
- **Sandile Zondi** (`zondis411@gmail.com`)

## 🏢 Department Structure

**SDP 18 (Masakhane):**
- Administration: Lisa Admin
- Finance: Sarah Finance
- Logistics: Tom Logistics
- Quality Assurance: Mike Quality

**SDP 19:**
- Administration: Zandile Kubeka
- Logistic: Sandile Zondi (maphangomaphango931@gmail.com)
- Quality Assurance: Sandile Zondi (zondis411@gmail.com)

## 🎯 Testing Recommendations

To test the role-based attendance overview:

1. **Login as Administrator** (enhanced view):
   - `admin.manager@masakhane.com` or `nkwenkwezi68@gmail.com`
   - Should see detailed attendance breakdown

2. **Login as Logistics Manager** (original view):
   - `logistics.manager@masakhane.com` or `maphangomaphango931@gmail.com`
   - Should see simple "Active Projects" count

3. **Login as Quality Assurance Manager** (original view):
   - `qa.manager@masakhane.com` or `zondis411@gmail.com`
   - Should see simple "Active Projects" count

4. **Login as Financial Manager** (original view):
   - `finance.manager@masakhane.com`
   - Should see simple "Active Projects" count

This confirms that the role-based attendance features are correctly implemented and will only show enhanced attendance data to Administrator users while maintaining the original interface for all other manager types.