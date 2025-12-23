// Routes for task management REST API
// written while learning REST APIs
// by Sharansh Jha

const express = require('express');
const router = express.Router();

// importing controller functions
const {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

// defining REST API routes

// POST route to create new task
router.post('/tasks', createTask);

// GET route to fetch all tasks
router.get('/tasks', getAllTasks);

// PUT route to update a task by id
router.put('/tasks/:id', updateTask);

// DELETE route to delete a task by id
router.delete('/tasks/:id', deleteTask);

// exporting router
module.exports = router;
