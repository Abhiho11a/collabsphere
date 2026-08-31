const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// GENERIC REQUEST
// =====================================================

const request = async (url) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Server returned an unexpected response."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
      "Request failed."
    );
  }

  return data;
};


// =====================================================
// ARRAY NORMALIZER
// =====================================================

const extractArray = (data, keys = []) => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};


// =====================================================
// WORKSPACES
// =====================================================

export const getWorkspaces = async () => {
  const data = await request(
    `${API_BASE_URL}/workspaces`
  );

  return extractArray(data, [
    "data",
    "workspaces",
  ]);
};


// =====================================================
// PROJECTS
// =====================================================

export const getWorkspaceProjects = async (
  workspaceId
) => {
  if (!workspaceId) {
    return [];
  }

  const data = await request(
    `${API_BASE_URL}/workspaces/${workspaceId}/projects`
  );

  return extractArray(data, [
    "projects",
    "data",
  ]);
};


// =====================================================
// TASKS
// =====================================================

export const getProjectTasks = async (
  workspaceId,
  projectId
) => {
  if (!workspaceId || !projectId) {
    return [];
  }

  const data = await request(
    `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`
  );

  return extractArray(data, [
    "tasks",
    "data",
  ]);
};


// =====================================================
// MEMBERS
// =====================================================

export const getWorkspaceMembers = async (
  workspaceId
) => {
  if (!workspaceId) {
    return [];
  }

  const data = await request(
    `${API_BASE_URL}/workspaces/${workspaceId}/members`
  );

  return extractArray(data, [
    "members",
    "data",
  ]);
};


// =====================================================
// DOCUMENTS
// =====================================================

export const getWorkspaceDocuments = async (
  workspaceId
) => {
  if (!workspaceId) {
    return [];
  }

  const data = await request(
    `${API_BASE_URL}/workspaces/${workspaceId}/documents`
  );

  return extractArray(data, [
    "documents",
    "data",
  ]);
};


// =====================================================
// ACTIVITY
// =====================================================

export const getWorkspaceActivity = async (
  workspaceId
) => {
  if (!workspaceId) {
    return [];
  }

  const data = await request(
    `${API_BASE_URL}/workspaces/${workspaceId}/activity`
  );

  return extractArray(data, [
    "activities",
    "activity",
    "data",
  ]);
};