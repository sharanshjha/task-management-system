// Main server file for Task Management System
// REST API backend created by Sharansh Jha
// written while learning Node.js, Express and MongoDB

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// importing routes
const taskRoutes = require('./routes/taskRoutes');

// creating express app
const app = express();

// middleware to parse JSON data
app.use(express.json());

// middleware to enable CORS (so frontend can access backend)
app.use(cors());

// MongoDB Atlas connection string
// Using separate database 'taskManagementDB' on existing cluster
// This keeps it isolated from studentDB and other projects
const MONGODB_URI = 'mongodb+srv://Sharansh:password69@cluster0.clwhtys.mongodb.net/taskManagementDB?retryWrites=true&w=majority';

// connecting to MongoDB database
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
    })
    .catch((error) => {
        console.log('Error connecting to MongoDB:', error);
    });

// using task routes with /api/v1 prefix
app.use('/api/v1', taskRoutes);

// simple route to check if server is running
app.get('/', (req, res) => {
    res.json({
        message: 'Task Management REST API',
        author: 'Sharansh Jha',
        version: '1.0.0'
    });
});

// setting port number
const PORT = 5001;

// starting the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`REST API available at http://localhost:${PORT}/api/v1`);
});
