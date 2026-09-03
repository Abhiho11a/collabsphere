const mongoose = require("mongoose");

const documentSuggestionSchema =
  new mongoose.Schema(
    {
      document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
        index: true,
      },

      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      from: {
        type: Number,
        required: true,
      },

      to: {
        type: Number,
        required: true,
      },

      originalText: {
        type: String,
        default: "",
      },

      suggestedText: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "rejected",
        ],
        default: "pending",
      },
    },

    {
      timestamps: true,
    }
  );

documentSuggestionSchema.index({
  document: 1,
  status: 1,
});

module.exports =
  mongoose.model(
    "DocumentSuggestion",
    documentSuggestionSchema
  );