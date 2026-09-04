const multer = require("multer");

// =====================================================
// STORAGE
// =====================================================

const storage = multer.memoryStorage();

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",

    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",

    // Archives
    "application/zip",
    "application/x-rar-compressed",

    // Video
    "video/mp4",
    "video/webm",

    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "This file type is not supported"
      )
    );
  }

  cb(null, true);
};

// =====================================================
// MULTER
// =====================================================

const uploadProjectFile = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = uploadProjectFile;