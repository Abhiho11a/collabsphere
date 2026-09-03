const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// COMMON REQUEST HELPER
// =====================================================

const request = async (
  url,
  options = {}
) => {
  const response = await fetch(
    url,
    {
      credentials: "include",

      headers: {
        Accept:
          "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },

      ...options,
    }
  );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Something went wrong"
    );
  }


  return data;
};


// =====================================================
// GET MY DOCUMENTS
// =====================================================

export const getMyDocuments = async (organizationId = null) => {
  const query = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";

  const data = await request(
    `${API_BASE_URL}/documents/my${query}`
  );

  return data?.documents || [];
};


// =====================================================
// GET WORKSPACE DOCUMENTS
// =====================================================

export const getWorkspaceDocuments =
  async (workspaceId) => {

    if (!workspaceId) {
      throw new Error(
        "Workspace ID is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/workspaces/${workspaceId}/documents`
      );

    return (
      data?.documents ||
      []
    );
  };


// =====================================================
// GET PROJECT DOCUMENTS
// =====================================================

export const getProjectDocuments =
  async (
    workspaceId,
    projectId
  ) => {

    if (!workspaceId) {
      throw new Error(
        "Workspace ID is required"
      );
    }

    if (!projectId) {
      throw new Error(
        "Project ID is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/workspaces/${workspaceId}/projects/${projectId}/documents`
      );

    return (
      data?.documents ||
      []
    );
  };


// =====================================================
// GET SINGLE DOCUMENT
// =====================================================

export const getDocumentById =
  async (documentId) => {

    if (!documentId) {
      throw new Error(
        "Document ID is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}`
      );

    return data?.document;
  };


// =====================================================
// CREATE DOCUMENT
// =====================================================

export const createDocument = async ({
  title,
  content = "",
  organizationId = null,
  workspaceId = null,
  projectId = null,
  scope = null,
  access = null,
}) => {
  if (!title?.trim()) {
    throw new Error("Document title is required");
  }

  const body = {
    title: title.trim(),
    content,
  };

  if (organizationId) {
    body.organizationId = organizationId;
  }

  if (workspaceId) {
    body.workspaceId = workspaceId;
  }

  if (projectId) {
    body.projectId = projectId;
  }

  if (scope) {
    body.scope = scope;
  }

  if (access) {
    body.access = access;
  }

  const data = await request(
    `${API_BASE_URL}/documents`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return data?.document;
};

// =====================================================
// UPDATE DOCUMENT
// =====================================================

export const updateDocument =
  async (
    documentId,
    updates
  ) => {

    if (!documentId) {
      throw new Error(
        "Document ID is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          method: "PATCH",

          body:
            JSON.stringify(
              updates
            ),
        }
      );


    return data?.document;
  };


// =====================================================
// UPDATE ACCESS
// =====================================================

export const updateDocumentAccess =
  async (
    documentId,
    access
  ) => {

    if (!documentId) {
      throw new Error(
        "Document ID is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/access`,
        {
          method: "PATCH",

          body:
            JSON.stringify({
              access,
            }),
        }
      );

    return data?.document;
  };


// =====================================================
// COMMENTS
// =====================================================

export const getDocumentComments =
  async (documentId) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/comments`
      );

    return (
      data?.comments ||
      []
    );
  };


export const createDocumentComment =
  async (
    documentId,
    comment
  ) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/comments`,
        {
          method: "POST",

          body:
            JSON.stringify(
              comment
            ),
        }
      );

    return data?.comment;
  };


export const resolveDocumentComment =
  async (
    documentId,
    commentId,
    resolved
  ) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/comments/${commentId}`,
        {
          method: "PATCH",

          body:
            JSON.stringify({
              resolved,
            }),
        }
      );

    return data?.comment;
  };


// =====================================================
// VERSION HISTORY
// =====================================================

export const getDocumentVersions =
  async (documentId) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/versions`
      );

    return (
      data?.versions ||
      []
    );
  };


export const restoreDocumentVersion =
  async (
    documentId,
    versionId
  ) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

    return data?.document;
  };


// =====================================================
// SUGGESTIONS
// =====================================================

export const getDocumentSuggestions =
  async (documentId) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/suggestions`
      );

    return (
      data?.suggestions ||
      []
    );
  };


export const createDocumentSuggestion =
  async (
    documentId,
    suggestion
  ) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/suggestions`,
        {
          method: "POST",

          body:
            JSON.stringify(
              suggestion
            ),
        }
      );

    return data?.suggestion;
  };


export const updateDocumentSuggestion =
  async (
    documentId,
    suggestionId,
    status
  ) => {

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/suggestions/${suggestionId}`,
        {
          method: "PATCH",

          body:
            JSON.stringify({
              status,
            }),
        }
      );

    return data?.suggestion;
  };


export default {
  getMyDocuments,
  getWorkspaceDocuments,
  getProjectDocuments,
  getDocumentById,
  createDocument,
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