import React, { useState } from "react";

import {
  FolderOpen,
  X,
  Search,
  Upload,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  MoreHorizontal,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";

const ProjectFilesModal = ({
  files = [],
  setFiles,
  onClose,
  projectName,
  workspaceId,
  projectId,
}) => {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteFile, setDeleteFile] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // ==========================================
  // SEARCH
  // ==========================================

  const filteredFiles = files.filter((file) => {
    const fileName = file.name || "";
    const uploadedBy = file.uploadedBy || "";

    return (
      fileName.toLowerCase().includes(search.toLowerCase()) ||
      uploadedBy.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ==========================================
  // FILE ICON
  // ==========================================

  const getFileIcon = (type) => {
    switch ((type || "").toUpperCase()) {
      case "PDF":
        return (
          <FileText
            size={19}
            className="text-red-400"
          />
        );

      case "PNG":
      case "JPG":
      case "JPEG":
      case "WEBP":
        return (
          <FileImage
            size={19}
            className="text-violet-400"
          />
        );

      case "XLSX":
      case "XLS":
      case "CSV":
        return (
          <FileSpreadsheet
            size={19}
            className="text-emerald-400"
          />
        );

      case "JS":
      case "JSX":
      case "TS":
      case "TSX":
      case "MD":
      case "JSON":
        return (
          <FileCode
            size={19}
            className="text-yellow-400"
          />
        );

      default:
        return (
          <FileText
            size={19}
            className="text-slate-400"
          />
        );
    }
  };

  // ==========================================
  // ICON BACKGROUND
  // ==========================================

  const getIconBackground = (type) => {
    switch ((type || "").toUpperCase()) {
      case "PDF":
        return "bg-red-500/10";

      case "PNG":
      case "JPG":
      case "JPEG":
      case "WEBP":
        return "bg-violet-500/10";

      case "XLSX":
      case "XLS":
      case "CSV":
        return "bg-emerald-500/10";

      case "JS":
      case "JSX":
      case "TS":
      case "TSX":
      case "MD":
      case "JSON":
        return "bg-yellow-500/10";

      default:
        return "bg-slate-800";
    }
  };

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // ==========================================
  // UPLOAD
  // ==========================================

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
        setUploading(true);

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
        `http://localhost:5000/api/workspaces/${workspaceId}/projects/${projectId}/files`,
        {
            method: "POST",
            credentials: "include",
            body: formData,
        }
        );

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.message || "Unable to upload file"
        );
        }

        // ---------------------------------------
        // Add uploaded file to UI
        // ---------------------------------------

        const uploadedFile = data.file;

        const extension =
        file.name
            .split(".")
            .pop()
            ?.toUpperCase() || "FILE";

        const newFile = {
        id: uploadedFile.id,

        name:
            uploadedFile.name ||
            file.name,

        type: extension,

        size: formatFileSize(file.size),

        uploadedBy:
            "You",

        uploadedAt:
            "Just now",

        url:
            uploadedFile.fileUrl,
        };

        setFiles((previous) => [
        newFile,
        ...previous,
        ]);

    } catch (error) {
        console.error(
        "File upload error:",
        error
        );

        alert(
        error.message ||
            "Unable to upload file"
        );

    } finally {
        setUploading(false);

        // Allow selecting same file again
        event.target.value = "";
    }
};

    const handleOpenFile = (file) => {
    if (!file.url) {
        alert("File URL is not available");
        return;
    }

    window.open(
        file.url,
        "_blank",
        "noopener,noreferrer"
    );
    };

    const handleDownload = (file) => {
    if (!file.url) {
        alert("Download URL is not available");
        return;
    }

    const link =
        document.createElement("a");

    link.href = file.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    link.click();

    setOpenMenuId(null);
    };

    const handleDelete = async () => {
        if (!deleteFile) return;

        try {
            setDeleting(true);

            const response = await fetch(
            `http://localhost:5000/api/workspaces/${workspaceId}/projects/${projectId}/files/${deleteFile.id}`,
            {
                method: "DELETE",
                credentials: "include",
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(
                data.message || "Unable to delete file"
            );
            }

            setFiles((previous) =>
            previous.filter(
                (file) => file.id !== deleteFile.id
            )
            );

            setDeleteFile(null);
            setOpenMenuId(null);
        } catch (error) {
            console.error(
            "Delete file error:",
            error
            );

            alert(
            error.message ||
                "Unable to delete file"
            );
        } finally {
            setDeleting(false);
        }
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        px-4
        backdrop-blur-sm
      "
    >
      {/* ========================================
          CLICK OUTSIDE
      ======================================== */}

      <button
        type="button"
        aria-label="Close files modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      {/* ========================================
          MAIN MODAL
      ======================================== */}

      <div
        className="
          relative
          z-10
          flex
          max-h-[85vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-800
          bg-[#080d1d]
          shadow-2xl
          shadow-black/50
        "
      >
        {/* ========================================
            HEADER
        ======================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-800
            px-6
            py-5
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-indigo-500/10
              "
            >
              <FolderOpen
                size={19}
                className="text-indigo-400"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Project Files
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-600">
                {projectName || "Project"} ·{" "}
                {files.length}{" "}
                {files.length === 1
                  ? "file"
                  : "files"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-slate-500
              transition
              hover:bg-slate-800
              hover:text-slate-200
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* ========================================
            TOOLBAR
        ======================================== */}

        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-slate-800
            px-6
            py-4
            sm:flex-row
          "
        >
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={15}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-600
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search project files..."
              className="
                w-full
                rounded-lg
                border
                border-slate-800
                bg-slate-950/60
                py-2.5
                pl-9
                pr-3
                text-xs
                text-slate-300
                outline-none
                placeholder:text-slate-600
                transition
                focus:border-indigo-500
              "
            />
          </div>

          {/* UPLOAD */}

          <label
            className="
              inline-flex
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-indigo-500
              px-4
              py-2.5
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-indigo-400
            "
          >
            {uploading ? (
              <div
                className="
                  h-3.5
                  w-3.5
                  animate-spin
                  rounded-full
                  border-2
                  border-white/30
                  border-t-white
                "
              />
            ) : (
              <Upload size={14} />
            )}

            {uploading
              ? "Uploading..."
              : "Upload File"}

            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* ========================================
            FILE COUNT
        ======================================== */}

        <div className="px-6 pt-4">
          <p className="text-[10px] text-slate-600">
            <span className="font-medium text-slate-400">
              {filteredFiles.length}
            </span>{" "}
            {filteredFiles.length === 1
              ? "file"
              : "files"}
          </p>
        </div>

        {/* ========================================
            FILE LIST
        ======================================== */}

        <div
          className="
            min-h-[250px]
            flex-1
            overflow-y-auto
            px-6
            py-3
          "
        >
          {filteredFiles.length === 0 ? (
            <div
              className="
                flex
                h-[250px]
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                "
              >
                <HardDrive
                  size={19}
                  className="text-slate-600"
                />
              </div>

              <p className="mt-3 text-xs font-medium text-slate-400">
                {search
                  ? "No files found"
                  : "No project files yet"}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {search
                  ? "Try another search."
                  : "Upload a file to get started."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleOpenFile(file)}
                  className="
                    group
                    flex
                    items-center
                    justify-between
                    gap-4
                    py-3.5
                  "
                >
                  {/* FILE INFO */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFile(file)
                    }
                    className="
                      flex
                      min-w-0
                      flex-1
                      items-center
                      gap-3
                      text-left
                    "
                  >
                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        ${getIconBackground(
                          file.type
                        )}
                      `}
                    >
                      {getFileIcon(file.type)}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-xs
                          font-semibold
                          text-slate-300
                          transition
                          group-hover:text-white
                        "
                      >
                        {file.name}
                      </p>

                      <div
                        className="
                          mt-1
                          flex
                          flex-wrap
                          items-center
                          gap-1.5
                        "
                      >
                        <span className="text-[9px] text-slate-600">
                          {file.uploadedBy ||
                            "Unknown"}
                        </span>

                        <span className="text-[9px] text-slate-700">
                          •
                        </span>

                        <span className="text-[9px] text-slate-600">
                          {file.size || "—"}
                        </span>

                        <span className="text-[9px] text-slate-700">
                          •
                        </span>

                        <span className="text-[9px] text-slate-600">
                          {file.uploadedAt ||
                            "Unknown"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* TYPE */}

                  <span
                    className="
                      hidden
                      rounded-full
                      bg-slate-800
                      px-2
                      py-1
                      text-[9px]
                      font-semibold
                      text-slate-500
                      sm:inline-flex
                    "
                  >
                    {file.type || "FILE"}
                  </span>

                  {/* ACTION */}

                  <div className="relative">
                    <button
                    onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(
                        openMenuId === file.id
                            ? null
                            : file.id
                        );
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {openMenuId === file.id && (
                        <div
                            onClick={(event) =>
                            event.stopPropagation()
                            }
                            className="absolute right-0 top-10 z-50 w-36 rounded-xl border border-slate-700 bg-slate-950 shadow-xl overflow-hidden"
                        >
                            <button
                            onClick={() =>
                                handleDownload(file)
                            }
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                            <Download size={15} />
                            Download
                            </button>

                            <button
                            onClick={(event) => {
                                event.stopPropagation();

                                setDeleteFile(file);
                                setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={15} />
                                Delete
                            </button>
                        </div>
                        )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================
            FOOTER
        ======================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-slate-800
            px-6
            py-3
          "
        >
          <p className="text-[9px] text-slate-700">
            Project members can upload and access files.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              border
              border-slate-800
              px-3
              py-2
              text-[10px]
              font-medium
              text-slate-400
              transition
              hover:bg-slate-800
            "
          >
            Close
          </button>
        </div>
      </div>

      {deleteFile && (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => {
            if (!deleting) {
                setDeleteFile(null);
            }
            }}
        >
            <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#080d1f] shadow-2xl"
            onClick={(event) =>
                event.stopPropagation()
            }
            >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6">
                <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <Trash2
                    size={20}
                    className="text-red-400"
                    />
                </div>

                <div>
                    <h3 className="text-base font-semibold text-white">
                    Delete file?
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                    This action cannot be undone.
                    </p>
                </div>
                </div>

                <button
                disabled={deleting}
                onClick={() =>
                    setDeleteFile(null)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                >
                <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <p className="truncate text-sm font-medium text-slate-200">
                    {deleteFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    {deleteFile.size}
                </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-400">
                Are you sure you want to permanently
                delete this file from the project?
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
                <button
                disabled={deleting}
                onClick={() =>
                    setDeleteFile(null)
                }
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                >
                Cancel
                </button>

                <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex min-w-[100px] items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                {deleting ? (
                    <>
                    <Loader2
                        size={15}
                        className="animate-spin"
                    />
                    Deleting...
                    </>
                ) : (
                    <>
                    <Trash2 size={15} />
                    Delete
                    </>
                )}
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default ProjectFilesModal;