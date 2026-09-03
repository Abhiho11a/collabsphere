const mongoose = require("mongoose");

const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * A document can only have one version number.
 *
 * Example:
 * document A -> version 1
 * document A -> version 2
 * document A -> version 3
 */
documentVersionSchema.index(
  { document: 1, version: -1 },
  { unique: true }
);

documentVersionSchema.index({
  document: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "DocumentVersion",
  documentVersionSchema
);