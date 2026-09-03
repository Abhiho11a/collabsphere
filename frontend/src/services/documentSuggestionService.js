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


// =====================================================
// GET SUGGESTIONS
// =====================================================

export const getDocumentSuggestions =
  async (documentId) => {
    if (!documentId) {
      throw new Error(
        "Document ID is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/suggestions`
      );

    return data?.suggestions || [];
  };


// =====================================================
// CREATE SUGGESTION
// =====================================================

export const createDocumentSuggestion =
  async (
    documentId,
    {
      from,
      to,
      originalText,
      suggestedText,
    }
  ) => {
    if (!documentId) {
      throw new Error(
        "Document ID is required"
      );
    }

    if (!suggestedText?.trim()) {
      throw new Error(
        "Suggested text is required"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/suggestions`,
        {
          method: "POST",

          body: JSON.stringify({
            from,
            to,
            originalText,
            suggestedText,
          }),
        }
      );

    return data?.suggestion;
  };


// =====================================================
// UPDATE SUGGESTION STATUS
// =====================================================

export const updateDocumentSuggestion =
  async (
    documentId,
    suggestionId,
    status
  ) => {
    if (!documentId) {
      throw new Error(
        "Document ID is required"
      );
    }

    if (!suggestionId) {
      throw new Error(
        "Suggestion ID is required"
      );
    }

    if (
      ![
        "pending",
        "accepted",
        "rejected",
      ].includes(status)
    ) {
      throw new Error(
        "Invalid suggestion status"
      );
    }

    const data =
      await request(
        `${API_BASE_URL}/documents/${documentId}/suggestions/${suggestionId}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            status,
          }),
        }
      );

    return data?.suggestion;
  };


export default {
  getDocumentSuggestions,
  createDocumentSuggestion,
  updateDocumentSuggestion,
};