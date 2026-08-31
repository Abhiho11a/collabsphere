const Activity = require("../models/Activity");
const Document = require("../models/Document");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const WorkspaceMember = require("../models/WorkspaceMember");


// =====================================================
// HELPERS
// =====================================================


// -----------------------------------------
// CHECK WORKSPACE MEMBERSHIP
// -----------------------------------------

const checkWorkspaceAccess = async (
  workspaceId,
  userId
) => {
  if (!workspaceId) {
    return false;
  }

  const membership =
    await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
      status: "Active",
    });

  return Boolean(membership);
};


// -----------------------------------------
// CHECK PROJECT MEMBERSHIP
// -----------------------------------------

const checkProjectAccess = async (
  projectId,
  userId
) => {
  if (!projectId) {
    return {
      project: null,
      member: null,
    };
  }

  const project =
    await Project.findOne({
      _id: projectId,
      isActive: true,
    });

  if (!project) {
    return {
      project: null,
      member: null,
    };
  }

  const member =
    await ProjectMember.findOne({
      project: projectId,
      user: userId,
      status: "Active",
    });

  return {
    project,
    member,
  };
};


// -----------------------------------------
// POPULATE DOCUMENT
// -----------------------------------------

const populateDocument = (query) => {
  return query
    .populate(
      "createdBy",
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
};


// =====================================================
// CREATE DOCUMENT
// =====================================================

const createDocument = async (req, res) => {
  try {

    const {
      title,
      content,
      workspaceId,
      projectId,
    } = req.body;


    // -----------------------------------------
    // VALIDATE TITLE
    // -----------------------------------------

    if (
      !title ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Document title is required",
      });
    }


    let workspace = null;
    let project = null;


    // =================================================
    // PROJECT DOCUMENT
    // =================================================

    if (projectId) {

      const {
        project: projectData,
        member,
      } = await checkProjectAccess(
        projectId,
        req.user._id
      );


      if (!projectData) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }


      if (!member) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this project",
        });
      }


      // -----------------------------------------
      // GET WORKSPACE FROM PROJECT
      // -----------------------------------------

      workspace =
        projectData.workspace;

      project =
        projectData._id;
    }


    // =================================================
    // WORKSPACE DOCUMENT
    // =================================================

    else if (workspaceId) {

      const hasAccess =
        await checkWorkspaceAccess(
          workspaceId,
          req.user._id
        );


      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this workspace",
        });
      }


      workspace =
        workspaceId;

      project = null;
    }


    // =================================================
    // PERSONAL DOCUMENT
    // =================================================

    else {

      workspace = null;
      project = null;
    }


    // =================================================
    // CREATE
    // =================================================

    const document =
      await Document.create({
        title: title.trim(),

        content:
          content || "",

        workspace,

        project,

        createdBy:
          req.user._id,
      });

      if (document.project) {
        await Activity.create({
          type: "document_created",

          project: document.project,

          workspace: document.workspace,

          user: req.user._id,

          message: `created document "${document.title}"`,

          metadata: {
            documentId: document._id,
            documentTitle: document.title,
          },
        });
      }


    // =================================================
    // POPULATE
    // =================================================

    const populatedDocument =
      await populateDocument(
        Document.findById(
          document._id
        )
      );


    return res.status(201).json({
      success: true,

      message:
        "Document created successfully",

      document:
        populatedDocument,
    });


  } catch (error) {

    console.error(
      "Create document error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to create document",
    });
  }
};


// =====================================================
// GET WORKSPACE DOCUMENTS
// =====================================================

const getWorkspaceDocuments = async (
  req,
  res
) => {
  try {

    const {
      workspaceId,
    } = req.params;


    // -----------------------------------------
    // CHECK MEMBERSHIP
    // -----------------------------------------

    const hasAccess =
      await checkWorkspaceAccess(
        workspaceId,
        req.user._id
      );


    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this workspace",
      });
    }


    // -----------------------------------------
    // FETCH WORKSPACE-LEVEL DOCUMENTS ONLY
    // -----------------------------------------

    const documents =
      await populateDocument(
        Document.find({
          workspace: workspaceId,

          project: null,

          isActive: true,
        })
      ).sort({
        updatedAt: -1,
      });


    return res.json({
      success: true,

      count:
        documents.length,

      documents,
    });


  } catch (error) {

    console.error(
      "Get workspace documents error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch workspace documents",
    });
  }
};


// =====================================================
// GET PROJECT DOCUMENTS
// =====================================================

const getProjectDocuments = async (
  req,
  res
) => {
  try {

    const {
      workspaceId,
      projectId,
    } = req.params;


    // -----------------------------------------
    // FIND PROJECT
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

        message:
          "Project not found",
      });
    }


    // -----------------------------------------
    // CHECK PROJECT MEMBERSHIP
    // -----------------------------------------

    const member =
      await ProjectMember.findOne({
        project: projectId,

        user: req.user._id,

        status: "Active",
      });


    if (!member) {
      return res.status(403).json({
        success: false,

        message:
          "You are not a member of this project",
      });
    }


    // -----------------------------------------
    // FETCH PROJECT DOCUMENTS
    // -----------------------------------------

    const documents =
      await populateDocument(
        Document.find({
          project: projectId,

          workspace: workspaceId,

          isActive: true,
        })
      ).sort({
        updatedAt: -1,
      });


    return res.json({
      success: true,

      count:
        documents.length,

      documents,
    });


  } catch (error) {

    console.error(
      "Get project documents error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch project documents",
    });
  }
};


// =====================================================
// GET MY DOCUMENTS
// =====================================================

const getMyDocuments = async (
  req,
  res
) => {
  try {

    // -----------------------------------------
    // GET WORKSPACE MEMBERSHIPS
    // -----------------------------------------

    const workspaceMemberships =
      await WorkspaceMember.find({
        user: req.user._id,

        status: "Active",
      }).select("workspace");


    const workspaceIds =
      workspaceMemberships.map(
        (membership) =>
          membership.workspace
      );


    // -----------------------------------------
    // GET PROJECT MEMBERSHIPS
    // -----------------------------------------

    const projectMemberships =
      await ProjectMember.find({
        user: req.user._id,

        status: "Active",
      }).select("project");


    const projectIds =
      projectMemberships.map(
        (membership) =>
          membership.project
      );


    // -----------------------------------------
    // FETCH ACCESSIBLE DOCUMENTS
    // -----------------------------------------

    const documents =
      await populateDocument(
        Document.find({
          isActive: true,

          $or: [

            // Personal documents
            {
              createdBy:
                req.user._id,

              workspace: null,

              project: null,
            },

            // Workspace documents
            {
              workspace: {
                $in:
                  workspaceIds,
              },

              project: null,
            },

            // Project documents
            {
              project: {
                $in:
                  projectIds,
              },
            },
          ],
        })
      ).sort({
        updatedAt: -1,
      });


    return res.json({
      success: true,

      count:
        documents.length,

      documents,
    });


  } catch (error) {

    console.error(
      "Get my documents error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch documents",
    });
  }
};


// =====================================================
// GET SINGLE DOCUMENT
// =====================================================

const getDocumentById = async (
  req,
  res
) => {
  try {

    const {
      documentId,
    } = req.params;


    // -----------------------------------------
    // FIND DOCUMENT
    // -----------------------------------------

    const document =
      await populateDocument(
        Document.findOne({
          _id: documentId,

          isActive: true,
        })
      );


    if (!document) {
      return res.status(404).json({
        success: false,

        message:
          "Document not found",
      });
    }


    // =================================================
    // PERSONAL DOCUMENT
    // =================================================

    if (
      !document.workspace &&
      !document.project
    ) {

      if (
        document.createdBy._id.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,

          message:
            "You do not have access to this document",
        });
      }
    }


    // =================================================
    // PROJECT DOCUMENT
    // =================================================

    else if (document.project) {

      const member =
        await ProjectMember.findOne({
          project:
            document.project._id,

          user:
            req.user._id,

          status: "Active",
        });


      if (!member) {
        return res.status(403).json({
          success: false,

          message:
            "You are not a member of this project",
        });
      }
    }


    // =================================================
    // WORKSPACE DOCUMENT
    // =================================================

    else if (document.workspace) {

      const member =
        await WorkspaceMember.findOne({
          workspace:
            document.workspace._id,

          user:
            req.user._id,

          status: "Active",
        });


      if (!member) {
        return res.status(403).json({
          success: false,

          message:
            "You are not a member of this workspace",
        });
      }
    }


    return res.json({
      success: true,

      document,
    });


  } catch (error) {

    console.error(
      "Get document error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch document",
    });
  }
};


// =====================================================
// UPDATE DOCUMENT
// =====================================================

const updateDocument = async (
  req,
  res
) => {
  try {

    const {
      documentId,
    } = req.params;


    const {
      title,
      content,
    } = req.body;


    // -----------------------------------------
    // FIND DOCUMENT
    // -----------------------------------------

    const document =
      await Document.findOne({
        _id: documentId,

        isActive: true,
      });


    if (!document) {
      return res.status(404).json({
        success: false,

        message:
          "Document not found",
      });
    }


    // =================================================
    // CHECK ACCESS
    // =================================================

    // -----------------------------------------
    // PERSONAL
    // -----------------------------------------

    if (
      !document.workspace &&
      !document.project
    ) {

      if (
        document.createdBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,

          message:
            "You do not have permission to update this document",
        });
      }
    }


    // -----------------------------------------
    // PROJECT
    // -----------------------------------------

    else if (document.project) {

      const member =
        await ProjectMember.findOne({
          project:
            document.project,

          user:
            req.user._id,

          status: "Active",
        });


      if (!member) {
        return res.status(403).json({
          success: false,

          message:
            "You are not a member of this project",
        });
      }
    }


    // -----------------------------------------
    // WORKSPACE
    // -----------------------------------------

    else if (document.workspace) {

      const member =
        await WorkspaceMember.findOne({
          workspace:
            document.workspace,

          user:
            req.user._id,

          status: "Active",
        });


      if (!member) {
        return res.status(403).json({
          success: false,

          message:
            "You are not a member of this workspace",
        });
      }
    }


    // -----------------------------------------
    // VALIDATE TITLE
    // -----------------------------------------

    if (
      title !== undefined &&
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Document title cannot be empty",
      });
    }


    // -----------------------------------------
    // UPDATE TITLE
    // -----------------------------------------

    if (title !== undefined) {
      document.title =
        title.trim();
    }


    // -----------------------------------------
    // UPDATE CONTENT
    // -----------------------------------------

    if (content !== undefined) {
      document.content =
        content;
    }


    await document.save();


    // -----------------------------------------
    // POPULATE
    // -----------------------------------------

    const populatedDocument =
      await populateDocument(
        Document.findById(
          document._id
        )
      );


    return res.json({
      success: true,

      message:
        "Document updated successfully",

      document:
        populatedDocument,
    });


  } catch (error) {

    console.error(
      "Update document error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to update document",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createDocument,

  getWorkspaceDocuments,

  getProjectDocuments,

  getMyDocuments,

  getDocumentById,

  updateDocument,
};