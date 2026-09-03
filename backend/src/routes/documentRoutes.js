const express = require("express");

const {
  createDocument,
  getMyDocuments,
  getWorkspaceDocuments,
  getProjectDocuments,
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
  deleteDocument,
} = require("../controllers/documentController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// DOCUMENTS
// =====================================================

// My / organization documents
router.get(
  "/my",
  protect,
  getMyDocuments
);

// Create document
router.post(
  "/",
  protect,
  createDocument
);

// =====================================================
// WORKSPACE DOCUMENTS
// =====================================================

router.get(
  "/workspaces/:workspaceId/documents",
  protect,
  getWorkspaceDocuments
);

// =====================================================
// PROJECT DOCUMENTS
// =====================================================

router.get(
  "/workspaces/:workspaceId/projects/:projectId/documents",
  protect,
  getProjectDocuments
);

// =====================================================
// COMMENTS
// =====================================================

router.get(
  "/:documentId/comments",
  protect,
  getDocumentComments
);

router.post(
  "/:documentId/comments",
  protect,
  createDocumentComment
);

router.patch(
  "/:documentId/comments/:commentId",
  protect,
  resolveDocumentComment
);

// =====================================================
// VERSION HISTORY
// =====================================================

router.get(
  "/:documentId/versions",
  protect,
  getDocumentVersions
);

router.post(
  "/:documentId/versions/:versionId/restore",
  protect,
  restoreDocumentVersion
);

// =====================================================
// SUGGESTIONS
// =====================================================

router.get(
  "/:documentId/suggestions",
  protect,
  getDocumentSuggestions
);

router.post(
  "/:documentId/suggestions",
  protect,
  createDocumentSuggestion
);

router.patch(
  "/:documentId/suggestions/:suggestionId",
  protect,
  updateDocumentSuggestion
);

// =====================================================
// ACCESS
// =====================================================

router.patch(
  "/:documentId/access",
  protect,
  updateDocumentAccess
);

// =====================================================
// SINGLE DOCUMENT
// =====================================================

router.get(
  "/:documentId",
  protect,
  getDocumentById
);

router.patch(
  "/:documentId",
  protect,
  updateDocument
);
router.delete("/:documentId", protect, deleteDocument);
module.exports = router;