const {
  Server: HocuspocusServer,
} = require("@hocuspocus/server");

const User = require("../models/User");
const Document = require("../models/Document");

const OrganizationMember = require("../models/OrganizationMember");
const WorkspaceMember = require("../models/WorkspaceMember");
const ProjectMember = require("../models/ProjectMember");

const { Database } = require("@hocuspocus/extension-database");

const {
  verifyAccessToken,
} = require("../utils/token");


// =====================================================
// EXTRACT ACCESS TOKEN FROM COOKIE
// =====================================================

const extractAccessToken = (request) => {
  try {
    const cookieHeader =
      request?.headers?.get("cookie") || "";

    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean);

    const accessTokenCookie =
      cookies.find((cookie) =>
        cookie.startsWith("accessToken=")
      );

    if (!accessTokenCookie) {
      return null;
    }

    return decodeURIComponent(
      accessTokenCookie.substring(
        "accessToken=".length
      )
    );
  } catch (error) {
    console.error(
      "Token extraction error:",
      error
    );

    return null;
  }
};


// =====================================================
// AUTHENTICATE USER
// =====================================================

const authenticateUser = async ({
  token,
  request,
}) => {

  // ---------------------------------------------------
  // PREFERRED METHOD:
  // Token supplied by HocuspocusProvider
  // ---------------------------------------------------

  let accessToken = token;

  // ---------------------------------------------------
  // FALLBACK:
  // Read accessToken from cookie
  //
  // This keeps local development working even before
  // the frontend provider is updated.
  // ---------------------------------------------------

  if (!accessToken) {
    accessToken =
      extractAccessToken(request);
  }

  if (!accessToken) {
    throw new Error(
      "Authentication required"
    );
  }

  let decoded;

  try {
    decoded =
      verifyAccessToken(
        accessToken
      );
  } catch (error) {
    throw new Error(
      "Access token is invalid or expired"
    );
  }

  if (
    !decoded ||
    decoded.type !== "access"
  ) {
    throw new Error(
      "Invalid access token"
    );
  }

  const user =
    await User.findById(
      decoded.userId
    );

  if (!user) {
    throw new Error(
      "User no longer exists"
    );
  }

  if (!user.isActive) {
    throw new Error(
      "This account has been deactivated"
    );
  }

  return user;
};

// =====================================================
// DOCUMENT ACCESS CHECK
// =====================================================

const checkDocumentAccess = async (
  document,
  userId
) => {

  const userIdString =
    String(userId);

  // ---------------------------------------------------
  // CREATOR
  // ---------------------------------------------------

  const isCreator =
    String(document.createdBy) ===
    userIdString;

  if (isCreator) {
    return {
      canView: true,
      canEdit: true,
      canShare: true,
    };
  }


  // ---------------------------------------------------
  // EXPLICIT ACCESS
  // ---------------------------------------------------

  const isExplicitViewer =
    (
      document.access?.viewers ||
      []
    ).some(
      (id) =>
        String(id) === userIdString
    );


  const isExplicitEditor =
    (
      document.access?.editors ||
      []
    ).some(
      (id) =>
        String(id) === userIdString
    );


  // ---------------------------------------------------
  // SCOPE MEMBERSHIP
  // ---------------------------------------------------

  let isScopeMember = false;


  // ===================================================
  // ORGANIZATION DOCUMENT
  // ===================================================

  if (
    document.scope ===
    "organization"
  ) {

    const membership =
      await OrganizationMember.findOne({
        organization:
          document.organization,
        user: userId,
        status: "Active",
      });

    isScopeMember =
      !!membership;
  }


  // ===================================================
  // WORKSPACE DOCUMENT
  // ===================================================

  else if (
    document.scope ===
    "workspace"
  ) {

    const membership =
      await WorkspaceMember.findOne({
        workspace:
          document.workspace,
        user: userId,
        status: "Active",
      });

    isScopeMember =
      !!membership;
  }


  // ===================================================
  // PROJECT DOCUMENT
  // ===================================================

  else if (
    document.scope ===
    "project"
  ) {

    const membership =
      await ProjectMember.findOne({
        project:
          document.project,
        user: userId,
        status: "Active",
      });

    isScopeMember =
      !!membership;
  }


  // ---------------------------------------------------
  // VIEW PERMISSION
  // ---------------------------------------------------

  const canView =
    isExplicitViewer ||
    isExplicitEditor ||
    (
      isScopeMember &&
      document.access
        ?.inheritViewAccess === true
    );


  // ---------------------------------------------------
  // EDIT PERMISSION
  // ---------------------------------------------------

  const canEdit =
    isExplicitEditor ||
    (
      isScopeMember &&
      document.access
        ?.inheritEditAccess === true
    );


  // ---------------------------------------------------
  // SHARE
  //
  // For now:
  // creator only.
  //
  // We can later allow document admins.
  // ---------------------------------------------------

  const canShare =
    isCreator;


  return {
    canView,
    canEdit,
    canShare,
  };
};


// =====================================================
// CREATE HOCUSPOCUS SERVER
// =====================================================

const collaborationServer =
  new HocuspocusServer({

    port:
      Number(process.env.COLLABORATION_PORT) || 1234,

    extensions: [
      new Database({
        fetch: async ({ documentName }) => {

          const documentId =
            documentName.replace("document:", "");

          const document =
            await Document.findById(documentId);

          if (!document) {
            return null;
          }

          return document.collaborationState || null;
        },

        store: async ({
          documentName,
          state,
        }) => {

          const documentId =
            documentName.replace("document:", "");

          await Document.findByIdAndUpdate(
            documentId,
            {
              collaborationState:
                Buffer.from(state),
            }
          );
        },
      }),
    ],


    // =================================================
    // AUTHENTICATION + AUTHORIZATION
    // =================================================

    async onAuthenticate({
      request,
      connection,
      documentName,
      token,
    }) {

      try {

        // ---------------------------------------------
        // AUTHENTICATE USER
        // ---------------------------------------------

        const user =
          await authenticateUser({
            token,
            request,
          });


        // ---------------------------------------------
        // DOCUMENT ID
        // ---------------------------------------------

        const documentId =
          String(
            documentName
              .replace(
                "document:",
                ""
              )
          );


        if (!documentId) {
          throw new Error(
            "Document ID is required"
          );
        }


        // ---------------------------------------------
        // LOAD DOCUMENT
        // ---------------------------------------------

        const document =
          await Document.findOne({
            _id: documentId,
            isActive: true,
          });


        if (!document) {
          throw new Error(
            "Document not found"
          );
        }


        // ---------------------------------------------
        // CHECK ACCESS
        // ---------------------------------------------

        const permissions =
          await checkDocumentAccess(
            document,
            user._id
          );


        if (!permissions.canView) {

          throw new Error(
            "You do not have access to this document"
          );

        }


        // ---------------------------------------------
        // READ ONLY
        // ---------------------------------------------

        if (!permissions.canEdit) {

          connection.readOnly =
            true;

        }


        // ---------------------------------------------
        // RETURN CONTEXT
        //
        // Hocuspocus v4 stores this in `context`
        // and makes it available to other hooks.
        // ---------------------------------------------

        return {

          user: {
            id:
              String(user._id),

            name:
              user.name ||
              user.email ||
              "User",

            email:
              user.email || "",

            avatar:
              user.avatar || null,
          },

          documentId,

          canView:
            permissions.canView,

          canEdit:
            permissions.canEdit,

          canShare:
            permissions.canShare,
        };

      } catch (error) {

        console.error(
          "Collaboration authentication error:",
          error
        );

        throw error;
      }
    },


    // =================================================
    // CONNECTED
    // =================================================

    async onConnect({
      documentName,
      context,
      socketId,
    }) {

      console.log(
        `📝 Collaboration connected: ${documentName}`
      );


      if (context?.user) {

        console.log(
          `   User: ${
            context.user.name
          }`
        );

        console.log(
          `   User ID: ${
            context.user.id
          }`
        );

        console.log(
          `   Socket: ${
            socketId
          }`
        );

        console.log(
          `   Can edit: ${
            context.canEdit
          }`
        );

      }

    },


    // =================================================
    // DISCONNECT
    // =================================================

    async onDisconnect({
      documentName,
      context,
      socketId,
    }) {

      console.log(
        `📝 Collaboration disconnected: ${documentName}`
      );


      if (context?.user) {

        console.log(
          `   User: ${
            context.user.name
          }`
        );

        console.log(
          `   Socket: ${
            socketId
          }`
        );

      }

    },

    onAwarenessChange({ states }) {
    console.log(
        "👥 AWARENESS CHANGE:",
        states
    );
    },

    

  });
  


module.exports =
  collaborationServer;