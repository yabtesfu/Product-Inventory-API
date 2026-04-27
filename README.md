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

### Validation rules

`POST` and `PUT` request bodies are validated:

- `name` — required on `POST`; if provided on `PUT`, must be a non-empty string
- `description` — optional; if provided, must be a string
- `status` — optional; if provided, must be one of `planned`, `in-progress`, `completed`

A failed validation returns HTTP `400` with an `errors` array, e.g.:

```json
{ "errors": ["name is required", "status must be one of: planned, in-progress, completed"] }
```

### Filtering on `GET /projects`

`GET /projects` supports optional query parameters:

- `status` — exact match (e.g. `planned`, `in-progress`, `completed`)
- `name` — case-insensitive substring match

Examples:

```
GET /projects?status=planned
GET /projects?name=movie
GET /projects?status=in-progress&name=tracker
```
