import React, {
  useEffect,
  useState,
} from "react";

import {
  Check,
  X,
  Sparkles,
  Loader2,
  User,
} from "lucide-react";

import {
  getDocumentSuggestions,
  updateDocumentSuggestion,
} from "../../services/documentSuggestionService";


const getUserName = (user) => {
  return (
    user?.name ||
    user?.email ||
    "Unknown user"
  );
};


const getInitial = (user) => {
  return (
    getUserName(user)
      .charAt(0)
      .toUpperCase() || "U"
  );
};


const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "";
  }

  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};


// =====================================================
// SUGGESTION ITEM
// =====================================================

const SuggestionItem = ({
  suggestion,
  onStatusChange,
  onAccept,
  canEdit,
}) => {
  const [
    loading,
    setLoading,
  ] = useState(false);


  const handleStatus =
    async (status) => {
      try {
        setLoading(true);

        await onStatusChange(
          suggestion._id,
          status
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <div
      className={
        suggestion.status ===
        "accepted"
          ? "document-suggestion accepted"
          : suggestion.status ===
            "rejected"
          ? "document-suggestion rejected"
          : "document-suggestion"
      }
    >

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="document-suggestion-header">

        <div className="document-suggestion-user">

          <div className="document-suggestion-avatar">
            {suggestion.author
              ?.avatar ? (
              <img
                src={
                  suggestion
                    .author
                    .avatar
                }
                alt=""
              />
            ) : (
              getInitial(
                suggestion.author
              )
            )}
          </div>

          <div>
            <strong>
              {getUserName(
                suggestion.author
              )}
            </strong>

            <span>
              {formatDate(
                suggestion.createdAt
              )}
            </span>
          </div>

        </div>


        <span
          className={`suggestion-status ${suggestion.status}`}
        >
          {suggestion.status}
        </span>

      </div>


      {/* ========================================== */}
      {/* ORIGINAL */}
      {/* ========================================== */}

      <div className="suggestion-block">

        <label>
          Original
        </label>

        <div className="suggestion-original">
          {suggestion.originalText ||
            "(No original text)"}
        </div>

      </div>


      {/* ========================================== */}
      {/* SUGGESTED */}
      {/* ========================================== */}

      <div className="suggestion-block">

        <label>
          Suggested change
        </label>

        <div className="suggestion-replacement">
          {suggestion.suggestedText}
        </div>

      </div>


      {/* ========================================== */}
      {/* ACTIONS */}
      {/* ========================================== */}

      {suggestion.status ===
        "pending" &&
        canEdit && (
          <div className="document-suggestion-actions">

            <button
              type="button"
              className="suggestion-reject-button"
              disabled={loading}
              onClick={() =>
                handleStatus(
                  "rejected"
                )
              }
            >
              {loading ? (
                <Loader2
                  size={13}
                  className="spin"
                />
              ) : (
                <X size={13} />
              )}

              Reject
            </button>


            <button
              type="button"
              className="suggestion-accept-button"
              disabled={loading}
              onClick={() =>
                onAccept(
                  suggestion
                )
              }
            >
              {loading ? (
                <Loader2
                  size={13}
                  className="spin"
                />
              ) : (
                <Check size={13} />
              )}

              Accept
            </button>

          </div>
        )}

    </div>
  );
};


// =====================================================
// MAIN COMPONENT
// =====================================================

const DocumentSuggestions = ({
  documentId,
  editor,
  canEdit,
  onDocumentChanged,
}) => {
  const [
    suggestions,
    setSuggestions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // ===================================================
  // LOAD
  // ===================================================

  const loadSuggestions =
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getDocumentSuggestions(
            documentId
          );

        setSuggestions(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (error) {
        console.error(
          "Load suggestions error:",
          error
        );

        setError(
          error.message ||
            "Unable to load suggestions"
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    if (!documentId) {
      return;
    }

    loadSuggestions();
  }, [documentId]);


  // ===================================================
  // UPDATE STATUS
  // ===================================================

  const handleStatusChange =
    async (
      suggestionId,
      status
    ) => {
      try {
        const updated =
          await updateDocumentSuggestion(
            documentId,
            suggestionId,
            status
          );

        if (updated) {
          setSuggestions(
            (current) =>
              current.map(
                (suggestion) =>
                  suggestion._id ===
                  suggestionId
                    ? updated
                    : suggestion
              )
          );
        }
      } catch (error) {
        console.error(
          "Update suggestion error:",
          error
        );

        setError(
          error.message ||
            "Unable to update suggestion"
        );
      }
    };


  // ===================================================
  // ACCEPT
  // ===================================================

  const handleAccept =
    async (suggestion) => {
      if (!editor) {
        return;
      }

      try {
        setError("");

        /*
         * The stored positions are used
         * first. If they no longer point
         * to the expected text, search for
         * the original text instead.
         */

        let from =
          Number(
            suggestion.from
          );

        let to =
          Number(
            suggestion.to
          );

        let validRange =
          from >= 1 &&
          to > from;


        if (validRange) {
          const selectedText =
            editor.state.doc.textBetween(
              from,
              to,
              " "
            );

          if (
            selectedText !==
            suggestion.originalText
          ) {
            validRange = false;
          }
        }


        // -------------------------------------------
        // FALLBACK SEARCH
        // -------------------------------------------

        if (
          !validRange &&
          suggestion.originalText
        ) {
          const text =
            editor.state.doc.textContent;

          const index =
            text.indexOf(
              suggestion.originalText
            );

          if (index >= 0) {
            /*
             * Simple fallback.
             * Positional mapping can be
             * improved later with stable
             * document anchors.
             */
            let found = null;

            editor.state.doc.descendants(
              (node, pos) => {
                if (found) {
                  return false;
                }

                if (
                  node.isText &&
                  node.text?.includes(
                    suggestion.originalText
                  )
                ) {
                  const localIndex =
                    node.text.indexOf(
                      suggestion.originalText
                    );

                  found = {
                    from:
                      pos +
                      localIndex,

                    to:
                      pos +
                      localIndex +
                      suggestion.originalText
                        .length,
                  };
                }

                return true;
              }
            );

            if (found) {
              from =
                found.from;

              to =
                found.to;

              validRange = true;
            }
          }
        }


        if (!validRange) {
          throw new Error(
            "The original text could not be found. The document may have changed."
          );
        }


        // -------------------------------------------
        // REPLACE
        // -------------------------------------------

        editor
          .chain()
          .focus()
          .insertContentAt(
            {
              from,
              to,
            },
            suggestion.suggestedText
          )
          .run();


        if (onDocumentChanged) {
            await onDocumentChanged();
        }


        // -------------------------------------------
        // MARK ACCEPTED
        // -------------------------------------------

        const updated =
          await updateDocumentSuggestion(
            documentId,
            suggestion._id,
            "accepted"
          );

        if (updated) {
          setSuggestions(
            (current) =>
              current.map(
                (item) =>
                  item._id ===
                  suggestion._id
                    ? updated
                    : item
              )
          );
        }

      } catch (error) {
        console.error(
          "Accept suggestion error:",
          error
        );

        setError(
          error.message ||
            "Unable to accept suggestion"
        );
      }
    };


  const pendingCount =
    suggestions.filter(
      (item) =>
        item.status ===
        "pending"
    ).length;


  return (
    <aside className="document-suggestions-panel">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="document-suggestions-header">

        <div>
          <div className="document-suggestions-title">

            <Sparkles
              size={16}
            />

            Suggestions

          </div>

          <span>
            {pendingCount} pending
          </span>
        </div>

      </div>


      {/* ========================================== */}
      {/* ERROR */}
      {/* ========================================== */}

      {error && (
        <div className="document-suggestions-error">
          {error}
        </div>
      )}


      {/* ========================================== */}
      {/* CONTENT */}
      {/* ========================================== */}

      <div className="document-suggestions-list">

        {loading ? (
          <div className="document-suggestions-empty">

            <Loader2
              size={18}
              className="spin"
            />

            Loading suggestions...

          </div>
        ) : suggestions.length ===
          0 ? (
          <div className="document-suggestions-empty">

            <Sparkles
              size={26}
            />

            <strong>
              No suggestions yet
            </strong>

            <span>
              Select text and suggest
              a change.
            </span>

          </div>
        ) : (
          suggestions.map(
            (suggestion) => (
              <SuggestionItem
                key={
                  suggestion._id
                }
                suggestion={
                  suggestion
                }
                canEdit={
                  canEdit
                }
                onStatusChange={
                  handleStatusChange
                }
                onAccept={
                  handleAccept
                }
              />
            )
          )
        )}

      </div>

    </aside>
  );
};


export default DocumentSuggestions;