const mongoose = require("mongoose");

const documentCommentSchema =
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

      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },

      // Editor selection position
      from: {
        type: Number,
        default: 0,
      },

      to: {
        type: Number,
        default: 0,
      },

      resolved: {
        type: Boolean,
        default: false,
      },

      replies: [
        {
          author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          content: {
            type: String,
            trim: true,
            maxlength: 3000,
          },

          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    {
      timestamps: true,
    }
  );


documentCommentSchema.index({
  document: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model(
    "DocumentComment",
    documentCommentSchema
  );