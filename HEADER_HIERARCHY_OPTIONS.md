# Header Hierarchy & Alignment Solutions

## Current Issues
1. Category headers (Development, Tools) look centered/stacked
2. Totals in headers are centered, feels out of place
3. Hierarchy not clear: Level 1 (Automation Cost) vs Level 2 (Development/Tools) vs Level 3 (items)
4. Need better visual representation of header levels while keeping alignment

## Option 1: Left-Aligned Headers with Right-Aligned Totals (Recommended)
**Layout:** Category name left, total right (single line, space-between)
**Visual Hierarchy:**
- Level 1 (Automation Cost): 18px, fontWeight 600
- Level 2 (Development/Tools): 14px, fontWeight 600, subtle background or border
- Level 3 (items): 14px, fontWeight 500
- Header totals: 14px, fontWeight 600, right-aligned

**Benefits:**
- Clear alignment (left for labels, right for numbers)
- Better hierarchy through font sizes
- Professional, common pattern

```
Automation Cost                              (18px, 600)

┌─────────────────────────────────────────────┐
│ Development                £6,350           │ (14px, 600, subtle bg)
├─────────────────────────────────────────────┤
│ Item 1                            £700      │ (14px, 500)
│ Item 2                            £900      │
└─────────────────────────────────────────────┘
```

## Option 2: Headers with Subtle Background + Left-Aligned Totals
**Layout:** Category name left, total right, but total is smaller/lighter
**Visual Hierarchy:**
- Level 1: 18px, 600
- Level 2: 14px, 600, with subtle background (#FAFAFA or rgba(0,0,0,0.02))
- Level 3: 14px, 500
- Header totals: 13px, 500 (smaller, lighter weight), right-aligned

**Benefits:**
- Background clearly marks it as a header
- Totals are visually de-emphasized but still accessible
- Clear separation

## Option 3: Headers with Left Border Accent
**Layout:** Category name left, total right, with colored left border
**Visual Hierarchy:**
- Level 1: 18px, 600
- Level 2: 14px, 600, with 3px left border (primary color or subtle gray)
- Level 3: 14px, 500
- Header totals: 14px, 600, right-aligned

**Benefits:**
- Border provides clear visual indicator
- Maintains clean alignment
- Modern, minimal approach

## Option 4: Remove Header Totals, Show Only in Items
**Layout:** Category name only (no totals in headers)
**Visual Hierarchy:**
- Level 1: 18px, 600
- Level 2: 14px, 600, subtle styling (background or border)
- Level 3: 14px, 500
- Total only shown at bottom of each section or in grand total

**Benefits:**
- Cleaner headers
- Focus on items, total is clear from context
- Less visual clutter

## Option 5: Smaller Category Headers with Spacing
**Layout:** Category name left, total right, but smaller and more subtle
**Visual Hierarchy:**
- Level 1: 18px, 600
- Level 2: 13px, 600, uppercase or letter-spacing, subtle
- Level 3: 14px, 500
- Header totals: 13px, 600, right-aligned
- More spacing above Level 2 headers

**Benefits:**
- Clear size hierarchy
- Headers are present but don't dominate
- Professional spacing

## Recommendation
**Option 1 or Option 3** are recommended:
- **Option 1**: Clean, professional, clear alignment (left labels, right numbers)
- **Option 3**: Adds visual indicator (border) for better hierarchy clarity

Both fix the centered alignment issue and establish clear visual hierarchy.

