# Sequential Question Scanning Feature

## Feature Description
Implemented sequential question scanning logic that enforces users to complete questions in order (Question 1 → Question 2 → Question 3, etc.) within each assessment.

## Implementation Details

### Sequential Logic
- **Question 1**: Always accessible (first question)
- **Question 2**: Only accessible after Question 1 is completed
- **Question 3**: Only accessible after Questions 1 & 2 are completed
- **And so on...**

### Visual Indicators

#### Accessible Questions (Ready to Scan)
- **Border**: Blue (formative) or Red (summative) 
- **Icon**: Question number (1, 2, 3...)
- **Status**: "Tap to scan answer"
- **Opacity**: 100% (fully visible)
- **Clickable**: ✅ Yes

#### Completed Questions
- **Border**: Green
- **Icon**: Green checkmark ✅
- **Status**: "Answer scanned: [timestamp]"
- **Opacity**: 100% (fully visible)
- **Clickable**: ✅ Yes (allows delete & rescan)

#### Locked Questions (Sequential Lock)
- **Border**: Grey
- **Icon**: Lock 🔒
- **Status**: "Complete previous questions first"
- **Opacity**: 60% (dimmed)
- **Clickable**: ❌ No

### User Experience Flow

#### Scenario 1: Starting Fresh Assessment
```
Question 1: [1] Ready to scan ✅ Clickable
Question 2: [🔒] Locked ❌ Not clickable  
Question 3: [🔒] Locked ❌ Not clickable
```

#### Scenario 2: After Completing Question 1
```
Question 1: [✅] Completed ✅ Clickable (can delete/rescan)
Question 2: [2] Ready to scan ✅ Clickable
Question 3: [🔒] Locked ❌ Not clickable
```

#### Scenario 3: After Completing Questions 1 & 2
```
Question 1: [✅] Completed ✅ Clickable
Question 2: [✅] Completed ✅ Clickable  
Question 3: [3] Ready to scan ✅ Clickable
```

### Error Handling

#### Sequential Lock Dialog
When user tries to access a locked question:
- **Title**: "Question Locked"
- **Message**: "You must complete questions in order. Please complete Question X first before accessing Question Y."
- **Info**: "Sequential completion ensures proper assessment flow"
- **Action**: OK button to dismiss

#### Answer Exists Dialog (Unchanged)
When user tries to scan an already completed question:
- **Options**: Cancel or "Delete & Rescan"
- **Functionality**: Allows re-scanning after deletion

## Technical Implementation

### File Modified
`mobile_flutter/lib/screens/questions_screen.dart`

### Key Methods Added/Modified

#### 1. `_scanQuestionAnswer()` - Enhanced with Sequential Logic
```dart
void _scanQuestionAnswer(dynamic question) {
  // Check if answer already exists
  if (existingAnswers.containsKey(question['id'])) {
    _showAnswerExistsDialog(question);
    return;
  }
  
  // SEQUENTIAL LOGIC: Check if previous questions are completed
  final questionIndex = questions.indexWhere((q) => q['id'] == question['id']);
  if (questionIndex > 0) {
    for (int i = 0; i < questionIndex; i++) {
      final prevQuestion = questions[i];
      if (!existingAnswers.containsKey(prevQuestion['id'])) {
        _showSequentialLockDialog(questionIndex + 1, i + 1);
        return;
      }
    }
  }
  
  // Navigate to scan screen...
}
```

#### 2. `_showSequentialLockDialog()` - New Method
```dart
void _showSequentialLockDialog(int currentQuestionNumber, int requiredQuestionNumber) {
  // Shows dialog explaining sequential requirement
}
```

#### 3. Enhanced `itemBuilder` - Visual State Management
```dart
// Determine accessibility
bool isAccessible = true;
if (index > 0) {
  for (int i = 0; i < index; i++) {
    final prevQuestion = questions[i];
    if (!existingAnswers.containsKey(prevQuestion['id'])) {
      isAccessible = false;
      break;
    }
  }
}

// Apply visual styling based on state
Color cardColor = isAccessible ? typeColor : Colors.grey;
IconData cardIcon = !isAccessible ? Icons.lock : (hasAnswer ? Icons.check : Icons.radio_button_unchecked);
```

## Testing Instructions

### Test Sequential Logic
1. **Login**: azolamaphango@gmail.com / Teacher123!
2. **Navigate**: Class 4 → Ntsika Maphango → POE → Qualification → Unit Standard 1 → Summative Assessment
3. **Verify Initial State**: 
   - Question 1: Should be accessible (blue border, clickable)
   - Question 2: Should be locked (grey border, lock icon, not clickable)
   - Question 3: Should be locked (grey border, lock icon, not clickable)

### Test Sequential Progression
4. **Complete Question 1**: Scan and submit answer
5. **Verify After Q1**: 
   - Question 1: Should show green checkmark
   - Question 2: Should now be accessible (blue border, clickable)
   - Question 3: Should still be locked

6. **Try Skipping**: Attempt to click Question 3
   - Should show "Question Locked" dialog
   - Should explain need to complete Question 2 first

### Test Delete & Rescan
7. **Click Completed Question**: Tap on Question 1 (completed)
   - Should show "Answer Already Exists" dialog
   - Should offer "Delete & Rescan" option
   - After deletion, Question 2 should become locked again

## Benefits
- **Ensures Proper Flow**: Students complete assessments in logical order
- **Prevents Confusion**: Clear visual indicators of what's available
- **Maintains Assessment Integrity**: Sequential completion as intended by educators
- **User-Friendly**: Clear feedback when trying to access locked content
- **Flexible**: Allows re-scanning of completed questions if needed

## Compatibility
- ✅ Works with both Formative and Summative assessments
- ✅ Maintains existing individual question scanning functionality
- ✅ Compatible with existing answer deletion/re-scanning
- ✅ Preserves all existing POE assessment flow features