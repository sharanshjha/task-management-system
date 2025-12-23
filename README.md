# Task Management System (REST API Based)

This project is created by **Sharansh Jha** to practice REST APIs, backend logic, and CRUD operations.

## About

A simple task management system built with Node.js, Express, and MongoDB. This project focuses on learning REST API development and understanding backend concepts like routing, controllers, and database operations.

## Features

- Create new tasks
- View all tasks
- Update task status (Pending/Completed)
- Delete tasks
- Simple and clean UI using Tailwind CSS
- RESTful API design

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Frontend
- HTML
- Tailwind CSS (CDN)
- Vanilla JavaScript (Fetch API)

### Tools
- Postman (for API testing)

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks` | Create a new task |
| GET | `/api/v1/tasks` | Get all tasks |
| PUT | `/api/v1/tasks/:id` | Update a task |
| DELETE | `/api/v1/tasks/:id` | Delete a task |

## Project Structure

```
task-management-system/
│
├── backend/
│   ├── models/
│   │   └── Task.js
│   ├── routes/
│   │   └── taskRoutes.js
│   ├── controllers/
│   │   └── taskController.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── index.html
│   └── tasks.html
│
└── README.md
```

## How to Run Locally

### Prerequisites
- Node.js installed
- MongoDB installed and running

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
npm start
```

The server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Open `index.html` in your browser

Or you can use Live Server extension in VS Code to run the frontend.

## API Testing with Postman

You can test the REST APIs using Postman:

### Create Task (POST)
- URL: `http://localhost:5000/api/v1/tasks`
- Method: POST
- Body (JSON):
```json
{
  "title": "Complete assignment",
  "description": "Finish the backend project"
}
```

### Get All Tasks (GET)
- URL: `http://localhost:5000/api/v1/tasks`
- Method: GET

### Update Task (PUT)
- URL: `http://localhost:5000/api/v1/tasks/:id`
- Method: PUT
- Body (JSON):
```json
{
  "status": "Completed"
}
```

### Delete Task (DELETE)
- URL: `http://localhost:5000/api/v1/tasks/:id`
- Method: DELETE

## Learning Outcomes

Through this project, I learned:
- How to build REST APIs using Express.js
- CRUD operations with MongoDB
- Routing and controllers in backend
- Using Mongoose for database operations
- Connecting frontend with backend using Fetch API
- HTTP methods (GET, POST, PUT, DELETE)
- HTTP status codes (200, 201, 400, 404, 500)

## Author

**Sharansh Jha**

Created as a learning project for understanding REST APIs and backend development.

## License

This project is open source and available for learning purposes.
