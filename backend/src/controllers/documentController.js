const Activity =
  require("../models/Activity");

const Document =
  require("../models/Document");

const DocumentVersion =
  require("../models/DocumentVersion");

const DocumentComment =
  require("../models/DocumentComment");

const DocumentSuggestion =
  require("../models/DocumentSuggestion");

const Organization =
  require("../models/Organization");

const OrganizationMember =
  require("../models/OrganizationMember");

const Project =
  require("../models/Project");

const ProjectMember =
  require("../models/ProjectMember");

const Workspace =
  require("../models/Workspace");

const WorkspaceMember =
  require("../models/WorkspaceMember");


// =====================================================
// HELPERS
// =====================================================

const getId = (value) =>
  value?._id || value?.id || value;


// =====================================================
// ORGANIZATION MEMBERSHIP
// =====================================================

const getOrganizationMembership =
  async (
    organizationId,
    userId
  ) => {

    if (!organizationId) {
      return null;
    }

    return OrganizationMember.findOne({
      organization:
        organizationId,

      user:
        userId,

      status:
        "Active",
    });
  };


// =====================================================
// WORKSPACE MEMBERSHIP
// =====================================================

const getWorkspaceMembership =
  async (
    workspaceId,
    userId
  ) => {

    if (!workspaceId) {
      return null;
    }

    return WorkspaceMember.findOne({
      workspace:
        workspaceId,

      user:
        userId,

      status:
        "Active",
    });
  };


// =====================================================
// PROJECT MEMBERSHIP
// =====================================================

const getProjectMembership =
  async (
    projectId,
    userId
  ) => {

    if (!projectId) {
      return null;
    }

    return ProjectMember.findOne({
      project:
        projectId,

      user:
        userId,

      status:
        "Active",
    });
  };


// =====================================================
// POPULATE DOCUMENT
// =====================================================

const populateDocument =
  (query) => {

    return query
      .populate(
        "createdBy",
        "name email avatar"
      )

      .populate(
        "project",
        "name workspace"
      )

      .populate(
        "workspace",
        "name organization"
      )

      .populate(
        "organization",
        "name"
      )

      .populate(
        "access.viewers",
        "name email avatar"
      )

      .populate(
        "access.editors",
        "name email avatar"
      );
  };


// =====================================================
// DETERMINE SCOPE
// =====================================================

const determineScope =
  ({
    organizationId,
    workspaceId,
    projectId,
  }) => {

    if (projectId) {
      return "project";
    }

    if (workspaceId) {
      return "workspace";
    }

    if (organizationId) {
      return "organization";
    }

    return "personal";
  };


// =====================================================
// CHECK DOCUMENT ACCESS
// =====================================================

const getDocumentPermission = async (
  document,
  userId
) => {
  const userIdString = userId.toString();

  // ========================================
  // CREATOR
  // ========================================

  const creatorId = getId(document.createdBy)?.toString();

  const isCreator =
    creatorId === userIdString;

  if (isCreator) {
    return {
      canView: true,
      canEdit: true,
      canComment: true,
      canSuggest: true,
      canShare: true,
      canRestore: true,
      canDelete: true,
    };
  }

  // ========================================
  // PERSONAL / INVALID DOCUMENT
  // ========================================

  if (
    document.scope === "personal" ||
    (
      !document.organization &&
      !document.workspace &&
      !document.project
    )
  ) {
    return {
      canView: false,
      canEdit: false,
      canComment: false,
      canSuggest: false,
      canShare: false,
      canRestore: false,
      canDelete: false,
    };
  }

  // ========================================
  // FIND ORGANIZATION
  // ========================================

  let organizationId =
    getId(document.organization);

  // Workspace fallback
  if (
    !organizationId &&
    document.workspace
  ) {
    const workspace =
      await Workspace.findById(
        getId(document.workspace)
      ).select("organization");

    organizationId =
      getId(workspace?.organization);
  }

  // Project fallback
  if (
    !organizationId &&
    document.project
  ) {
    const project =
      await Project.findById(
        getId(document.project)
      ).select("workspace");

    const workspace =
      await Workspace.findById(
        getId(project?.workspace)
      ).select("organization");

    organizationId =
      getId(workspace?.organization);
  }

  if (!organizationId) {
    return {
      canView: false,
      canEdit: false,
      canComment: false,
      canSuggest: false,
      canShare: false,
      canRestore: false,
      canDelete: false,
    };
  }

  // ========================================
  // ORGANIZATION MEMBERSHIP
  // ========================================

  const organizationMember =
    await getOrganizationMembership(
      organizationId,
      userId
    );

  if (!organizationMember) {
    return {
      canView: false,
      canEdit: false,
      canComment: false,
      canSuggest: false,
      canShare: false,
      canRestore: false,
      canDelete: false,
    };
  }

  const isOrganizationAdmin =
    organizationMember.role ===
    "organization_admin";

  // ========================================
  // EXPLICIT ACCESS
  // ========================================

  const explicitlyViewer =
    document.access?.viewers?.some(
      (id) =>
        getId(id)?.toString() === userIdString
    ) || false;

  const explicitlyEditor =
    document.access?.editors?.some(
      (id) =>
        getId(id)?.toString() === userIdString
    ) || false;

  let canView =
    explicitlyViewer ||
    explicitlyEditor;

  let canEdit =
    explicitlyEditor;

  // ========================================
  // ORGANIZATION ADMIN
  // ========================================
  // Organization admins have full document
  // control inside their organization.

  if (isOrganizationAdmin) {
    canView = true;
    canEdit = true;
  }

  // ========================================
  // INHERITED VIEW ACCESS
  // ========================================

  if (
    document.access?.inheritViewAccess
  ) {
    // Organization document
    if (
      document.scope === "organization"
    ) {
      canView = true;
    }

    // Workspace document
    if (
      document.scope === "workspace"
    ) {
      const member =
        await getWorkspaceMembership(
          getId(document.workspace),
          userId
        );

      if (member) {
        canView = true;
      }
    }

    // Project document
    if (
      document.scope === "project"
    ) {
      const member =
        await getProjectMembership(
          getId(document.project),
          userId
        );

      if (member) {
        canView = true;
      }
    }
  }

  // ========================================
  // INHERITED EDIT ACCESS
  // ========================================

  if (
    document.access?.inheritEditAccess
  ) {
    // Organization document
    if (
      document.scope === "organization"
    ) {
      canEdit = true;
    }

    // Workspace document
    if (
      document.scope === "workspace"
    ) {
      const member =
        await getWorkspaceMembership(
          getId(document.workspace),
          userId
        );

      if (member) {
        canEdit = true;
      }
    }

    // Project document
    if (
      document.scope === "project"
    ) {
      const member =
        await getProjectMembership(
          getId(document.project),
          userId
        );

      if (member) {
        canEdit = true;
      }
    }
  }

  // ========================================
  // FINAL PERMISSIONS
  // ========================================

  return {
    canView,
    canEdit,
    canComment: canView,
    canSuggest: canView && canEdit,

    // Only creator/admin manages access.
    canShare:
      isOrganizationAdmin ||
      isCreator,

    canRestore:
      isOrganizationAdmin ||
      isCreator,

    canDelete:
      isOrganizationAdmin ||
      isCreator,
  };
};

// =====================================================
// VALIDATE DOCUMENT ACCESS USERS
// =====================================================

const validateDocumentAccessUsers = async (
  document,
  viewers = [],
  editors = []
) => {
  const requestedUserIds = [
    ...new Set([
      ...viewers.map(String),
      ...editors.map(String),
    ]),
  ];

  if (requestedUserIds.length === 0) {
    return {
      valid: true,
      invalidIds: [],
    };
  }

  if (!document.organization) {
    return {
      valid: false,
      invalidIds: requestedUserIds,
    };
  }

  const members =
    await OrganizationMember.find({
      organization:
        getId(document.organization),

      user: {
        $in: requestedUserIds,
      },

      status: "Active",
    }).select("user");

  const validIds =
    members.map((member) =>
      member.user.toString()
    );

  const invalidIds =
    requestedUserIds.filter(
      (id) =>
        !validIds.includes(id)
    );

  return {
    valid: invalidIds.length === 0,
    invalidIds,
  };
};
// =====================================================
// CREATE DOCUMENT
// =====================================================

const createDocument =
  async (req, res) => {

    try {

      const {
        title,
        content = "",
        organizationId,
        workspaceId,
        projectId,
        scope,
        access,
      } = req.body;


      // -------------------------------------------------
      // TITLE
      // -------------------------------------------------

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


      let organization =
        null;

      let workspace =
        null;

      let project =
        null;


      // -------------------------------------------------
      // PROJECT DOCUMENT
      // -------------------------------------------------

      if (projectId) {

        project =
          await Project.findOne({
            _id:
              projectId,

            isActive:
              true,
          });


        if (!project) {

          return res.status(404).json({
            success: false,
            message:
              "Project not found",
          });
        }


        const projectMember =
          await getProjectMembership(
            projectId,
            req.user._id
          );


        if (!projectMember) {

          return res.status(403).json({
            success: false,
            message:
              "You are not a member of this project",
          });
        }


        workspace =
          await Workspace.findOne({
            _id:
              project.workspace,

            isActive:
              true,
          });


        if (!workspace) {

          return res.status(404).json({
            success: false,
            message:
              "Workspace not found",
          });
        }


        organization =
          await Organization.findById(
            workspace.organization
          );


        if (!organization) {

          return res.status(404).json({
            success: false,
            message:
              "Organization not found",
          });
        }
      }


      // -------------------------------------------------
      // WORKSPACE DOCUMENT
      // -------------------------------------------------

      else if (workspaceId) {

        workspace =
          await Workspace.findOne({
            _id:
              workspaceId,

            isActive:
              true,
          });


        if (!workspace) {

          return res.status(404).json({
            success: false,
            message:
              "Workspace not found",
          });
        }


        const workspaceMember =
          await getWorkspaceMembership(
            workspaceId,
            req.user._id
          );


        if (!workspaceMember) {

          return res.status(403).json({
            success: false,
            message:
              "You are not a member of this workspace",
          });
        }


        organization =
          await Organization.findById(
            workspace.organization
          );


        if (!organization) {

          return res.status(404).json({
            success: false,
            message:
              "Organization not found",
          });
        }
      }


      // -------------------------------------------------
      // ORGANIZATION DOCUMENT
      // -------------------------------------------------

      else if (organizationId) {

        organization =
          await Organization.findById(
            organizationId
          );


        if (!organization) {

          return res.status(404).json({
            success: false,
            message:
              "Organization not found",
          });
        }


        const organizationMember =
          await getOrganizationMembership(
            organizationId,
            req.user._id
          );


        if (!organizationMember) {

          return res.status(403).json({
            success: false,
            message:
              "You are not a member of this organization",
          });
        }
      }


      // -------------------------------------------------
      // FINAL SCOPE
      // -------------------------------------------------

      const documentScope =
        scope ||
        determineScope({
          organizationId:
            organization?._id ||
            organizationId,

          workspaceId:
            workspace?._id ||
            workspaceId,

          projectId:
            project?._id ||
            projectId,
        });


      // -------------------------------------------------
      // ACCESS
      // -------------------------------------------------

      const documentAccess = {
        inheritViewAccess:
          access?.inheritViewAccess !==
          false,

        inheritEditAccess:
          access?.inheritEditAccess ===
          true,

        viewers:
          Array.isArray(
            access?.viewers
          )
            ? access.viewers
            : [],

        editors:
          Array.isArray(
            access?.editors
          )
            ? access.editors
            : [],
      };


      // Creator always gets access.
      if (
        !documentAccess.editors
          .map(String)
          .includes(
            req.user._id.toString()
          )
      ) {

        documentAccess.editors.push(
          req.user._id
        );
      }


      if (
        !documentAccess.viewers
          .map(String)
          .includes(
            req.user._id.toString()
          )
      ) {

        documentAccess.viewers.push(
          req.user._id
        );
      }


      // -------------------------------------------------
      // CREATE
      // -------------------------------------------------

      const document =
        await Document.create({
          title:
            title.trim(),

          content,

          scope:
            documentScope,

          organization:
            organization?._id ||
            null,

          workspace:
            workspace?._id ||
            null,

          project:
            project?._id ||
            null,

          createdBy:
            req.user._id,

          access:
            documentAccess,
        });


      // -------------------------------------------------
      // VERSION 1
      // -------------------------------------------------

      await DocumentVersion.create({
        document: document._id,
        version: 1,
        title: document.title,
        content: document.content,
        createdBy: req.user._id,
      });


      // -------------------------------------------------
      // ACTIVITY
      // -------------------------------------------------

      if (document.project) {

        await Activity.create({
          type:
            "document_created",

          project:
            document.project,

          workspace:
            document.workspace,

          user:
            req.user._id,

          message:
            `created document "${document.title}"`,

          metadata: {
            documentId:
              document._id,

            documentTitle:
              document.title,
          },
        });
      }


      // -------------------------------------------------
      // RETURN
      // -------------------------------------------------

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

const getWorkspaceDocuments =
  async (req, res) => {

    try {

      const {
        workspaceId,
      } = req.params;


      const membership =
        await getWorkspaceMembership(
          workspaceId,
          req.user._id
        );


      if (!membership) {

        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this workspace",
        });
      }


      const documents =
        await populateDocument(
          Document.find({
            workspace:
              workspaceId,

            project:
              null,

            isActive:
              true,
          })
        ).sort({
          updatedAt:
            -1,
        });


      const accessible = [];

      for (
        const document
        of documents
      ) {

        const permissions =
          await getDocumentPermission(
            document,
            req.user._id
          );

        if (
          permissions.canView
        ) {
          accessible.push(
            document
          );
        }
      }


      return res.json({
        success: true,

        count:
          accessible.length,

        documents:
          accessible,
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

const getProjectDocuments =
  async (req, res) => {

    try {

      const {
        workspaceId,
        projectId,
      } = req.params;


      const project =
        await Project.findOne({
          _id:
            projectId,

          workspace:
            workspaceId,

          isActive:
            true,
        });


      if (!project) {

        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }


      const member =
        await getProjectMembership(
          projectId,
          req.user._id
        );


      if (!member) {

        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this project",
        });
      }


      const documents =
        await populateDocument(
          Document.find({
            project:
              projectId,

            workspace:
              workspaceId,

            isActive:
              true,
          })
        ).sort({
          updatedAt:
            -1,
        });


      const accessible = [];

      for (
        const document
        of documents
      ) {

        const permissions =
          await getDocumentPermission(
            document,
            req.user._id
          );

        if (
          permissions.canView
        ) {
          accessible.push(
            document
          );
        }
      }


      return res.json({
        success: true,

        count:
          accessible.length,

        documents:
          accessible,
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

const getMyDocuments =
  async (req, res) => {

    try {

      const {
        organizationId,
      } = req.query;


      // -------------------------------------------------
      // CURRENT ORGANIZATION
      // -------------------------------------------------

      if (organizationId) {

        const membership =
          await getOrganizationMembership(
            organizationId,
            req.user._id
          );


        if (!membership) {

          return res.status(403).json({
            success: false,
            message:
              "You do not have access to this organization",
          });
        }


        const documents =
          await populateDocument(
            Document.find({
              organization:
                organizationId,

              isActive:
                true,
            })
          ).sort({
            updatedAt:
              -1,
          });


        const accessible = [];

        for (
          const document
          of documents
        ) {

          const permissions =
            await getDocumentPermission(
              document,
              req.user._id
            );

          if (
            permissions.canView
          ) {

            accessible.push(
              document
            );
          }
        }


        return res.json({
          success: true,

          count:
            accessible.length,

          documents:
            accessible,
        });
      }


      // -------------------------------------------------
      // LEGACY / PERSONAL DOCUMENTS
      // -------------------------------------------------

      const documents =
        await populateDocument(
          Document.find({
            createdBy:
              req.user._id,

            organization:
              null,

            isActive:
              true,
          })
        ).sort({
          updatedAt:
            -1,
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

const getDocumentById =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;


      const document =
        await populateDocument(
          Document.findOne({
            _id:
              documentId,

            isActive:
              true,
          })
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canView
      ) {

        return res.status(403).json({
          success: false,

          message:
            "You do not have permission to view this document",
        });
      }


      // -------------------------------------------------
      // MEMBERS
      // -------------------------------------------------

      let members = [];

      if (
        document.organization
      ) {

        members =
          await OrganizationMember
            .find({
              organization:
                document.organization._id,

              status:
                "Active",
            })
            .populate(
              "user",
              "name email avatar"
            );
      }


      return res.json({
        success: true,

        document,

        permissions,

        currentUser: {
          id:
            req.user._id,

          name:
            req.user.name,

          email:
            req.user.email,
        },

        members:
          members.map(
            (member) => ({
              id:
                member.user?._id,

              name:
                member.user?.name,

              email:
                member.user?.email,

              avatar:
                member.user?.avatar,

              role:
                member.role,
            })
          ),
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

const updateDocument =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;

      const {
        title,
        content,
        status,
      } = req.body;


      const document =
        await Document.findOne({
          _id:
            documentId,

          isActive:
            true,
        });


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canEdit
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to edit this document",
        });
      }


      if (
        title !== undefined
      ) {

        if (
          !title.trim()
        ) {

          return res.status(400).json({
            success: false,

            message:
              "Document title cannot be empty",
          });
        }

        document.title =
          title.trim();
      }


      const contentChanged =
        content !== undefined &&
        content !==
          document.content;


      if (
        content !== undefined
      ) {

        document.content =
          content;
      }


      if (
        status !== undefined
      ) {

        if (
          ![
            "Draft",
            "Published",
            "Archived",
          ].includes(
            status
          )
        ) {

          return res.status(400).json({
            success: false,

            message:
              "Invalid document status",
          });
        }

        document.status =
          status;
      }


      if (
        contentChanged ||
        title !== undefined ||
        status !== undefined
      ) {

        document.version =
          (document.version || 1) +
          1;
      }


      await document.save();


      // -------------------------------------------------
      // VERSION
      // -------------------------------------------------

      if (
        contentChanged ||
        title !== undefined
      ) {

        await DocumentVersion.create({
          document: document._id,
          version: document.version,
          title: document.title,
          content: document.content,
          createdBy: req.user._id,
        });
      }


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
// UPDATE DOCUMENT ACCESS
// =====================================================

const updateDocumentAccess = async (
  req,
  res
) => {
  try {
    const {
      documentId,
    } = req.params;

    const {
      access,
    } = req.body;

    // ========================================
    // FIND DOCUMENT
    // ========================================

    const document =
      await Document.findOne({
        _id: documentId,
        isActive: true,
      });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ========================================
    // CHECK SHARE PERMISSION
    // ========================================

    const permissions =
      await getDocumentPermission(
        document,
        req.user._id
      );

    if (!permissions.canShare) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage document access",
      });
    }

    // ========================================
    // NORMALIZE ACCESS
    // ========================================

    const viewers =
      Array.isArray(access?.viewers)
        ? access.viewers
        : [];

    const editors =
      Array.isArray(access?.editors)
        ? access.editors
        : [];

    // ========================================
    // VALIDATE USERS
    // ========================================

    const validation =
      await validateDocumentAccessUsers(
        document,
        viewers,
        editors
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected users are not active members of this organization",
        invalidUserIds:
          validation.invalidIds,
      });
    }

    // ========================================
    // UPDATE ACCESS
    // ========================================

    document.access = {
      inheritViewAccess:
        access?.inheritViewAccess === true,

      inheritEditAccess:
        access?.inheritEditAccess === true,

      viewers: [
        ...new Map(
          viewers.map((id) => [
            String(id),
            id,
          ])
        ).values(),
      ],

      editors: [
        ...new Map(
          editors.map((id) => [
            String(id),
            id,
          ])
        ).values(),
      ],
    };

    // ========================================
    // CREATOR ALWAYS RETAINS ACCESS
    // ========================================

    const creatorId =
      getId(document.createdBy)?.toString();

    if (creatorId) {
      if (
        !document.access.viewers
          .map(String)
          .includes(creatorId)
      ) {
        document.access.viewers.push(
          document.createdBy
        );
      }

      if (
        !document.access.editors
          .map(String)
          .includes(creatorId)
      ) {
        document.access.editors.push(
          document.createdBy
        );
      }
    }

    await document.save();

    // ========================================
    // RETURN UPDATED DOCUMENT
    // ========================================

    const populatedDocument =
      await populateDocument(
        Document.findById(
          document._id
        )
      );

    return res.json({
      success: true,
      message:
        "Document access updated",
      document: populatedDocument,
    });
  } catch (error) {
    console.error(
      "Update document access error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update document access",
    });
  }
};


// =====================================================
// COMMENTS
// =====================================================

const getDocumentComments =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canView
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this document",
        });
      }


      const comments =
        await DocumentComment
          .find({
            document:
              documentId,
          })
          .populate(
            "author",
            "name email avatar"
          )
          .populate(
            "replies.author",
            "name email avatar"
          )
          .sort({
            createdAt:
              -1,
          });


      return res.json({
        success: true,
        comments,
      });

    } catch (error) {

      console.error(
        "Get comments error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch comments",
      });
    }
  };


const createDocumentComment =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;

      const {
        content,
        from = 0,
        to = 0,
      } = req.body;


      if (
        !content?.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Comment cannot be empty",
        });
      }


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canComment
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to comment",
        });
      }


      const comment =
        await DocumentComment.create({
          document:
            documentId,

          author:
            req.user._id,

          content:
            content.trim(),

          from,

          to,
        });


      const populated =
        await DocumentComment
          .findById(
            comment._id
          )
          .populate(
            "author",
            "name email avatar"
          );


      return res.status(201).json({
        success: true,
        comment:
          populated,
      });

    } catch (error) {

      console.error(
        "Create comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create comment",
      });
    }
  };


const resolveDocumentComment =
  async (req, res) => {

    try {

      const {
        documentId,
        commentId,
      } = req.params;

      const {
        resolved,
      } = req.body;


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canComment
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission",
        });
      }


      const comment =
        await DocumentComment.findOneAndUpdate(
          {
            _id:
              commentId,

            document:
              documentId,
          },

          {
            $set: {
              resolved:
                Boolean(
                  resolved
                ),
            },
          },

          {
            new: true,
          }
        ).populate(
          "author",
          "name email avatar"
        );


      if (!comment) {

        return res.status(404).json({
          success: false,
          message:
            "Comment not found",
        });
      }


      return res.json({
        success: true,
        comment,
      });

    } catch (error) {

      console.error(
        "Resolve comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update comment",
      });
    }
  };


// =====================================================
// VERSION HISTORY
// =====================================================

const getDocumentVersions =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canView
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this document",
        });
      }


      const versions =
        await DocumentVersion
          .find({
            document:
              documentId,
          })
          .populate(
            "createdBy",
            "name email avatar"
          )
          .sort({
            version:
              -1,
          });


      return res.json({
        success: true,
        versions,
      });

    } catch (error) {

      console.error(
        "Get versions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch version history",
      });
    }
  };


// =====================================================
// RESTORE VERSION
// =====================================================

const restoreDocumentVersion =
  async (req, res) => {

    try {

      const {
        documentId,
        versionId,
      } = req.params;


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canRestore
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to restore versions",
        });
      }


      const version =
        await DocumentVersion.findOne({
          _id:
            versionId,

          document:
            documentId,
        });


      if (!version) {

        return res.status(404).json({
          success: false,
          message:
            "Version not found",
        });
      }


      document.title =
        version.title;

      document.content =
        version.content;

      document.version =
        (document.version || 1) +
        1;


      await document.save();


      await DocumentVersion.create({
        document: document._id,
        version: document.version,
        title: document.title,
        content: document.content,
        createdBy: req.user._id,
      });


      const populatedDocument =
        await populateDocument(
          Document.findById(
            document._id
          )
        );


      return res.json({
        success: true,

        message:
          "Version restored successfully",

        document:
          populatedDocument,
      });

    } catch (error) {

      console.error(
        "Restore version error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to restore version",
      });
    }
  };


// =====================================================
// SUGGESTIONS
// =====================================================

const getDocumentSuggestions =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canView
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have access",
        });
      }


      const suggestions =
        await DocumentSuggestion
          .find({
            document:
              documentId,
          })
          .populate(
            "author",
            "name email avatar"
          )
          .sort({
            createdAt:
              -1,
          });


      return res.json({
        success: true,
        suggestions,
      });

    } catch (error) {

      console.error(
        "Get suggestions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch suggestions",
      });
    }
  };


const createDocumentSuggestion =
  async (req, res) => {

    try {

      const {
        documentId,
      } = req.params;

      const {
        from = 0,
        to = 0,
        originalText = "",
        suggestedText = "",
      } = req.body;


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canSuggest
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to suggest changes",
        });
      }


      const suggestion =
        await DocumentSuggestion.create({
          document:
            documentId,

          author:
            req.user._id,

          from,

          to,

          originalText,

          suggestedText,
        });


      const populated =
        await DocumentSuggestion
          .findById(
            suggestion._id
          )
          .populate(
            "author",
            "name email avatar"
          );


      return res.status(201).json({
        success: true,
        suggestion:
          populated,
      });

    } catch (error) {

      console.error(
        "Create suggestion error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create suggestion",
      });
    }
  };


const updateDocumentSuggestion =
  async (req, res) => {

    try {

      const {
        documentId,
        suggestionId,
      } = req.params;

      const {
        status,
      } = req.body;


      if (
        ![
          "pending",
          "accepted",
          "rejected",
        ].includes(status)
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid suggestion status",
        });
      }


      const document =
        await Document.findById(
          documentId
        );


      if (!document) {

        return res.status(404).json({
          success: false,
          message:
            "Document not found",
        });
      }


      const permissions =
        await getDocumentPermission(
          document,
          req.user._id
        );


      if (
        !permissions.canEdit
      ) {

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission",
        });
      }


      const suggestion =
        await DocumentSuggestion
          .findOneAndUpdate(
            {
              _id:
                suggestionId,

              document:
                documentId,
            },

            {
              $set: {
                status,
              },
            },

            {
              new: true,
            }
          )
          .populate(
            "author",
            "name email avatar"
          );


      if (!suggestion) {

        return res.status(404).json({
          success: false,
          message:
            "Suggestion not found",
        });
      }


      return res.json({
        success: true,
        suggestion,
      });

    } catch (error) {

      console.error(
        "Update suggestion error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update suggestion",
      });
    }
  };
// =====================================================
// DELETE DOCUMENT
// =====================================================

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // ========================================
    // FIND DOCUMENT
    // ========================================

    const document = await Document.findOne({
      _id: documentId,
      isActive: true,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // ========================================
    // CHECK DELETE PERMISSION
    // ========================================

    const permissions = await getDocumentPermission(
      document,
      req.user._id
    );

    if (!permissions.canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete this document",
      });
    }

    // ========================================
    // SOFT DELETE
    // ========================================

    document.isActive = false;

    await document.save();

    // ========================================
    // RETURN SUCCESS
    // ========================================

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      documentId: document._id,
    });

  } catch (error) {
    console.error(
      "Delete document error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete document",
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

  deleteDocument,

  getDocumentById,

  updateDocument,

  updateDocumentAccess,

  getDocumentComments,

  createDocumentComment,

  resolveDocumentComment,

  getDocumentVersions,

  restoreDocumentVersion,

  getDocumentSuggestions,

  createDocumentSuggestion,

  updateDocumentSuggestion,
};