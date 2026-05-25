# Manual Fix for Logistics Read-Only Learner View

The file `frontend/src/components/SDPManagerDashboard.tsx` needs these 3 simple changes:

## Change 1: Update Button Text (Line ~6100)
Find this line:
```tsx
<button type="button" className="btn btn-secondary" onClick={() => setShowLearnerModal(false)}>
  Cancel
</button>
```

Replace with:
```tsx
<button type="button" className="btn btn-secondary" onClick={() => setShowLearnerModal(false)}>
  {user?.role === 'SDPLogistics' ? 'Close' : 'Cancel'}
</button>
```

## Change 2: Hide Update Learner Button (Line ~6102-6112)
Find this button:
```tsx
<button type="submit" className="btn btn-primary" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
      Updating...
    </>
  ) : (
    '💾 Update Learner'
  )}
</button>
```

Wrap it in a conditional:
```tsx
{user?.role !== 'SDPLogistics' && (
  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
    {isSubmitting ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Updating...
      </>
    ) : (
      '💾 Update Learner'
    )}
  </button>
)}
```

## Change 3: Hide Upload Document Section (Line ~6118-6170)
Find this entire section:
```tsx
<div className="mb-4">
  <h6 className="text-primary mb-3">📄 Upload Document</h6>
  <form onSubmit={handleUploadDocument}>
    ... (all the form content) ...
  </form>
</div>
```

Wrap it in a conditional:
```tsx
{user?.role !== 'SDPLogistics' && (
  <div className="mb-4">
    <h6 className="text-primary mb-3">📄 Upload Document</h6>
    <form onSubmit={handleUploadDocument}>
      ... (all the form content) ...
    </form>
  </div>
)}
```

## Result
- Logistics users will see "Close" instead of "Cancel"
- "Update Learner" button will be hidden for Logistics
- "Upload Document" section will be completely hidden for Logistics
- They can still view all learner information and documents (read-only)
