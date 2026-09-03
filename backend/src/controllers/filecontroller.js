const File = require("../models/File");
const Organization = require("../models/Organization");
const OrganizationMember = require("../models/OrganizationMember");
const Workspace = require("../models/Workspace");
const Project = require("../models/Project");

const WorkspaceMember = require("../models/WorkspaceMember");
const ProjectMember = require("../models/ProjectMember");

const cloudinary =
  require("../config/cloudinary");


// =====================================================
// GET GLOBAL FILES
// GET /api/files
// =====================================================
//
// Legacy endpoint.
//
// The Files page should use:
// GET /api/files/organization?organizationId=:organizationId
//
// This endpoint is kept so existing functionality is
// not unnecessarily broken.
// =====================================================

const getGlobalFiles = async (req, res) => {
  try {
    const userId = req.user._id;

    const workspaceMemberships =
      await WorkspaceMember.find({
        user: userId,
        status: "Active",
      }).select("workspace");

    const workspaceIds =
      workspaceMemberships.map(
        (membership) => membership.workspace
      );

    const projectMemberships =
      await ProjectMember.find({
        user: userId,
        status: "Active",
      }).select("project");

    const projectIds =
      projectMemberships.map(
        (membership) => membership.project
      );

    const files =
      await File.find({
        $or: [
          {
            workspace: {
              $in: workspaceIds,
            },
            project: null,
          },

          {
            project: {
              $in: projectIds,
            },
          },
        ],
      })
        .populate(
          "uploadedBy",
          "name email avatar"
        )
        .populate(
          "workspace",
          "name"
        )
        .populate(
          "project",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    const formattedFiles =
      files.map((file) => {
        const isProjectFile =
          Boolean(file.project);

        return {
          id: file._id,

          name: file.originalName,

          url: file.fileUrl,

          fileUrl: file.fileUrl,

          publicId: file.publicId,

          mimeType: file.mimeType,

          size: file.size,

          resourceType: file.resourceType,

          uploadedBy:
            file.uploadedBy
              ? {
                  id:
                    file.uploadedBy._id,

                  name:
                    file.uploadedBy.name,

                  email:
                    file.uploadedBy.email,

                  avatar:
                    file.uploadedBy.avatar,
                }
              : null,

          source: {
            type:
              isProjectFile
                ? "project"
                : "workspace",

            workspace:
              file.workspace
                ? {
                    id:
                      file.workspace._id,

                    name:
                      file.workspace.name,
                  }
                : null,

            project:
              file.project
                ? {
                    id:
                      file.project._id,

                    name:
                      file.project.name,
                  }
                : null,
          },

          createdAt:
            file.createdAt,

          updatedAt:
            file.updatedAt,
        };
      });

    return res.status(200).json({
      success: true,
      count:
        formattedFiles.length,
      files:
        formattedFiles,
    });

  } catch (error) {

    console.error(
      "Get global files error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch files",
    });
  }
};

const getOrganizationFiles = async (
  req,
  res
) => {
  try {
    const {
      organizationId,
    } = req.query;

    // ========================================
    // VALIDATE ORGANIZATION
    // ========================================

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required",
      });
    }

    // ========================================
    // VERIFY ORGANIZATION EXISTS
    // ========================================

    const organization =
      await Organization.findById(
        organizationId
      ).select("_id");

    if (!organization) {
      return res.status(404).json({
        success: false,
        message:
          "Organization not found",
      });
    }

    // ========================================
    // VERIFY ORGANIZATION MEMBERSHIP
    // ========================================

    const organizationMembership =
      await OrganizationMember.findOne({
        organization:
          organizationId,

        user:
          req.user._id,

        status:
          "Active",
      });

    if (!organizationMembership) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });
    }

    // ========================================
    // GET ALL ACTIVE WORKSPACES
    // IN THIS ORGANIZATION
    // ========================================

    const organizationWorkspaces =
      await Workspace.find({
        organization:
          organizationId,

        isActive:
          true,
      }).select("_id name");

    const organizationWorkspaceIds =
      organizationWorkspaces.map(
        (workspace) =>
          workspace._id
      );

    // ========================================
    // GET WORKSPACES WHERE USER IS MEMBER
    // ========================================

    const workspaceMemberships =
      await WorkspaceMember.find({
        user:
          req.user._id,

        status:
          "Active",

        workspace: {
          $in:
            organizationWorkspaceIds,
        },
      }).select("workspace");

    const accessibleWorkspaceIds =
      workspaceMemberships.map(
        (membership) =>
          membership.workspace
      );

    // ========================================
    // GET PROJECTS WHERE USER IS MEMBER
    // AND PROJECT BELONGS TO CURRENT ORG
    // ========================================

    const projectMemberships =
      await ProjectMember.find({
        user:
          req.user._id,

        status:
          "Active",
      }).select("project");

    const memberProjectIds =
      projectMemberships.map(
        (membership) =>
          membership.project
      );

    const accessibleProjects =
      await Project.find({
        _id: {
          $in:
            memberProjectIds,
        },

        workspace: {
          $in:
            organizationWorkspaceIds,
        },

        isActive:
          true,
      }).select(
        "_id name workspace"
      );

    const accessibleProjectIds =
      accessibleProjects.map(
        (project) =>
          project._id
      );

    // ========================================
    // FETCH FILES
    // ========================================
    //
    // 1. Organization files
    // 2. Workspace files where user is member
    // 3. Project files where user is member
    //
    // ========================================

    const files =
      await File.find({
        organization:
          organizationId,

        $or: [

          // -------------------------------
          // ORGANIZATION-LEVEL FILE
          // -------------------------------

          {
            workspace:
              null,

            project:
              null,
          },

          // -------------------------------
          // WORKSPACE-LEVEL FILE
          // -------------------------------

          {
            workspace: {
              $in:
                accessibleWorkspaceIds,
            },

            project:
              null,
          },

          // -------------------------------
          // PROJECT-LEVEL FILE
          // -------------------------------

          {
            project: {
              $in:
                accessibleProjectIds,
            },
          },

        ],
      })
        .populate(
          "uploadedBy",
          "name email avatar"
        )
        .populate(
          "workspace",
          "name"
        )
        .populate(
          "project",
          "name"
        )
        .sort({
          createdAt:
            -1,
        });

    // ========================================
    // FORMAT RESPONSE
    // ========================================

    const formattedFiles =
      files.map((file) => {

        let sourceType =
          "organization";

        if (file.project) {
          sourceType =
            "project";
        } else if (
          file.workspace
        ) {
          sourceType =
            "workspace";
        }

        return {
          id:
            file._id,

          name:
            file.originalName,

          originalName:
            file.originalName,

          url:
            file.fileUrl,

          fileUrl:
            file.fileUrl,

          publicId:
            file.publicId,

          mimeType:
            file.mimeType,

          size:
            file.size,

          resourceType:
            file.resourceType,

          uploadedBy:
            file.uploadedBy
              ? {
                  id:
                    file.uploadedBy._id,

                  name:
                    file.uploadedBy.name,

                  email:
                    file.uploadedBy.email,

                  avatar:
                    file.uploadedBy.avatar,
                }
              : null,

          source: {
            type:
              sourceType,

            workspace:
              file.workspace
                ? {
                    id:
                      file.workspace._id,

                    name:
                      file.workspace.name,
                  }
                : null,

            project:
              file.project
                ? {
                    id:
                      file.project._id,

                    name:
                      file.project.name,
                  }
                : null,
          },

          createdAt:
            file.createdAt,

          updatedAt:
            file.updatedAt,
        };
      });

    return res.status(200).json({
      success:
        true,

      count:
        formattedFiles.length,

      files:
        formattedFiles,
    });

  } catch (error) {

    console.error(
      "Get organization files error:",
      error
    );

    return res.status(500).json({
      success:
        false,

      message:
        "Unable to fetch organization files",
    });
  }
};


const uploadOrganizationFile =
  async (req, res) => {

    try {

      const {
        organizationId,
      } = req.body;

      // ========================================
      // VALIDATE
      // ========================================

      if (!organizationId) {
        return res.status(400).json({
          success:
            false,

          message:
            "Organization ID is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success:
            false,

          message:
            "Please select a file",
        });
      }

      // ========================================
      // VERIFY ORGANIZATION
      // ========================================

      const organization =
        await Organization.findById(
          organizationId
        );

      if (!organization) {
        return res.status(404).json({
          success:
            false,

          message:
            "Organization not found",
        });
      }

      // ========================================
      // VERIFY MEMBERSHIP
      // ========================================

      const membership =
        await OrganizationMember.findOne({
          organization:
            organizationId,

          user:
            req.user._id,

          status:
            "Active",
        });

      if (!membership) {
        return res.status(403).json({
          success:
            false,

          message:
            "You do not have access to this organization",
        });
      }

      // ========================================
      // CLOUDINARY
      // ========================================

      const uploadResult =
        await new Promise(
          (resolve, reject) => {

            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    `collabsphere/organizations/${organizationId}`,

                  resource_type:
                    "auto",

                  use_filename:
                    true,

                  unique_filename:
                    true,
                },

                (
                  error,
                  result
                ) => {

                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }

                }
              );

            stream.end(
              req.file.buffer
            );
          }
        );

      // ========================================
      // SAVE FILE
      // ========================================

      const file =
        await File.create({

          organization:
            organizationId,

          workspace:
            null,

          project:
            null,

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

      // ========================================
      // POPULATE
      // ========================================

      const populatedFile =
        await File.findById(
          file._id
        ).populate(
          "uploadedBy",
          "name email avatar"
        );

      return res.status(201).json({

        success:
          true,

        message:
          "Organization file uploaded successfully",

        file: {

          id:
            populatedFile._id,

          name:
            populatedFile.originalName,

          originalName:
            populatedFile.originalName,

          url:
            populatedFile.fileUrl,

          fileUrl:
            populatedFile.fileUrl,

          publicId:
            populatedFile.publicId,

          mimeType:
            populatedFile.mimeType,

          size:
            populatedFile.size,

          resourceType:
            populatedFile.resourceType,

          uploadedBy:
            populatedFile.uploadedBy
              ? {
                  id:
                    populatedFile.uploadedBy._id,

                  name:
                    populatedFile.uploadedBy.name,

                  email:
                    populatedFile.uploadedBy.email,

                  avatar:
                    populatedFile.uploadedBy.avatar,
                }
              : null,

          source: {
            type:
              "organization",

            workspace:
              null,

            project:
              null,
          },

          createdAt:
            populatedFile.createdAt,

          updatedAt:
            populatedFile.updatedAt,
        },
      });

    } catch (error) {

      console.error(
        "Upload organization file error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to upload organization file",
      });
    }
  };

// =====================================================
// DELETE ORGANIZATION FILE
// ORGANIZATION ADMIN ONLY
// =====================================================

// =====================================================
// DELETE ORGANIZATION FILE
// ORGANIZATION ADMIN ONLY
// =====================================================

const deleteOrganizationFile = async (
  req,
  res
) => {
  try {

    const {
      fileId,
    } = req.params;


    // ========================================
    // FIND FILE
    // ========================================

    const file =
      await File.findById(
        fileId
      );

    if (!file) {

      return res.status(404).json({
        success: false,
        message: "File not found",
      });

    }


    // ========================================
    // MAKE SURE THIS IS AN
    // ORGANIZATION-LEVEL FILE
    // ========================================

    if (
      !file.organization ||
      file.workspace ||
      file.project
    ) {

      return res.status(400).json({
        success: false,
        message:
          "This is not an organization-level file",
      });

    }


    // ========================================
    // FIND ORGANIZATION
    // ========================================

    const organization =
      await Organization.findById(
        file.organization
      ).select("_id");

    if (!organization) {

      return res.status(404).json({
        success: false,
        message:
          "Organization not found",
      });

    }


    // ========================================
    // CHECK ORGANIZATION MEMBERSHIP
    // ========================================

    const membership =
      await OrganizationMember.findOne({
        organization:
          file.organization,

        user:
          req.user._id,

        status:
          "Active",
      });


    if (!membership) {

      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this organization",
      });

    }


    // ========================================
    // ORGANIZATION ADMIN ONLY
    // ========================================

    if (
      membership.role !==
      "organization_admin"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Only organization admins can delete files",
      });

    }


    // ========================================
    // DELETE FROM CLOUDINARY
    // ========================================

    if (file.publicId) {

      try {

        await cloudinary.uploader.destroy(
          file.publicId,
          {
            resource_type:
              file.resourceType ||
              "image",
          }
        );

      } catch (cloudinaryError) {

        console.error(
          "Cloudinary delete error:",
          cloudinaryError
        );

        // Don't stop database deletion
        // if Cloudinary deletion fails.
      }

    }


    // ========================================
    // DELETE FROM DATABASE
    // ========================================

    await File.findByIdAndDelete(
      fileId
    );


    // ========================================
    // SUCCESS
    // ========================================

    return res.status(200).json({

      success: true,

      message:
        "File deleted successfully",

      fileId,

    });


  } catch (error) {

    console.error(
      "Delete organization file error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to delete file",

    });

  }
};


module.exports = {

  getGlobalFiles,

  getOrganizationFiles,
  
  uploadOrganizationFile,

  deleteOrganizationFile

};