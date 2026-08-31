const Task = require("../models/Task");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Activity = require("../models/Activity");

// =====================================================
// HELPER
// =====================================================

const checkProjectAccess = async (
  workspaceId,
  projectId,
  userId
) => {
  // Make sure project exists and belongs
  // to the requested workspace.
  const project = await Project.findOne({
    _id: projectId,
    workspace: workspaceId,
    isActive: true,
  });

  if (!project) {
    return {
      allowed: false,
      status: 404,
      message: "Project not found",
    };
  }

  // Check whether logged-in user is a project member.
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: "Active",
  });

  if (!membership) {
    return {
      allowed: false,
      status: 403,
      message: "You do not have access to this project",
    };
  }

  return {
    allowed: true,
    project,
    membership,
  };
};

// =====================================================
// CREATE TASK
// POST /api/workspaces/:workspaceId/projects/:projectId/tasks
// =====================================================

const createTask = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    const {
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    // -------------------------------------------------
    // PROJECT ACCESS
    // -------------------------------------------------

    const access = await checkProjectAccess(
      workspaceId,
      projectId,
      req.user._id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // -------------------------------------------------
    // CREATE TASK
    // -------------------------------------------------

    const task = await Task.create({
      workspace: workspaceId,
      project: projectId,
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      priority: priority || "Medium",
      assignee: assignee || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    await Activity.create({
      workspace: workspaceId,
      project: projectId,
      user: req.user._id,
      type: "task_created",
      message: `created task "${task.title}"`,
      targetType: "Task",
      targetId: task._id,
    });

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    const populatedTask = await Task.findById(
      task._id
    )
      .populate(
        "assignee",
        "name email avatar"
      )
      .populate(
        "createdBy",
        "name email avatar"
      );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create task",
    });
  }
};

// =====================================================
// GET PROJECT TASKS
// GET /api/workspaces/:workspaceId/projects/:projectId/tasks
// =====================================================

const getProjectTasks = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    // -------------------------------------------------
    // PROJECT ACCESS
    // -------------------------------------------------

    const access = await checkProjectAccess(
      workspaceId,
      projectId,
      req.user._id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // -------------------------------------------------
    // FETCH TASKS
    // -------------------------------------------------

    const tasks = await Task.find({
      workspace: workspaceId,
      project: projectId,
    })
      .populate(
        "assignee",
        "name email avatar"
      )
      .populate(
        "createdBy",
        "name email avatar"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get project tasks error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project tasks",
    });
  }
};

// =====================================================
// GET SINGLE TASK
// GET /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
// =====================================================

const getTask = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
      taskId,
    } = req.params;

    // -------------------------------------------------
    // PROJECT ACCESS
    // -------------------------------------------------

    const access = await checkProjectAccess(
      workspaceId,
      projectId,
      req.user._id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // -------------------------------------------------
    // FIND TASK
    // -------------------------------------------------

    const task = await Task.findOne({
      _id: taskId,
      workspace: workspaceId,
      project: projectId,
    })
      .populate(
        "assignee",
        "name email avatar"
      )
      .populate(
        "createdBy",
        "name email avatar"
      );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(
      "Get task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task",
    });
  }
};

// =====================================================
// UPDATE TASK
// PATCH /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
// =====================================================

const updateTask = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
      taskId,
    } = req.params;

    const {
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
    } = req.body;

    // -------------------------------------------------
    // PROJECT ACCESS
    // -------------------------------------------------

    const access = await checkProjectAccess(
      workspaceId,
      projectId,
      req.user._id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // -------------------------------------------------
    // FIND TASK
    // -------------------------------------------------

    const task = await Task.findOne({
      _id: taskId,
      workspace: workspaceId,
      project: projectId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // -------------------------------------------------
    // UPDATE ONLY PROVIDED FIELDS
    // -------------------------------------------------

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description =
        description.trim();
    }

    if (status !== undefined) {
      const oldStatus = task.status;

      // No status change
      if (oldStatus !== status) {

        // ========================================
        // STATUS TRANSITION VALIDATION
        // ========================================

        const isAssignee =
          task.assignee &&
          task.assignee.toString() ===
            req.user._id.toString();

        const isTaskCreator =
          task.createdBy.toString() ===
          req.user._id.toString();


        // ----------------------------------------
        // TODO → IN PROGRESS
        // ----------------------------------------

        if (
          oldStatus === "todo" &&
          status === "in-progress"
        ) {
          if (!isAssignee) {
            return res.status(403).json({
              success: false,
              message:
                "Only the assigned user can start this task",
            });
          }
        }


        // ----------------------------------------
        // IN PROGRESS → REVIEW
        // ----------------------------------------

        else if (
          oldStatus === "in-progress" &&
          status === "review"
        ) {
          if (!isAssignee) {
            return res.status(403).json({
              success: false,
              message:
                "Only the assigned user can send this task for review",
            });
          }
        }


        // ----------------------------------------
        // REVIEW → DONE
        // ----------------------------------------

        else if (
          oldStatus === "review" &&
          status === "done"
        ) {
          if (!isTaskCreator) {
            return res.status(403).json({
              success: false,
              message:
                "Only the task creator can mark this task as done",
            });
          }
        }


        // ----------------------------------------
        // INVALID TRANSITION
        // ----------------------------------------

        else {
          return res.status(400).json({
            success: false,
            message:
              `Cannot change task status from "${oldStatus}" to "${status}"`,
          });
        }


        // ========================================
        // UPDATE STATUS
        // ========================================

        task.status = status;


        // ========================================
        // ACTIVITY
        // ========================================

        await Activity.create({
          workspace: workspaceId,
          project: projectId,
          user: req.user._id,
          type: "task_status_changed",
          message:
            `changed task "${task.title}" status from "${oldStatus}" to "${status}"`,
          targetType: "Task",
          targetId: task._id,
        });
      }
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (assignee !== undefined) {
      task.assignee = assignee || null;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    await task.save();

    // -------------------------------------------------
    // POPULATE
    // -------------------------------------------------

    const updatedTask =
      await Task.findById(task._id)
        .populate(
          "assignee",
          "name email avatar"
        )
        .populate(
          "createdBy",
          "name email avatar"
        );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update task",
    });
  }
};

// =====================================================
// DELETE TASK
// DELETE /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
// =====================================================

const deleteTask = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
      taskId,
    } = req.params;

    // -------------------------------------------------
    // PROJECT ACCESS
    // -------------------------------------------------

    const access = await checkProjectAccess(
      workspaceId,
      projectId,
      req.user._id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // -------------------------------------------------
    // FIND TASK
    // -------------------------------------------------

    const task = await Task.findOne({
      _id: taskId,
      workspace: workspaceId,
      project: projectId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await Task.findByIdAndDelete(
      task._id
    );
    
    // ========================================
    // LOG ACTIVITY
    // ========================================

    await Activity.create({
      workspace: workspaceId,
      project: projectId,
      user: req.user._id,
      type: "task_deleted",
      message: `deleted task "${task.title}"`,
      targetType: "Task",
      targetId: task._id,
    });


    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete task",
    });
  }
};
// ========================================
// GET MY TASKS
// ========================================

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignee: req.user._id,
    })
      .populate("project", "name")
      .populate("workspace", "name")
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
    });

  } catch (error) {
    console.error(
      "Get my tasks error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your tasks",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getMyTasks  
};