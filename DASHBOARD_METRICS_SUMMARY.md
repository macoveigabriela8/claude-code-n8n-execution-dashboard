# Current Dashboard Metrics Summary

## Dashboard Overview
**Purpose**: n8n Automation ROI Dashboard for multi-client workflow execution monitoring

**Time Periods**:
- ROI Metrics: Since deployment (cumulative)
- Execution Metrics: Last 24 hours
- Recent Executions: Last 24 hours (with pagination)

---

## Section 1: ROI Summary (Hero Section - Primary View)

### Hero Metric Card
- **Net ROI** (Currency)
  - Format: Currency symbol + amount (e.g., £42.48)
  - Period: Since deployment
  - Color: Green if positive, Red if negative
  - Display: Large hero banner with prominent typography

### Secondary Metric Cards (2 cards)
1. **Hours Saved**
   - Format: Time format (e.g., "48m", "2h 30m")
   - Period: Since deployment
   - Display: Number + time unit

2. **Workflows Count**
   - Format: Integer (e.g., 3)
   - Period: Current count
   - Label: "With ROI configured"

### ROI Breakdown (Side Panel - Expandable)
- **Labor Cost Saved** (Currency)
- **Value Created** (Currency)
- **Implementation Costs** (Currency)
- **Tool Costs** (Currency)
- **Total Automation Cost** (Currency) - Sum of Implementation + Tool costs

---

## Section 2: Workflow ROI Breakdown (Card Grid)

### Per-Workflow Cards (3-column grid)
Each workflow card displays:
- **Workflow Name** (Text)
- **ROI Type Badge** (per_execution / recurring_task / new_capability)
- **Days Active** (Number - since deployment)
- **Value Created** (Currency)
- **Net ROI** (Currency) - Value minus implementation cost
- **Time Saved** (Hours format) - Only for per_execution/recurring_task types
- **Successful Executions** (Integer - since deployment)
- **Implementation Cost** (Currency)

---

## Section 3: Technical Details (Collapsible Section)

### Summary Stats Cards (4-card grid - Last 24 hours)
1. **Total Executions** (Integer)
   - Period: Last 24 hours
   - Format: Number with locale formatting (e.g., 1,234)

2. **Success Rate** (Percentage)
   - Period: Last 24 hours
   - Format: XX.X% (e.g., 99.2%)
   - Color: Green

3. **Errors** (Integer)
   - Period: Last 24 hours
   - Format: Number with locale formatting
   - Color: Red

### Workflow Statistics (Card Grid - Last 24 hours)
Per-workflow cards showing:
- **Workflow Name** (Text)
- **Health Status Indicator** (Icon: healthy/needs-attention/critical based on success rate)
- **Last Run** (Relative time - e.g., "2h ago")
- **Total Executions** (Integer - 24h)
- **Success Count** (Integer - 24h)
- **Error Count** (Integer - 24h)
- **Average Duration** (Time format - milliseconds converted)
- **Success Rate** (Percentage - 24h) with progress bar

### Recent Executions Table (Last 24 hours)
Table columns:
- **Workflow Name** (Text)
- **Status** (Badge: Success/Error with icons)
- **Started At** (Relative time - e.g., "5m ago")
- **Duration** (Time format - color-coded: green < 5s, yellow < 30s, red >= 30s)
- **Execution Link** (Icon button - opens external n8n execution URL)
- **Filters**: Status (All/Success/Error), Workflow Name (dropdown)
- **Pagination**: 20 items per page

---

## Metric Categories

### ROI Metrics (Cumulative - Since Deployment)
- Net ROI
- Hours Saved
- Labor Cost Saved
- Value Created
- Implementation Costs
- Tool Costs
- Total Automation Cost
- Workflows with ROI configured

### Performance Metrics (Last 24 Hours)
- Total Executions
- Success Count
- Error Count
- Success Rate
- Average Duration (per workflow)

### Individual Workflow Metrics (24h)
- Executions count
- Success/Error counts
- Success rate
- Average duration
- Last execution time
- Health status

### Execution History (24h)
- Individual execution records
- Status (success/error)
- Timestamp
- Duration
- Workflow association

---

## Data Visualization Types

1. **KPI Cards**: Large number displays with labels
2. **Hero Banner**: Prominent single metric (Net ROI)
3. **Card Grids**: Multiple metric cards in responsive grid
4. **Progress Bars**: Success rate visualization
5. **Tables**: Recent executions with filtering/pagination
6. **Badges**: Status indicators and ROI type labels
7. **Side Panel**: Expandable breakdown details

---

## Key Features

- **Client-Specific**: All metrics filtered by clientId
- **Multi-Currency**: Supports GBP, USD, EUR (configurable per client)
- **Color Coding**: 
  - Green: Positive values, success, healthy status
  - Red: Negative values, errors, critical status
  - Yellow: Warning/needs attention
- **Responsive Design**: Mobile, tablet, desktop breakpoints
- **Dark Theme**: Dark background with card-based layout
- **Interactive**: Filters, pagination, expandable sections, side panels

---

## Data Source Structure

### Views/Tables Used:
- `vw_client_roi_summary` - ROI aggregate data
- `vw_workflow_roi_calculated` - Per-workflow ROI
- `vw_client_summary` - 24h execution summary
- `vw_workflow_stats` - Per-workflow 24h stats
- `vw_recent_executions` - Execution history

### Key Fields:
- client_id, client_name
- workflow_id, workflow_name
- execution counts, success rates
- duration (milliseconds)
- timestamps (started_at, last_execution, deployment_date)
- currency codes
- ROI calculation fields (minutes_saved, hourly_rate, etc.)


