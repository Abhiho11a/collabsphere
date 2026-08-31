const express = require("express");

const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getMyTasks,
} = require("../controllers/taskController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// MY TASKS
// ========================================

router.get(
  "/my",
  protect,
  getMyTasks
);


// ========================================
// PROJECT TASKS
// ========================================

router.post(
  "/:workspaceId/projects/:projectId/tasks",
  protect,
  createTask
);

router.get(
  "/:workspaceId/projects/:projectId/tasks",
  protect,
  getProjectTasks
);

router.get(
  "/:workspaceId/projects/:projectId/tasks/:taskId",
  protect,
  getTask
);

router.patch(
  "/:workspaceId/projects/:projectId/tasks/:taskId",
  protect,
  updateTask
);

router.delete(
  "/:workspaceId/projects/:projectId/tasks/:taskId",
  protect,
  deleteTask
);

module.exports = router;