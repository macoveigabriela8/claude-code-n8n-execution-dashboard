# Collapse Icon Alternatives - Options

## Current Issues
1. Icon seems out of place (floating outside the content)
2. Too discreet (small icon, low visibility)

## Option 1: Integrated into "ROI Calculation" Heading
**Placement:** Icon + text button inline with the heading
**When expanded:** "ROI Calculation" heading with "Hide breakdown" text + chevron on the right
**When collapsed:** "ROI Calculation" heading with "Show breakdown" text + chevron on the right
**Benefits:** 
- Naturally integrated, feels part of the section
- Clear, visible text label
- Follows common UX patterns (like Notion, Linear)

**Example:**
```
ROI Calculation                    [Hide breakdown ▼]
```

## Option 2: Clickable Heading (Entire Heading is Toggle)
**Placement:** Make the entire "ROI Calculation" heading clickable with icon
**When expanded:** "ROI Calculation ▼" (heading is clickable, chevron inline)
**When collapsed:** "ROI Calculation ▶" (heading is clickable, chevron inline)
**Benefits:**
- Very intuitive - click the heading to toggle
- Icon is clearly part of the heading
- Minimal, clean design

**Example:**
```
[ROI Calculation ▼]  (entire heading is clickable)
```

## Option 3: Text Link Below Heading
**Placement:** Small text link directly below "ROI Calculation" heading
**When expanded:** "Hide breakdown" (left-aligned, subtle link styling)
**When collapsed:** "Show breakdown" (left-aligned, subtle link styling)
**Benefits:**
- Clear, visible, not too prominent
- Natural reading flow
- Common pattern in documentation sites

**Example:**
```
ROI Calculation
[Hide breakdown]
```

## Option 4: Button Integrated at Top-Right of Card
**Placement:** Button in top-right corner of the Card (inside the card border)
**When expanded:** "Hide breakdown" button with icon, positioned top-right of card content
**When collapsed:** "Show breakdown" button with icon
**Benefits:**
- More visible than floating icon
- Still accessible
- Clear call-to-action

**Example:**
```
┌─────────────────────────────────────────┐
│ ROI Calculation        [Hide breakdown] │
│                                         │
│ Content...                              │
└─────────────────────────────────────────┘
```

## Option 5: Chevron Only, But Larger & Better Positioned
**Placement:** Larger chevron icon (20px instead of 16px) integrated into heading
**When expanded:** "ROI Calculation ▼" (larger icon, better contrast)
**When collapsed:** "Show Detailed Breakdown ▼" (larger icon)
**Benefits:**
- Keeps current structure but makes it more visible
- Icon is part of the heading text

## Recommendation
**Option 1 or Option 2** are recommended based on UX best practices:
- **Option 1**: Best for clarity and discoverability (text label is very clear)
- **Option 2**: Best for minimal design and intuitive interaction (common pattern)

Both integrate the control naturally into the content hierarchy rather than floating separately.

