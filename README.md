# Task Management System

Task management app with a Node.js + Express + MongoDB backend and a modern React frontend.

## Features

- Create tasks
- View all tasks
- Toggle task status between `Pending` and `Completed`
- Delete tasks
- Search tasks by title or description
- Filter tasks by status
- Live completion stats and progress indicator

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Frontend
- React
- Vite
- Custom CSS

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks` | Create a new task |
| GET | `/api/v1/tasks` | Get all tasks |
| PUT | `/api/v1/tasks/:id` | Update a task |
| DELETE | `/api/v1/tasks/:id` | Delete a task |

## Project Structure

```text
task-management-system/
|-- backend/
|   |-- controllers/
|   |-- models/
|   |-- routes/
|   |-- server.js
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- index.html
|   |-- vite.config.js
|   `-- package.json
`-- README.md
```

## How To Run Locally

### Prerequisites
- Node.js installed
- MongoDB running

### 1. Start Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5001` by default.

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Frontend API Configuration

By default, frontend requests use `/api/v1` and Vite proxies them to `http://localhost:5001` in development.

If you want to connect to a different backend URL:

1. Create `.env` inside `frontend/`
2. Add:

```bash
VITE_API_BASE_URL=https://your-backend-domain/api/v1
```

## Author

Sharansh Jha
