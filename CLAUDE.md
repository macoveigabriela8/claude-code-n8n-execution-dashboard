# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n execution dashboard - a web application for monitoring and managing n8n workflow executions. The project is currently in initial setup phase.

## Architecture

When this project is initialized, it will likely follow this structure:

### Frontend
- React-based dashboard for visualizing n8n workflow executions
- Real-time updates for execution status
- Filtering and searching capabilities for executions
- Execution detail views with logs and error information

### Backend/API Integration
- Integration with n8n's REST API to fetch execution data
- Possible endpoints: `/executions`, `/workflows`, `/execution/:id`
- Authentication handling for n8n API access

### Data Flow
- Poll or webhook-based updates from n8n instance
- Local state management for dashboard filtering/sorting
- Potential caching layer for performance

## Development Setup

This project needs to be initialized. Common setup patterns for n8n dashboards:

### If using React/Vite:
```bash
npm install
npm run dev
```

### If using Next.js:
```bash
npm install
npm run dev
```

### Environment Configuration
Will likely require:
- `N8N_API_URL` - URL to n8n instance API
- `N8N_API_KEY` - Authentication key for n8n API

## Key Considerations

### n8n API Integration
- n8n API typically available at `https://your-n8n-instance.com/api/v1/`
- Requires API key authentication via header: `X-N8N-API-KEY`
- Main endpoints: `/executions`, `/workflows`, `/executions/:id`

### Execution Data Structure
n8n executions include:
- `id`: Execution identifier
- `workflowId`: Associated workflow
- `status`: running, success, error, waiting
- `startedAt`, `stoppedAt`: Timestamps
- `data`: Execution results and node data
- `mode`: manual, trigger, webhook, etc.

### Real-time Updates
Consider implementing:
- Polling interval (5-30 seconds typical)
- WebSocket connection if n8n instance supports it
- Auto-refresh toggle for user control
