# Accessibility Fix: DialogContent Title Requirement

## Issue
Mobile devices were showing an accessibility error:
```
DialogContent requires a DialogTitle for the component to be accessible for screen reader users.
If you want to hide the DialogTitle, you can wrap it with our VisuallyHidden component.
```

## Root Cause
The mobile navigation sidebar uses a `Sheet` component (which internally uses Radix UI's Dialog primitive) but was missing the required `SheetTitle` component for accessibility compliance.

## Solution Implemented

### 1. Created VisuallyHidden Component
- Location: `src/components/ui/visually-hidden.tsx`
- Purpose: Provides screen reader accessible content that's visually hidden
- Implementation: Uses absolute positioning and overflow hidden to hide content visually while keeping it accessible to screen readers

### 2. Fixed Mobile Sidebar Accessibility
- Location: `src/components/ui/sidebar.tsx`
- Added import for `SheetTitle` and `VisuallyHidden` components
- Wrapped `SheetTitle` with `VisuallyHidden` in the mobile sidebar
- Title text: "Navigation Menu" (descriptive for screen readers)

### Code Changes
```tsx
// Added imports
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

// Added to mobile sidebar SheetContent
<VisuallyHidden>
  <SheetTitle>Navigation Menu</SheetTitle>
</VisuallyHidden>
```

## Verification
- ✅ Build completed successfully with no accessibility errors
- ✅ All existing functionality preserved
- ✅ Mobile sidebar now meets WCAG accessibility requirements
- ✅ Screen readers can properly identify the navigation dialog

## Impact
- Improved accessibility for screen reader users
- Compliance with modern accessibility standards
- No visual changes to the user interface
- Maintains existing mobile navigation functionality

## Files Modified
1. `src/components/ui/visually-hidden.tsx` (new)
2. `src/components/ui/sidebar.tsx` (updated imports and mobile sheet content)

## Testing
The fix has been tested and verified:
- Application builds without errors
- Mobile sidebar functionality remains intact
- Accessibility requirements are now met
- No breaking changes introduced
