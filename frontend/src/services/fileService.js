const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// ========================================
// COMMON REQUEST
// ========================================

const request = async (
  url,
  options = {}
) => {
  const response =
    await fetch(url, {
      credentials: "include",

      ...options,

      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData
          ? {}
          : {
              "Content-Type":
                "application/json",
            }),
        ...(options.headers || {}),
      },
    });


  const contentType =
    response.headers.get(
      "content-type"
    );


  if (
    !contentType?.includes(
      "application/json"
    )
  ) {
    throw new Error(
      "Server returned an unexpected response."
    );
  }


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data?.message ||
      "Request failed."
    );
  }


  return data;
};


// ========================================
// GLOBAL FILES
// ========================================

export const getGlobalFiles =
  async () => {
    const data =
      await request(
        `${API_BASE_URL}/files`
      );

    return (
      data?.files ||
      data?.data ||
      []
    );
  };


// ========================================
// WORKSPACE FILES
// ========================================

export const getWorkspaceFiles =
  async (workspaceId) => {
    const data =
      await request(
        `${API_BASE_URL}/workspaces/${workspaceId}/files`
      );

    return (
      data?.files ||
      data?.data ||
      []
    );
  };


// ========================================
// UPLOAD WORKSPACE FILE
// ========================================

export const uploadWorkspaceFile =
  async (
    workspaceId,
    file
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );


    const data =
      await request(
        `${API_BASE_URL}/workspaces/${workspaceId}/files`,
        {
          method: "POST",
          body: formData,
        }
      );


    return data?.file;
  };


// ========================================
// DELETE WORKSPACE FILE
// ========================================

export const deleteWorkspaceFile =
  async (
    workspaceId,
    fileId
  ) => {
    const data =
      await request(
        `${API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}`,
        {
          method: "DELETE",
        }
      );

    return data;
  };


// ========================================
// PROJECT FILES
// ========================================

export const getProjectFiles =
  async (
    workspaceId,
    projectId
  ) => {
    const data =
      await request(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/files`
      );

    return (
      data?.files ||
      data?.data ||
      []
    );
  };


// ========================================
// UPLOAD PROJECT FILE
// ========================================

export const uploadProjectFile =
  async (
    workspaceId,
    projectId,
    file
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );


    const data =
      await request(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/files`,
        {
          method: "POST",
          body: formData,
        }
      );


    return data?.file;
  };


// ========================================
// DELETE PROJECT FILE
// ========================================

export const deleteProjectFile =
  async (
    workspaceId,
    projectId,
    fileId
  ) => {
    const data =
      await request(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/files/${fileId}`,
        {
          method: "DELETE",
        }
      );

    return data;
  };

// ========================================
// ORGANIZATION FILES
// ========================================

export const getOrganizationFiles =
  async (
    organizationId
  ) => {

    if (!organizationId) {
      throw new Error(
        "Organization ID is required."
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/files/organization?organizationId=${encodeURIComponent(
          organizationId
        )}`
      );

    return (
      data?.files ||
      data?.data ||
      []
    );
  };


// ========================================
// UPLOAD ORGANIZATION FILE
// ========================================

export const uploadOrganizationFile =
  async (
    organizationId,
    file
  ) => {

    if (!organizationId) {
      throw new Error(
        "Organization ID is required."
      );
    }

    if (!file) {
      throw new Error(
        "Please select a file."
      );
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "organizationId",
      organizationId
    );

    const data =
      await request(
        `${API_BASE_URL}/files/organization`,
        {
          method:
            "POST",

          body:
            formData,
        }
      );

    return data?.file;
  };


  export const deleteOrganizationFile = async (
  fileId
) => {
  if (!fileId) {
    throw new Error("File ID is required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/files/organization/${fileId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
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
        "Unable to delete file."
    );
  }

  return data;
};