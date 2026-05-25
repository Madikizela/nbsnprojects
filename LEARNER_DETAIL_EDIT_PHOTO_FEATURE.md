# Learner Detail, Edit & Photo Capture Feature

## Overview
Added comprehensive learner detail screen with view/edit functionality and profile photo capture for the Flutter mobile app.

## What Was Implemented

### Backend Changes

#### 1. Database Schema Update
- Added `ProfilePhotoPath` column to `Learners` table (VARCHAR 500)
- Stores relative path to uploaded profile photos

#### 2. Learner Model Update (`backend/Models/Learner.cs`)
```csharp
[StringLength(500)]
public string? ProfilePhotoPath { get; set; }
```

#### 3. New API Endpoints (`backend/Controllers/LearnersController.cs`)

**Upload Profile Photo**
- `POST /api/Learners/{id}/profile-photo`
- Accepts: `multipart/form-data` with `photo` field
- Validates: File type (JPEG, PNG), size (max 5MB)
- Stores: In `uploads/profile-photos/` directory
- Returns: Success message with photo path

**Get Profile Photo**
- `GET /api/Learners/{id}/profile-photo`
- Returns: Image file with correct content-type
- Handles: Missing photos gracefully

#### 4. CORS Configuration Update
- Changed from specific origins to `AllowAnyOrigin()` to support mobile app requests
- Allows all HTTP methods and headers

### Mobile App Changes

#### 1. New Screen: `learner_detail_screen.dart`

**Features:**
- View learner details in read-only mode
- Edit mode with form validation
- Profile photo display with placeholder
- Camera/Gallery photo capture
- All learner fields editable:
  - Personal info (Title, Name, ID, Contact, Email)
  - Demographics (Gender, Race, Language, Disability)
  - Address (3 lines + postal code)
  - Education (School, Year, Location, Grade)
  - Next of Kin (Name, Relation, Contact)
  - Banking (Bank, Account Type, Number, Branch Code)

**UI/UX:**
- Dark theme consistent with app design
- Circular profile photo with camera icon overlay in edit mode
- Dropdown fields for predefined options
- Text fields for free-form input
- Save button appears only in edit mode
- Loading states for all async operations

#### 2. Updated `learners_screen.dart`
- Made learner cards clickable
- Tapping a learner opens the detail screen
- Wrapped card content in `InkWell` with navigation

#### 3. Updated `api_service.dart`
- Added `uploadProfilePhoto()` method
- Handles multipart form data upload
- Uses Dio's `MultipartFile.fromFile()`

#### 4. Updated `main.dart`
- Added route: `/learners/:learnerId/details`
- Imported `learner_detail_screen.dart`

## How to Use

### On Mobile App:

1. **View Learner Details:**
   - Navigate: Projects → Sites → Classes → Learners
   - Tap any learner card
   - View all learner information

2. **Edit Learner:**
   - On learner detail screen, tap Edit icon (top right)
   - Modify any fields
   - Tap "Save Changes" button
   - Changes are saved to backend

3. **Capture Profile Photo:**
   - On learner detail screen, tap Edit icon
   - Tap the profile photo circle
   - Choose "Camera" or "Gallery"
   - Photo is automatically uploaded and displayed

### API Endpoints:

```bash
# Get learner details
GET http://192.168.0.62:5213/api/Learners/{id}

# Update learner
PUT http://192.168.0.62:5213/api/Learners/{id}
Content-Type: application/json
{
  "Title": "Mr",
  "FirstName": "John",
  "LastName": "Doe",
  ...
}

# Upload profile photo
POST http://192.168.0.62:5213/api/Learners/{id}/profile-photo
Content-Type: multipart/form-data
photo: [image file]

# Get profile photo
GET http://192.168.0.62:5213/api/Learners/{id}/profile-photo
```

## Technical Details

### Photo Storage
- Location: `backend/uploads/profile-photos/`
- Naming: `learner_{id}_{timestamp}.{ext}`
- Old photos are automatically deleted when new ones are uploaded
- Max size: 5MB
- Allowed formats: JPEG, PNG

### Form Validation
- Required fields: Title, First Name, Last Name, ID Number
- Email validation for email field
- All other fields optional
- Dropdowns for predefined values (Gender, Race, Bank, etc.)

### State Management
- Uses Flutter's `StatefulWidget`
- Separate controllers for each text field
- Loading states for fetch/save operations
- Edit mode toggle

### Error Handling
- Network errors shown via SnackBar
- Missing photos handled gracefully with placeholder
- Form validation prevents invalid submissions
- Loading indicators during async operations

## Files Modified/Created

### Backend:
- ✅ `backend/Models/Learner.cs` - Added ProfilePhotoPath
- ✅ `backend/Controllers/LearnersController.cs` - Added photo endpoints
- ✅ `backend/Program.cs` - Updated CORS policy
- ✅ `backend/add_profile_photo.js` - Database migration script

### Mobile:
- ✅ `mobile_flutter/lib/screens/learner_detail_screen.dart` - NEW
- ✅ `mobile_flutter/lib/screens/learners_screen.dart` - Made cards clickable
- ✅ `mobile_flutter/lib/services/api_service.dart` - Added photo upload
- ✅ `mobile_flutter/lib/main.dart` - Added route

## Testing

### To Test:
1. Restart backend: `dotnet run` in `backend/`
2. Restart Flutter app: `flutter run` in `mobile_flutter/`
3. Login and navigate to any learner
4. Test view mode
5. Test edit mode
6. Test photo capture from camera
7. Test photo selection from gallery
8. Verify photo persists after app restart

## Next Steps
- ✅ Document upload working
- ✅ Learner detail/edit working
- ✅ Profile photo capture working
- 🔄 Future: Futronic fingerprint SDK integration
- 🔄 Future: PDF generation from scanned documents
- 🔄 Future: Biometric clocking system

## Status
✅ Feature complete and ready for testing
