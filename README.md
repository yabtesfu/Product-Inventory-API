# Project Inventory API

A simple REST API for managing a project inventory. Built with Node.js core modules only (`http` and `fs`) — no Express or other frameworks.

## Requirements

- Node.js (v14 or higher)

## How to run

```bash
node server.js
```

The server runs on `http://localhost:3000`.

## Data

Records are stored in `data.json`. Each project has:

- `id` — unique identifier
- `name` — project name
- `description` — short description
- `status` — e.g. `planned`, `in-progress`, `completed`
- `createdAt` — timestamp

## Endpoints (planned)

| Method | Route               | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/projects`         | Get all projects         |
| GET    | `/projects/:id`     | Get a single project     |
| POST   | `/projects`         | Create a new project     |
| PUT    | `/projects/:id`     | Update a project by ID   |
| DELETE | `/projects/:id`     | Delete a project by ID   |
