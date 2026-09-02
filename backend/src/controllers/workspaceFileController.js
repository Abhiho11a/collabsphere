const cloudinary = require("../config/cloudinary");

const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");
const File = require("../models/File");


// ========================================
// CHECK WORKSPACE ACCESS
// ========================================

const checkWorkspaceAccess = async (
  workspaceId,
  userId
) => {
  const workspace =
    await Workspace.findOne({
      _id: workspaceId,
      isActive: true,
    });

  if (!workspace) {
    return {
      workspace: null,
      member: null,
    };
  }

  const member =
    await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
      status: "Active",
    });

  return {
    workspace,
    member,
  };
};


// ========================================
// UPLOAD WORKSPACE FILE
// ========================================

const uploadWorkspaceFile = async (
  req,
  res
) => {
  try {
    const { workspaceId } =
      req.params;


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
    // CHECK WORKSPACE ACCESS
    // ------------------------------------

    const {
      workspace,
      member,
    } = await checkWorkspaceAccess(
      workspaceId,
      req.user._id
    );


    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }


    if (!member) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this workspace",
      });
    }


    // ------------------------------------
    // CLOUDINARY UPLOAD
    // ------------------------------------

    const uploadResult =
      await new Promise(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  `collabsphere/workspaces/${workspaceId}`,

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
    // SAVE FILE
    // ------------------------------------

    const file =
      await File.create({
        organization:
          workspace.organization,

        workspace:
          workspaceId,

        project: null,

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
    // RESPONSE
    // ------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Workspace file uploaded successfully",

      file: {
        id: file._id,

        name:
          file.originalName,

        fileUrl:
          file.fileUrl,

        publicId:
          file.publicId,

        mimeType:
          file.mimeType,

        size:
          file.size,

        uploadedBy:
          req.user._id,

        createdAt:
          file.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "Upload workspace file error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload workspace file",
    });
  }
};


// ========================================
// GET WORKSPACE FILES
// ========================================

const getWorkspaceFiles = async (
  req,
  res
) => {
  try {
    const { workspaceId } =
      req.params;


    // ------------------------------------
    // CHECK ACCESS
    // ------------------------------------

    const {
      workspace,
      member,
    } = await checkWorkspaceAccess(
      workspaceId,
      req.user._id
    );


    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }


    if (!member) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this workspace",
      });
    }


    // ------------------------------------
    // FETCH ONLY WORKSPACE FILES
    // ------------------------------------

    const files =
      await File.find({
        workspace: workspaceId,

        project: null,
      })
        .populate(
          "uploadedBy",
          "name email avatar"
        )
        .populate(
          "workspace",
          "name"
        )
        .sort({
          createdAt: -1,
        });


    return res.json({
      success: true,

      count: files.length,

      files,
    });

  } catch (error) {
    console.error(
      "Get workspace files error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch workspace files",
    });
  }
};


// ========================================
// DELETE WORKSPACE FILE
// ========================================

const deleteWorkspaceFile = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      fileId,
    } = req.params;


    // ------------------------------------
    // CHECK ACCESS
    // ------------------------------------

    const {
      workspace,
      member,
    } = await checkWorkspaceAccess(
      workspaceId,
      req.user._id
    );


    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }


    if (!member) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this workspace",
      });
    }


    // ------------------------------------
    // FIND FILE
    // ------------------------------------

    const file =
      await File.findOne({
        _id: fileId,

        workspace: workspaceId,

        project: null,
      });


    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }


    // ------------------------------------
    // DELETE CLOUDINARY FILE
    // ------------------------------------

    await cloudinary.uploader.destroy(
      file.publicId,
      {
        resource_type:
          file.resourceType,
      }
    );


    // ------------------------------------
    // DELETE DATABASE RECORD
    // ------------------------------------

    await File.findByIdAndDelete(
      fileId
    );


    return res.json({
      success: true,

      message:
        "Workspace file deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete workspace file error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete workspace file",
    });
  }
};


module.exports = {
  uploadWorkspaceFile,
  getWorkspaceFiles,
  deleteWorkspaceFile,
};