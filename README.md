# TaskFlow Pro - Secure Task Management Platform

A production-style full stack task management platform built with React, Node.js, Express, and MongoDB.

This project was upgraded from a basic CRUD app into a secure, account-based product where each user has a private workspace.

## Why This Project Is Resume-Ready

- Implemented end-to-end JWT authentication with protected API routes.
- Enforced user-level data isolation so users only access their own tasks.
- Added priority management, due dates, server-side filtering, sorting, and pagination.
- Built a polished responsive frontend with account flows, session persistence, and real-time dashboard stats.
- Hardened backend with security middleware (`helmet`, rate limiting), structured error responses, and environment-based configuration.
- Documented local development and production deployment for Netlify + Render workflows.

## Core Features

### Authentication and Access Control
- User registration and login
- Password hashing with `bcryptjs`
- JWT-based stateless auth
- Persistent login session in frontend
- `GET /auth/me` profile endpoint

### Task Management
- Create, list, update, and delete tasks
- Fields: title, description, status, priority, due date
- Task status workflow: `Pending` <-> `Completed`
- Task privacy per authenticated user

### Product Experience
- Dedicated signup/login experience
- Search by title/description
- Filter by status and priority
- Sort by newest, oldest, due soon, or priority
- Pagination controls
- Completion metrics, high-priority count, overdue count

## Tech Stack

### Frontend
- React 18
- Vite
- Custom CSS (responsive + animated UI)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Security middleware (`helmet`, `express-rate-limit`)
- Logging (`morgan`)

### Deployment
- Netlify (frontend)
- Render or any Node host (backend)
- MongoDB Atlas (database)

## Project Structure

```text
task-management-system/
|-- backend/
|   |-- controllers/
|   |   |-- authController.js
|   |   `-- taskController.js
|   |-- middlewares/
|   |   `-- authMiddleware.js
|   |-- models/
|   |   |-- Task.js
|   |   `-- User.js
|   |-- routes/
|   |   |-- authRoutes.js
|   |   `-- taskRoutes.js
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.js
|-- netlify.toml
`-- README.md
```

## API Overview

Base URL: `/api/v1`

### Auth Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user profile (protected) |

### Task Routes (Protected)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create task |
| GET | `/tasks` | List tasks (supports filtering, sorting, pagination) |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |

### Query Params for `GET /tasks`

- `status=Pending|Completed`
- `priority=Low|Medium|High`
- `search=<text>`
- `sort=newest|oldest|dueSoon|priority`
- `page=<number>`
- `limit=<number>`

## Local Development

## 1) Backend Setup

```bash
cd backend
npm install
copy .env.example .env
```

Fill `backend/.env`:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Run backend:

```bash
npm run dev
```

## 2) Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
```

Set frontend API URL (local backend):

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

Run frontend:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Deployment Guide

### Backend (Render example)
1. Deploy `backend/` as a Node web service.
2. Add environment variables from `backend/.env.example`.
3. Set `CLIENT_URL` to your Netlify domain.

### Frontend (Netlify)
This repository already includes `netlify.toml`:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

Optional environment variable:

```env
VITE_API_BASE_URL=https://your-backend-domain/api/v1
```

## Security Notes

- Passwords are never stored in plain text.
- Task routes require a valid Bearer token.
- API enforces account-level data scoping.
- Security middleware enabled: `helmet`, CORS checks, request rate limiting.

## Future Scope

- Refresh tokens and secure cookie auth option
- Team workspaces and shared boards
- Activity audit logs
- Unit/integration tests with CI pipeline

## Author

Sharansh Jha
