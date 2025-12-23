// Controller for handling task operations
// backend logic by Sharansh Jha
// simple implementation for understanding CRUD

const Task = require('../models/Task');

// REST API to create a new task
// using POST method as per REST principles
const createTask = async (req, res) => {
    try {
        // getting data from request body
        const { title, description } = req.body;

        // basic validation
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        // creating new task object
        const newTask = new Task({
            title: title,
            description: description,
            status: 'Pending'
        });

        // saving task to database
        const savedTask = await newTask.save();

        // sending response with 201 status code (created)
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: savedTask
        });

    } catch (error) {
        // handling errors
        res.status(500).json({
            success: false,
            message: 'Error creating task',
            error: error.message
        });
    }
};

// REST API to get all tasks
// using GET method
const getAllTasks = async (req, res) => {
    try {
        // first we get all tasks from database
        const tasks = await Task.find();

        // then we send them as JSON response
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: error.message
        });
    }
};

// REST API to update a task
// using PUT method
const updateTask = async (req, res) => {
    try {
        // getting task id from URL parameters
        const taskId = req.params.id;

        // getting updated data from request body
        const { title, description, status } = req.body;

        // finding task by id and updating it
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { title, description, status },
            { new: true }  // this returns the updated document
        );

        // if task not found
        if (!updatedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // sending success response
        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating task',
            error: error.message
        });
    }
};

// REST API to delete a task
// using DELETE method
const deleteTask = async (req, res) => {
    try {
        // getting task id from URL
        const taskId = req.params.id;

        // finding and deleting task
        const deletedTask = await Task.findByIdAndDelete(taskId);

        // checking if task exists
        if (!deletedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // sending success response
        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
            error: error.message
        });
    }
};

// exporting all controller functions
module.exports = {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask
};
