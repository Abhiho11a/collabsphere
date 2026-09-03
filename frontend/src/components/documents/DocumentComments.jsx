import React, { useEffect, useState } from "react";

import {
  MessageSquare,
  Check,
  Send,
  Loader2,
  X,
} from "lucide-react";

import {
  getDocumentComments,
  createDocumentComment,
  resolveDocumentComment,
} from "../../services/documentCommentService";


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
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};


const CommentItem = ({
  comment,
  onResolve,
}) => {
  const [resolving, setResolving] =
    useState(false);

  const handleResolve = async () => {
    try {
      setResolving(true);

      await onResolve(
        comment._id,
        !comment.resolved
      );
    } finally {
      setResolving(false);
    }
  };

  return (
    <div
      className={
        comment.resolved
          ? "document-comment resolved"
          : "document-comment"
      }
    >
      <div className="document-comment-header">

        <div className="document-comment-user">

          <div className="document-comment-avatar">
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt=""
              />
            ) : (
              getInitial(
                comment.author
              )
            )}
          </div>

          <div>
            <strong>
              {getUserName(
                comment.author
              )}
            </strong>

            <span>
              {formatDate(
                comment.createdAt
              )}
            </span>
          </div>

        </div>

        {comment.resolved && (
          <span className="comment-resolved-badge">
            Resolved
          </span>
        )}

      </div>


      <div className="document-comment-content">
        {comment.content}
      </div>


      {!comment.resolved && (
        <div className="document-comment-actions">

          <button
            type="button"
            onClick={handleResolve}
            disabled={resolving}
          >
            {resolving ? (
              <Loader2
                size={13}
                className="spin"
              />
            ) : (
              <Check size={13} />
            )}

            Resolve
          </button>

        </div>
      )}

      {comment.resolved && (
        <div className="document-comment-actions">

          <button
            type="button"
            onClick={handleResolve}
            disabled={resolving}
          >
            {resolving ? (
              <Loader2
                size={13}
                className="spin"
              />
            ) : (
              <X size={13} />
            )}

            Reopen
          </button>

        </div>
      )}

    </div>
  );
};


const DocumentComments = ({
  documentId,
  selectedRange = null,
  onClearSelection,
}) => {
  const [comments, setComments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [commentText, setCommentText] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [showResolved, setShowResolved] =
    useState(false);


  // ===================================================
  // LOAD COMMENTS
  // ===================================================

  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getDocumentComments(
          documentId
        );

      setComments(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (error) {
      console.error(
        "Load comments error:",
        error
      );

      setError(
        error.message ||
          "Unable to load comments"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!documentId) {
      return;
    }

    loadComments();
  }, [documentId]);


  // ===================================================
  // CREATE COMMENT
  // ===================================================

  const handleCreateComment =
    async () => {
      if (
        !commentText.trim() ||
        !documentId
      ) {
        return;
      }

      try {
        setCreating(true);
        setError("");

        const comment =
          await createDocumentComment(
            documentId,
            {
              content:
                commentText.trim(),

              from:
                selectedRange?.from || 0,

              to:
                selectedRange?.to || 0,
            }
          );

        if (comment) {
          setComments(
            (current) => [
              comment,
              ...current,
            ]
          );
        }

        setCommentText("");

        if (onClearSelection) {
          onClearSelection();
        }
      } catch (error) {
        console.error(
          "Create comment error:",
          error
        );

        setError(
          error.message ||
            "Unable to create comment"
        );
      } finally {
        setCreating(false);
      }
    };


  // ===================================================
  // RESOLVE
  // ===================================================

  const handleResolve =
    async (
      commentId,
      resolved
    ) => {
      try {
        const updated =
          await resolveDocumentComment(
            documentId,
            commentId,
            resolved
          );

        if (updated) {
          setComments(
            (current) =>
              current.map(
                (comment) =>
                  comment._id ===
                  commentId
                    ? updated
                    : comment
              )
          );
        }
      } catch (error) {
        console.error(
          "Resolve comment error:",
          error
        );

        setError(
          error.message ||
            "Unable to update comment"
        );
      }
    };


  const visibleComments =
    comments.filter(
      (comment) =>
        showResolved ||
        !comment.resolved
    );


  return (
    <aside className="document-comments-panel">

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div className="document-comments-header">

        <div>
          <div className="document-comments-title">
            <MessageSquare
              size={16}
            />

            Comments
          </div>

          <span>
            {comments.filter(
              (comment) =>
                !comment.resolved
            ).length}{" "}
            open
          </span>
        </div>

      </div>


      {/* ============================================= */}
      {/* ERROR */}
      {/* ============================================= */}

      {error && (
        <div className="document-comments-error">
          {error}
        </div>
      )}


      {/* ============================================= */}
      {/* NEW COMMENT */}
      {/* ============================================= */}

      <div className="document-new-comment">

        {selectedRange && (
          <div className="comment-selection-info">
            Commenting on selected text
          </div>
        )}

        <textarea
          value={commentText}
          onChange={(event) =>
            setCommentText(
              event.target.value
            )
          }
          placeholder={
            selectedRange
              ? "Add a comment..."
              : "Select text in the document to comment..."
          }
          disabled={
            !selectedRange ||
            creating
          }
          rows={4}
        />

        <div className="document-comment-compose-footer">

          <span>
            {commentText.length}/1000
          </span>

          <button
            type="button"
            onClick={
              handleCreateComment
            }
            disabled={
              !selectedRange ||
              !commentText.trim() ||
              creating
            }
          >
            {creating ? (
              <Loader2
                size={14}
                className="spin"
              />
            ) : (
              <Send size={14} />
            )}

            Comment
          </button>

        </div>

      </div>


      {/* ============================================= */}
      {/* FILTER */}
      {/* ============================================= */}

      <div className="document-comments-filter">

        <button
          type="button"
          className={
            !showResolved
              ? "active"
              : ""
          }
          onClick={() =>
            setShowResolved(false)
          }
        >
          Open
        </button>

        <button
          type="button"
          className={
            showResolved
              ? "active"
              : ""
          }
          onClick={() =>
            setShowResolved(true)
          }
        >
          All
        </button>

      </div>


      {/* ============================================= */}
      {/* COMMENTS */}
      {/* ============================================= */}

      <div className="document-comments-list">

        {loading ? (
          <div className="document-comments-loading">
            <Loader2
              size={18}
              className="spin"
            />

            Loading comments...
          </div>
        ) : visibleComments.length ===
          0 ? (
          <div className="document-comments-empty">

            <MessageSquare
              size={25}
            />

            <strong>
              No comments yet
            </strong>

            <span>
              Select some text and add
              the first comment.
            </span>

          </div>
        ) : (
          visibleComments.map(
            (comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onResolve={
                  handleResolve
                }
              />
            )
          )
        )}

      </div>

    </aside>
  );
};


export default DocumentComments;