# n8n Execution Dashboard

A multi-client dashboard for monitoring n8n workflow executions using Supabase as the data source.

## Features

- Multi-client support via query parameter (`?clientId=xxx`)
- Real-time execution monitoring
- Summary statistics
- Recent executions list with filtering
- Workflow-level statistics
- Dark theme UI using shadcn/ui components

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Access the dashboard:**
   Navigate to `http://localhost:3000/dashboard?clientId=your-client-id`

## Supabase Views

The dashboard queries three Supabase views:
- `vw_client_summary` - Summary statistics per client
- `vw_recent_executions` - Recent execution records
- `vw_workflow_stats` - Workflow-level statistics

**Note:** The query functions in `lib/supabase.ts` assume column names like `client_id`, `status`, `workflow_name`, etc. If your views use different column names, you'll need to update the queries accordingly.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase JavaScript client

## Project Structure

```
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard page
│   ├── layout.tsx            # Root layout with dark theme
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── SummaryStats.tsx      # Summary statistics component
│   ├── RecentExecutions.tsx  # Recent executions list
│   ├── WorkflowStats.tsx     # Workflow statistics table
│   └── ExecutionFilters.tsx  # Filtering controls
├── lib/
│   ├── supabase.ts          # Supabase client & query functions
│   └── utils.ts             # Utility functions
└── types/
    └── supabase.ts          # TypeScript type definitions
```

