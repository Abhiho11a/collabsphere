const express = require("express");

const {
  createDocument,
  getMyDocuments,
  getWorkspaceDocuments,
  getProjectDocuments,
  getDocumentById,
  updateDocument,
} = require("../controllers/documentController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GLOBAL DOCUMENT LIST
// =====================================================
// Returns documents the current user can access:
// Personal + Workspace + Project

router.get(
  "/my",
  protect,
  getMyDocuments
);


// =====================================================
// CREATE DOCUMENT
// =====================================================
// Creates:
// - Personal document
// - Workspace document
// - Project document
//
// The controller decides the scope based on
// workspaceId / projectId.

router.post(
  "/",
  protect,
  createDocument
);


// =====================================================
// GET WORKSPACE DOCUMENTS
// =====================================================
// Workspace-level documents only.
// Project documents are NOT returned here.

router.get(
  "/workspaces/:workspaceId/documents",
  protect,
  getWorkspaceDocuments
);


// =====================================================
// GET PROJECT DOCUMENTS
// =====================================================
// Project-level documents only.

router.get(
  "/workspaces/:workspaceId/projects/:projectId/documents",
  protect,
  getProjectDocuments
);


// =====================================================
// GET SINGLE DOCUMENT
// =====================================================

router.get(
  "/:documentId",
  protect,
  getDocumentById
);


// =====================================================
// UPDATE DOCUMENT
// =====================================================

router.patch(
  "/:documentId",
  protect,
  updateDocument
);


module.exports = router;