const Task = require("../models/Task");

const ALLOWED_STATUS = new Set(["Pending", "Completed"]);
const ALLOWED_PRIORITY = new Set(["Low", "Medium", "High"]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDueDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const createTask = async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    const description = (req.body.description || "").trim();
    const priority = req.body.priority || "Medium";
    const dueDate = parseDueDate(req.body.dueDate);

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (!ALLOWED_PRIORITY.has(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value",
      });
    }

    const task = await Task.create({
      title,
      description,
      status: "Pending",
      priority,
      dueDate,
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const { status, priority, search, sort = "newest" } = req.query;

    if (status && ALLOWED_STATUS.has(status)) {
      filter.status = status;
    }

    if (priority && ALLOWED_PRIORITY.has(priority)) {
      filter.priority = priority;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 100);
    const skip = (page - 1) * limit;

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      dueSoon: { dueDate: 1, createdAt: -1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;
    const totalPromise = Task.countDocuments(filter);
    const tasksPromise =
      sort === "priority"
        ? Task.aggregate([
            { $match: filter },
            {
              $addFields: {
                priorityRank: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$priority", "High"] }, then: 3 },
                      { case: { $eq: ["$priority", "Medium"] }, then: 2 },
                    ],
                    default: 1,
                  },
                },
              },
            },
            { $sort: { priorityRank: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { priorityRank: 0 } },
          ])
        : Task.find(filter).sort(sortBy).skip(skip).limit(limit);

    const [tasks, total] = await Promise.all([tasksPromise, totalPromise]);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (typeof req.body.title === "string") {
      task.title = req.body.title.trim();
    }

    if (typeof req.body.description === "string") {
      task.description = req.body.description.trim();
    }

    if (typeof req.body.status === "string") {
      if (!ALLOWED_STATUS.has(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }
      task.status = req.body.status;
    }

    if (typeof req.body.priority === "string") {
      if (!ALLOWED_PRIORITY.has(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority value",
        });
      }
      task.priority = req.body.priority;
    }

    if (req.body.dueDate !== undefined) {
      task.dueDate = parseDueDate(req.body.dueDate);
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
};
