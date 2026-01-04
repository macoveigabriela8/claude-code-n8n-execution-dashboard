# Color Audit - Dashboard Colors vs Palette

This document shows which colors are currently used in the dashboard and whether they come from the Mokkup.ai palette or are custom/fallback colors.

## Colors FROM the Palette ✅

| Color | Hex | RGB | Location | Palette Source |
|-------|-----|-----|----------|----------------|
| Header Background | `#0D076A` | `rgb(13, 7, 106)` | `app/dashboard/page.tsx` | Main Primary - Title |
| Primary Text | `#0D076A` | `rgb(13, 7, 106)` | Multiple components | Main Primary - Title |
| KPI Green Accent | `#93BF35` | `rgb(147, 191, 53)` | `components/KPICards.tsx` | Default - Green |
| KPI Red Accent | `#DD7070` | `rgb(221, 112, 112)` | `components/KPICards.tsx` | Default - Red |
| Treemap Color 1 | `#342BC2` | `rgb(52, 43, 194)` | `components/WorkflowROIContribution.tsx` | Main Primary - Color 1 |
| Treemap Color 2 | `#6F67F1` | `rgb(111, 103, 241)` | `components/WorkflowROIContribution.tsx` | Main Primary - Color 2 |
| Treemap Color 3 | `#9993FF` | `rgb(153, 147, 255)` | `components/WorkflowROIContribution.tsx` | Main Primary - Color 3 |
| Treemap Color 4 | `#417ED9` | `rgb(65, 126, 217)` | `components/WorkflowROIContribution.tsx` | Main Primary - Color 4 |
| Treemap Color 5 | `#2565C3` | `rgb(37, 101, 195)` | `components/WorkflowROIContribution.tsx` | Main Secondary - Color 5 |
| Treemap Color 6 | `#1897BF` | `rgb(24, 151, 191)` | `components/WorkflowROIContribution.tsx` | Main Secondary - Color 6 |
| White Background | `#FFFFFF` | `rgb(255, 255, 255)` | Multiple components | Standard white |

## Colors NOT in the Palette ❌

### Dashboard-Specific Colors (Should be added to palette)

| Color | Hex | RGB | Location | Usage | Recommendation |
|-------|-----|-----|----------|-------|----------------|
| Chart Title Blue | `#007db7` | `rgb(0, 125, 183)` | `components/SuccessRateGauge.tsx`, `ExecutionTrendChart.tsx`, `ExecutionHistoryTable.tsx` | Chart section titles | **Add to palette** |
| Light Border | `#EEEEEE` | `rgb(238, 238, 238)` | `components/KPICards.tsx`, `components/ui/card.tsx` | Card borders, table borders | **Already in DashboardColors.borders.light** ✅ |
| Lighter Border | `#E8E8E8` | `rgb(232, 232, 232)` | Multiple components | Subtle borders, dividers | **Already in DashboardColors.borders.lighter** ✅ |

### Chart-Specific Colors (ExecutionTrendChart.tsx)

| Color | Hex | RGB | Location | Usage | Recommendation |
|-------|-----|-----|----------|-------|----------------|
| Grid Stroke | `#374151` | `rgb(55, 65, 81)` | `ExecutionTrendChart.tsx` | Chart grid lines | Consider using Gray 1 from palette: `#5E5E5E` |
| Axis Stroke | `#9ca3af` | `rgb(156, 160, 169)` | `ExecutionTrendChart.tsx` | Chart axes | Consider using Gray 2 from palette: `#9CA0A9` (close match!) |
| Tooltip Background | `#1f2937` | `rgb(31, 41, 55)` | `ExecutionTrendChart.tsx` | Chart tooltip | Consider using palette color or white |
| Tooltip Text | `#fff` | `rgb(255, 255, 255)` | `ExecutionTrendChart.tsx` | Chart tooltip text | Standard white ✅ |
| Successful Line | `#2563eb` | `rgb(37, 99, 235)` | `ExecutionTrendChart.tsx` | Successful executions line | Consider using from palette |
| Failed Line | `#9333ea` | `rgb(147, 51, 234)` | `ExecutionTrendChart.tsx` | Failed executions line | Consider using from palette |

### SuccessRateGauge Colors

| Color | Hex | RGB | Location | Usage | Recommendation |
|-------|-----|-----|----------|-------|----------------|
| Remaining Fill | `#e5e7eb` | `rgb(229, 231, 235)` | `SuccessRateGauge.tsx` | Gauge remaining area | Consider using Gray 2 or border color |

### Fallback Colors

| Color | Hex | RGB | Location | Usage | Recommendation |
|-------|-----|-----|----------|-------|----------------|
| Treemap Fallback | `#8884d8` | `rgb(136, 132, 216)` | `WorkflowROIContribution.tsx` | Treemap fallback fill | Use palette color |
| Treemap Fallback | `#ccc` | N/A | `WorkflowROIContribution.tsx` | Color fallback | Use palette color |

### Tailwind Utility Classes (Not from palette)

These use Tailwind's default color palette, not the Mokkup.ai palette:

| Class | Actual Color | Location | Usage | Recommendation |
|-------|--------------|----------|-------|----------------|
| `text-green-500` | `#22c55e` | `SuccessRateGauge.tsx` | Success rate text | Use palette Green: `#93BF35` |
| `text-yellow-500` | `#eab308` | `SuccessRateGauge.tsx` | Warning rate text | Use palette Yellow: `#FABD63` |
| `text-red-500` | `#ef4444` | `SuccessRateGauge.tsx` | Error rate text | Use palette Red: `#DD7070` |
| `text-green-600` | `#16a34a` | Multiple components | Success indicators | Use palette Green: `#93BF35` |
| `text-red-600` | `#dc2626` | `KPICards.tsx` | Error text | Use palette Red: `#DD7070` |
| `text-blue-600` | `#2563eb` | `WorkflowROIBreakdown.tsx` | Info icons | Use from palette |
| `bg-green-500` | `#22c55e` | `WorkflowStats.tsx` | Success rate bars | Use palette Green: `#93BF35` |
| `bg-yellow-500` | `#eab308` | `WorkflowStats.tsx` | Warning rate bars | Use palette Yellow: `#FABD63` |
| `bg-red-500` | `#ef4444` | `WorkflowStats.tsx` | Error rate bars | Use palette Red: `#DD7070` |
| `bg-emerald-500/20` | `rgba(16, 185, 129, 0.2)` | `StatusBadge.tsx` | Success badge background | Use palette Green with opacity |
| `text-emerald-400` | `#34d399` | `StatusBadge.tsx` | Success badge text | Use palette Green: `#93BF35` |
| `bg-red-500/20` | `rgba(239, 68, 68, 0.2)` | `StatusBadge.tsx` | Error badge background | Use palette Red with opacity |
| `text-red-400` | `#f87171` | `StatusBadge.tsx` | Error badge text | Use palette Red: `#DD7070` |
| `bg-green-600` | `#16a34a` | `Badge.tsx` | Success badge | Use palette Green: `#93BF35` |
| `hover:bg-green-700` | `#15803d` | `Badge.tsx` | Success badge hover | Use palette Green darker variant |

## Summary

### ✅ Using Palette Colors:
- Header background and primary text
- KPI accent colors (green and red)
- All treemap colors
- White background

### ❌ NOT Using Palette Colors:
1. **Chart Title Blue** (`#007db7`) - Used in 3 components, should be in palette
2. **Border colors** (`#EEEEEE`, `#E8E8E8`) - Already stored in design-tokens but hardcoded
3. **Chart colors** (ExecutionTrendChart) - Using generic Tailwind/dark theme colors
4. **Status colors** - Using Tailwind defaults instead of palette colors
5. **Success rate gauge colors** - Using Tailwind defaults
6. **Fallback colors** - Generic grays and purples

## Recommendations

1. **Add missing dashboard colors to palette**:
   - Chart title blue (`#007db7`)
   - Chart grid/axis colors (or use existing Gray 1/Gray 2)

2. **Replace Tailwind utility classes** with palette colors:
   - Replace `text-green-500/600` with palette Green (`#93BF35`)
   - Replace `text-yellow-500` with palette Yellow (`#FABD63`)
   - Replace `text-red-500/600` with palette Red (`#DD7070`)
   - Replace chart line colors with palette colors

3. **Update components to use design-tokens.ts**:
   - Import colors from `lib/design-tokens.ts` instead of hardcoding
   - Use consistent colors across all components

## Files That Need Updates

1. `components/SuccessRateGauge.tsx` - Replace Tailwind color classes
2. `components/ExecutionTrendChart.tsx` - Replace chart colors with palette colors
3. `components/ui/status-badge.tsx` - Use palette colors
4. `components/ui/badge.tsx` - Use palette colors for success variant
5. `components/WorkflowStats.tsx` - Replace Tailwind color classes
6. `components/WorkflowROIContribution.tsx` - Replace fallback colors


