# Design Tokens - Mokkup.ai Theme Colors

This document contains all color values from the Mokkup.ai design system and currently used dashboard colors for reference.

**Location**: All colors are stored in `lib/design-tokens.ts` for programmatic use.

---

## Quick Reference

### Most Used Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Header Background | `#0D076A` | `rgb(13, 7, 106)` | Dashboard header |
| Primary Text | `#0D076A` | `rgb(13, 7, 106)` | Main text color |
| KPI Green | `#93BF35` | `rgb(147, 191, 53)` | Positive metrics accent |
| KPI Red | `#DD7070` | `rgb(221, 112, 112)` | Negative metrics accent |
| Chart Titles | `#007db7` | `rgb(0, 125, 183)` | Chart section titles |
| Light Border | `#EEEEEE` | `rgb(238, 238, 238)` | Card/table borders |
| Background | `#FFFFFF` | `rgb(255, 255, 255)` | Page background |

---

## Main Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Title | `#0D076A` | `rgb(13, 7, 106)` | Main title, header background |
| Color 1 | `#342BC2` | `rgb(52, 43, 194)` | Primary accent |
| Color 2 | `#6F67F1` | `rgb(111, 103, 241)` | Primary variant |
| Color 3 | `#9993FF` | `rgb(153, 147, 255)` | Primary light variant |
| Color 4 | `#417ED9` | `rgb(65, 126, 217)` | Primary blue variant |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Color 5 | `#2565C3` | `rgb(37, 101, 195)` | Secondary blue |
| Color 6 | `#1897BF` | `rgb(24, 151, 191)` | Secondary teal |
| Color 7 | `#2DB7E2` | `rgb(45, 183, 226)` | Secondary cyan |
| Color 8 | `#7CDBF9` | `rgb(124, 219, 249)` | Secondary light blue |
| Color 9 | `#D0ACED` | `rgb(208, 172, 237)` | Secondary lavender |

### Tertiary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Color 10 | `#AB81CD` | `rgb(171, 129, 205)` | Tertiary purple |
| Color 11 | `#654597` | `rgb(101, 69, 151)` | Tertiary dark purple |
| Color 12 | `#7BEEE9` | `rgb(123, 238, 233)` | Tertiary aqua |
| Color 13 | `#57DAD4` | `rgb(87, 218, 212)` | Tertiary teal |
| Color 14 | `#22BDB6` | `rgb(34, 189, 182)` | Tertiary dark teal |

### Default Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Black | `#000000` | `rgb(0, 0, 0)` | Pure black |
| Gray 1 | `#5E5E5E` | `rgb(94, 94, 94)` | Dark gray |
| Gray 2 | `#9CA0A9` | `rgb(156, 160, 169)` | Medium gray |
| Green | `#93BF35` | `rgb(147, 191, 53)` | Success/accent green (KPI) |
| Yellow | `#FABD63` | `rgb(250, 189, 99)` | Warning/accent yellow |
| Red | `#DD7070` | `rgb(221, 112, 112)` | Error/accent red (KPI) |

---

## Contrast Palette

*Used for combo charts*

### Contrast Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Color 1 | `#227B77` | `rgb(34, 123, 119)` | Dark teal |
| Color 2 | `#44B0AB` | `rgb(68, 176, 171)` | Medium teal |
| Color 3 | `#87DFDB` | `rgb(135, 223, 219)` | Light cyan |
| Color 4 | `#FFD79C` | `rgb(255, 215, 156)` | Light orange |
| Color 5 | `#FABD63` | `rgb(250, 189, 99)` | Orange (same as Default Yellow) |

### Contrast Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Color 6 | `#EDA436` | `rgb(237, 164, 54)` | Orange-brown |
| Color 7 | `#6FA9F2` | `rgb(111, 169, 242)` | Light blue |
| Color 8 | `#3F86E0` | `rgb(63, 134, 224)` | Medium blue |
| Color 9 | `#0E5CC0` | `rgb(14, 92, 192)` | Dark blue |
| Color 10 | `#2C7DA0` | `rgb(44, 125, 160)` | Blue-green |

### Contrast Tertiary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Color 11 | `#61A5C2` | `rgb(97, 165, 194)` | Muted blue-green |
| Color 12 | `#A9D6E5` | `rgb(169, 214, 229)` | Very light blue |
| Color 13 | `#F4A2A2` | `rgb(244, 162, 162)` | Light pink |
| Color 14 | `#DA6356` | `rgb(218, 99, 86)` | Reddish-orange |
| Color 15 | `#B51706` | `rgb(181, 23, 6)` | Dark red |

---

## Dashboard Colors (Currently in Use)

### Header

- **Background**: `#0D076A` / `rgb(13, 7, 106)` - Dashboard header background
- **Text**: `#FFFFFF` / `rgb(255, 255, 255)` - Header text (white)

### Text

- **Primary**: `#0D076A` / `rgb(13, 7, 106)` - Main text color throughout dashboard

### Borders

- **Light**: `#EEEEEE` / `rgb(238, 238, 238)` - Card borders, table borders
- **Lighter**: `#E8E8E8` / `rgb(232, 232, 232)` - Subtle borders, dividers

### KPI Cards

- **Accent Green**: `#93BF35` / `rgb(147, 191, 53)` - Positive metrics bottom accent line
  - Used in: Net ROI, Hours Saved, Workflows Count, Labor Cost Saved, Value Created
- **Accent Red**: `#DD7070` / `rgb(221, 112, 112)` - Negative metrics bottom accent line
  - Used in: Total Automation Cost

### Charts

- **Chart Titles**: `#007db7` / `rgb(0, 125, 183)` - Chart section titles
  - Used in: Success Rate Gauge, Execution Trend Chart, Execution History Table

### Backgrounds

- **White**: `#FFFFFF` / `rgb(255, 255, 255)` - Page and card backgrounds

---

## Treemap Colors

Currently used in `WorkflowROIContribution` component:

1. `#342BC2` / `rgb(52, 43, 194)` - Dark purple/blue
2. `#6F67F1` / `rgb(111, 103, 241)` - Purple
3. `#9993FF` / `rgb(153, 147, 255)` - Light purple
4. `#417ED9` / `rgb(65, 126, 217)` - Blue
5. `#2565C3` / `rgb(37, 101, 195)` - Darker blue
6. `#1897BF` / `rgb(24, 151, 191)` - Teal/cyan

---

## Usage in Code

### Import Colors

```typescript
import { Colors, TreemapColors } from '@/lib/design-tokens'

// Access specific colors
const headerBg = Colors.dashboard.header.background.rgb
const kpiGreen = Colors.dashboard.kpi.accentGreen.hex

// Use treemap colors array
TreemapColors.forEach((color, index) => {
  // color.hex or color.rgb
})
```

### Inline Styles

```typescript
// Using RGB (recommended for inline styles)
<div style={{ backgroundColor: Colors.dashboard.header.background.rgb }}>

// Using hex
<div style={{ backgroundColor: Colors.dashboard.header.background.hex }}>
```

### Quick Access Arrays

```typescript
import { PrimaryColors, SecondaryColors, TertiaryColors } from '@/lib/design-tokens'

// Use in charts or color pickers
PrimaryColors.map(color => color.hex)
```

---

## Where Colors Are Currently Used

### Components

- **`app/dashboard/page.tsx`**: Header background (`#0D076A`)
- **`components/KPICards.tsx`**: 
  - Text color (`#0D076A`)
  - Border color (`#EEEEEE`)
  - Accent lines (`#93BF35`, `#DD7070`)
- **`components/WorkflowROIContribution.tsx`**:
  - Treemap colors (6 colors)
  - Title color (`#0D076A`)
  - Button borders (`#E8E8E8`)
- **`components/SuccessRateGauge.tsx`**: Chart title (`#007db7`)
- **`components/ExecutionTrendChart.tsx`**: Chart title (`#007db7`)
- **`components/ExecutionHistoryTable.tsx`**: 
  - Chart title (`#007db7`)
  - Text colors (`#0D076A`)
  - Border colors (`#E8E8E8`)

---

## Updating Colors

To update colors in the future:

1. **Update `lib/design-tokens.ts`**: Modify the color values in the appropriate palette section
2. **Update this documentation**: Keep `DESIGN_TOKENS.md` in sync with code changes
3. **Update components**: If colors are hardcoded, update them to import from `design-tokens.ts`

### Recommended: Use Design Tokens

Instead of hardcoding colors in components, import from `lib/design-tokens.ts`:

```typescript
// Before (hardcoded)
<div style={{ backgroundColor: 'rgb(13, 7, 106)' }}>

// After (using design tokens)
import { Colors } from '@/lib/design-tokens'
<div style={{ backgroundColor: Colors.dashboard.header.background.rgb }}>
```

---

## Color Conversion

The `design-tokens.ts` file includes a `hexToRgb()` helper function to convert hex codes to RGB strings automatically. All colors are stored with both hex and RGB formats for flexibility.

---

**Last Updated**: Based on Mokkup.ai design specification
**File Location**: `lib/design-tokens.ts`

