const File = require("../models/File");

const WorkspaceMember = require("../models/WorkspaceMember");
const ProjectMember = require("../models/ProjectMember");


// =====================================================
// GET GLOBAL FILES
// GET /api/files
// =====================================================

const getGlobalFiles = async (req, res) => {
  try {
    const userId = req.user._id;


    // =================================================
    // 1. FIND WORKSPACES USER BELONGS TO
    // =================================================

    const workspaceMemberships =
      await WorkspaceMember.find({
        user: userId,
        status: "Active",
      }).select(
        "workspace"
      );


    const workspaceIds =
      workspaceMemberships.map(
        (membership) =>
          membership.workspace
      );


    // =================================================
    // 2. FIND PROJECTS USER BELONGS TO
    // =================================================

    const projectMemberships =
      await ProjectMember.find({
        user: userId,
        status: "Active",
      }).select(
        "project"
      );


    const projectIds =
      projectMemberships.map(
        (membership) =>
          membership.project
      );


    // =================================================
    // 3. GET ACCESSIBLE FILES
    // =================================================
    //
    // Workspace files:
    //   project === null
    //
    // Project files:
    //   project belongs to user's projects
    //
    // =================================================

    const files =
      await File.find({
        $or: [

          // ---------------------------------------------
          // WORKSPACE-LEVEL FILES
          // ---------------------------------------------

          {
            workspace: {
              $in: workspaceIds,
            },

            project: null,
          },


          // ---------------------------------------------
          // PROJECT-LEVEL FILES
          // ---------------------------------------------

          {
            project: {
              $in: projectIds,
            },
          },

        ],
      })

        // =================================================
        // POPULATE UPLOADER
        // =================================================

        .populate(
          "uploadedBy",
          "name email avatar"
        )

        // =================================================
        // POPULATE WORKSPACE
        // =================================================

        .populate(
          "workspace",
          "name"
        )

        // =================================================
        // POPULATE PROJECT
        // =================================================

        .populate(
          "project",
          "name"
        )

        // =================================================
        // NEWEST FIRST
        // =================================================

        .sort({
          createdAt: -1,
        });


    // =================================================
    // 4. FORMAT RESPONSE
    // =================================================

    const formattedFiles =
      files.map(
        (file) => {

          const isProjectFile =
            Boolean(
              file.project
            );


          return {
            id:
              file._id,

            name:
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


            // -------------------------------------------
            // UPLOADED BY
            // -------------------------------------------

            uploadedBy:
              file.uploadedBy
                ? {
                    id:
                      file.uploadedBy
                        ._id,

                    name:
                      file.uploadedBy
                        .name,

                    email:
                      file.uploadedBy
                        .email,

                    avatar:
                      file.uploadedBy
                        .avatar,
                  }
                : null,


            // -------------------------------------------
            // SOURCE
            // -------------------------------------------

            source: {

              type:
                isProjectFile
                  ? "project"
                  : "workspace",


              // -----------------------------------------
              // WORKSPACE
              // -----------------------------------------

              workspace:
                file.workspace
                  ? {
                      id:
                        file.workspace
                          ._id,

                      name:
                        file.workspace
                          .name,
                    }
                  : null,


              // -----------------------------------------
              // PROJECT
              // -----------------------------------------

              project:
                file.project
                  ? {
                      id:
                        file.project
                          ._id,

                      name:
                        file.project
                          .name,
                    }
                  : null,

            },


            createdAt:
              file.createdAt,

            updatedAt:
              file.updatedAt,
          };
        }
      );


    // =================================================
    // 5. RESPONSE
    // =================================================

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


module.exports = {
  getGlobalFiles,
};