# Distributed Job Processing Platform

A small full-stack prototype for queueing background tasks from a modern Next.js dashboard to an Express-based API.

## Overview

This repository contains:

- a TypeScript Express API for accepting background task requests
- a Next.js + Tailwind frontend dashboard for creating and submitting tasks

## Project Structure

- `task-api/` — background task API
- `task-frontend/` — Next.js dashboard UI

## Requirements

- Node.js 18+
- npm

## Setup

### 1. Install dependencies

For the API:

```bash
cd task-api
npm install
```

For the frontend:

```bash
cd task-frontend
npm install
```

### 2. Configure ports

The API is configured to run on port `8001` and the frontend on port `3000`.

- API URL: `http://localhost:8001/api/tasks`
- Frontend URL: `http://localhost:3000`

### 3. Run Redis and the BullMQ worker

From the repo root, start Redis with Docker Compose:

```bash
docker compose up -d
```

Then start the backend API and worker together:

```bash
cd task-api
npm run dev
npm run worker
```

Alternatively you can run both backend and worker with the repo root helper:

```bash
run-all.bat
```

### 4. Run the frontend

```bash
cd task-frontend
npm run dev
```

## API Contract

The API accepts a `POST` request to `/api/tasks` with a JSON body like:

```json
{
  "type": "IMAGE_RESIZE",
  "payload": {
    "sourcePath": "/images/photo.jpg",
    "width": 1920,
    "height": 1080
  }
}
```

Supported task types:

- `IMAGE_RESIZE`
- `VIDEO_CONVERT`
- `PDF_GENERATION`
- `EMAIL_SEND`

## Frontend Features

The dashboard includes:

- a task type selector
- dynamic payload fields based on the selected task type
- submission to the background API
- success, loading, and error states

## Notes

The current API implementation is a scaffold for task submission and is ready to be extended with a real queueing layer such as BullMQ or another background worker system.

## License

ISC
