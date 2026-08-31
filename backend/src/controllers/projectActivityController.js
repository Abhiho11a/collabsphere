const mongoose = require("mongoose");

const Activity = require("../models/Activity");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const WorkspaceMember = require("../models/WorkspaceMember");


// =====================================================
// GET PROJECT ACTIVITY
// GET /api/workspaces/:workspaceId/projects/:projectId/activity
// =====================================================

const getProjectActivity = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;

    // -----------------------------------------
    // VALIDATE IDS
    // -----------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // -----------------------------------------
    // CHECK WORKSPACE ACCESS
    // -----------------------------------------

    const workspaceMember =
      await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "Active",
      });

    if (!workspaceMember) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this workspace",
      });
    }

    // -----------------------------------------
    // CHECK PROJECT
    // -----------------------------------------

    const project =
      await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
        isActive: true,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // -----------------------------------------
    // CHECK PROJECT ACCESS
    // -----------------------------------------

    const projectMember =
      await ProjectMember.findOne({
        project: projectId,
        user: req.user._id,
        status: "Active",
      });

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this project",
      });
    }

    // -----------------------------------------
    // GET ACTIVITIES
    // -----------------------------------------

    const activities =
      await Activity.find({
        workspace: workspaceId,
        project: projectId,
      })
        .populate(
          "user",
          "name email avatar"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });

  } catch (error) {
    console.error(
      "Get project activity error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch project activity",
    });
  }
};


module.exports = {
  getProjectActivity,
};