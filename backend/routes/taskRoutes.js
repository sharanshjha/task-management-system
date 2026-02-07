const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

router.use(protect);

router.route("/tasks").post(createTask).get(getAllTasks);
router.route("/tasks/:id").put(updateTask).delete(deleteTask);

module.exports = router;
