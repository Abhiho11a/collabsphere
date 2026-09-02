const cloudinary = require("../config/cloudinary");

const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const File = require("../models/File");
const Activity = require("../models/Activity");
const Workspace = require("../models/Workspace");


// ========================================
// CHECK PROJECT ACCESS
// ========================================

const checkProjectAccess = async (
  projectId,
  workspaceId,
  userId
) => {
  const project = await Project.findOne({
    _id: projectId,
    workspace: workspaceId,
    isActive: true,
  });

  if (!project) {
    return {
      project: null,
      member: null,
    };
  }

  const member = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: "Active",
  });

  return {
    project,
    member,
  };
};


// ========================================
// UPLOAD PROJECT FILE
// ========================================

const uploadProjectFile = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;


    // ------------------------------------
    // VALIDATE FILE
    // ------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file",
      });
    }


    // ------------------------------------
    // CHECK PROJECT + MEMBERSHIP
    // ------------------------------------

    const {
      project,
      member,
    } = await checkProjectAccess(
      projectId,
      workspaceId,
      req.user._id
    );


    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }


    if (!member) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this project",
      });
    }

    const workspace =
      await Workspace.findById(
        workspaceId
      ).select("organization");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }


    


    // ------------------------------------
    // UPLOAD TO CLOUDINARY
    // ------------------------------------

    const uploadResult =
      await new Promise(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  `collabsphere/projects/${projectId}`,

                resource_type: "auto",

                use_filename: true,

                unique_filename: true,
              },

              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );


          stream.end(req.file.buffer);
        }
      );
      

    // ------------------------------------
    // SAVE FILE METADATA
    // ------------------------------------

    const projectFile =
      await File.create({
        organization:
          workspace.organization,

        project:
          projectId,

        workspace:
          workspaceId,

        uploadedBy:
          req.user._id,

        originalName:
          req.file.originalname,

        fileUrl:
          uploadResult.secure_url,

        publicId:
          uploadResult.public_id,

        resourceType:
          uploadResult.resource_type,

        mimeType:
          req.file.mimetype,

        size:
          req.file.size,
      });

    // ------------------------------------
    // GET POPULATED FILE
    // ------------------------------------

    const populatedFile =
      await File.findById(
        projectFile._id
      )
        .populate(
          "uploadedBy",
          "name email avatar"
        )
        .populate(
          "project",
          "name"
        )
        .populate(
          "workspace",
          "name"
        );

    await Activity.create({
      type: "file_uploaded",

      project: projectId,

      workspace: workspaceId,

      user: req.user._id,

      message: `uploaded file "${projectFile.originalName}"`,

      metadata: {
        fileId: projectFile._id,
        fileName: projectFile.originalName,
      },
    });


    // ------------------------------------
    // RESPONSE
    // ------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "File uploaded successfully",

      file: populatedFile,
    });

  } catch (error) {
    console.error(
      "Upload project file error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to upload project file",
    });
  }
};


// ========================================
// GET PROJECT FILES
// ========================================

const getProjectFiles = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
    } = req.params;


    // ------------------------------------
    // CHECK PROJECT + MEMBERSHIP
    // ------------------------------------

    const {
      project,
      member,
    } = await checkProjectAccess(
      projectId,
      workspaceId,
      req.user._id
    );


    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }


    if (!member) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this project",
      });
    }


    // ------------------------------------
    // FETCH PROJECT FILES
    // ------------------------------------

    const files =
      await File.find({
        project: projectId,

        workspace: workspaceId,
      })
        .populate(
          "uploadedBy",
          "name email avatar"
        )
        .populate(
          "project",
          "name"
        )
        .populate(
          "workspace",
          "name"
        )
        .sort({
          createdAt: -1,
        });


    // ------------------------------------
    // RESPONSE
    // ------------------------------------

    return res.json({
      success: true,

      count: files.length,

      files,
    });

  } catch (error) {
    console.error(
      "Get project files error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch project files",
    });
  }
};


// ========================================
// DELETE PROJECT FILE
// ========================================

const deleteProjectFile = async (req, res) => {
  try {
    const {
      workspaceId,
      projectId,
      fileId,
    } = req.params;


    // ------------------------------------
    // CHECK PROJECT + MEMBERSHIP FIRST
    // ------------------------------------

    const {
      project,
      member,
    } = await checkProjectAccess(
      projectId,
      workspaceId,
      req.user._id
    );


    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }


    if (!member) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this project",
      });
    }


    // ------------------------------------
    // FIND FILE
    // ------------------------------------

    const file =
      await File.findOne({
        _id: fileId,

        project: projectId,

        workspace: workspaceId,
      });


    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }


    // ------------------------------------
    // DELETE FROM CLOUDINARY
    // ------------------------------------

    await cloudinary.uploader.destroy(
      file.publicId,
      {
        resource_type:
          file.resourceType,
      }
    );


    // ------------------------------------
    // DELETE FROM MONGODB
    // ------------------------------------

    await File.findByIdAndDelete(
      fileId
    );


    // ------------------------------------
    // RESPONSE
    // ------------------------------------

    return res.json({
      success: true,

      message:
        "File deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete project file error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to delete project file",
    });
  }
};


// ========================================
// EXPORT
// ========================================

module.exports = {
  uploadProjectFile,
  getProjectFiles,
  deleteProjectFile,
};