const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const request = async (
  url,
  options = {}
) => {
  const response =
    await fetch(url, {
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
    });

  let data = null;

  try {
    data =
      await response.json();
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


export const getDocumentComments =
  async (documentId) => {
    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/comments`
      );

    return data?.comments || [];
  };


export const createDocumentComment =
  async (
    documentId,
    {
      content,
      from = 0,
      to = 0,
    }
  ) => {
    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/comments`,
        {
          method: "POST",

          body: JSON.stringify({
            content,
            from,
            to,
          }),
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

          body: JSON.stringify({
            resolved,
          }),
        }
      );

    return data?.comment;
  };