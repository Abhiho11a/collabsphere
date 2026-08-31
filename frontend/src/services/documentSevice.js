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
        Accept: "application/json",

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


  // -----------------------------------------
  // PARSE RESPONSE
  // -----------------------------------------

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  // -----------------------------------------
  // HANDLE ERROR
  // -----------------------------------------

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Something went wrong"
    );
  }


  return data;
};


// =====================================================
// GET MY ACCESSIBLE DOCUMENTS
// =====================================================
// Returns:
// - Personal documents
// - Workspace documents
// - Project documents
//
// Backend decides what the user is allowed
// to see.

export const getMyDocuments =
  async () => {
    const data =
      await request(
        `${API_BASE_URL}/documents/my`
      );

    return (
      data?.documents ||
      []
    );
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
// Supported:
//
// Personal:
// {
//   title,
//   content
// }
//
// Workspace:
// {
//   title,
//   content,
//   workspaceId
// }
//
// Project:
// {
//   title,
//   content,
//   projectId
// }
//
// IMPORTANT:
// For project documents the backend
// determines the workspace from the project.

export const createDocument =
  async ({
    title,
    content = "",
    workspaceId = null,
    projectId = null,
  }) => {

    if (!title?.trim()) {
      throw new Error(
        "Document title is required"
      );
    }


    // -----------------------------------------
    // PREPARE BODY
    // -----------------------------------------

    const body = {
      title: title.trim(),

      content,
    };


    // -----------------------------------------
    // WORKSPACE DOCUMENT
    // -----------------------------------------

    if (workspaceId) {
      body.workspaceId =
        workspaceId;
    }


    // -----------------------------------------
    // PROJECT DOCUMENT
    // -----------------------------------------

    if (projectId) {
      body.projectId =
        projectId;
    }


    // -----------------------------------------
    // CREATE
    // -----------------------------------------

    const data =
      await request(
        `${API_BASE_URL}/documents`,
        {
          method: "POST",

          body:
            JSON.stringify(body),
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
// DELETE DOCUMENT
// =====================================================
//
// Your current backend does NOT have a
// deleteDocument controller/route yet.
//
// So we intentionally don't expose a
// delete function here until the backend
// is implemented.
//
// We'll add it later.


export default {
  getMyDocuments,
  getWorkspaceDocuments,
  getProjectDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
};