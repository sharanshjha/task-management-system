// Task model using Mongoose
// written while learning REST APIs and MongoDB
// created by Sharansh Jha

const mongoose = require('mongoose');

// defining schema for task
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    }
}, {
    timestamps: true  // this will add createdAt and updatedAt fields
});

// creating model from schema
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
