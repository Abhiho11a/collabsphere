import {
  Download,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

const FileCard = ({
  file,
  onDelete,
  canDelete = false,
}) => {
  const fileName =
    file?.name ||
    file?.originalName ||
    "Unnamed file";

  const mimeType =
    file?.mimeType || "";

  const fileUrl =
    file?.fileUrl ||
    file?.url ||
    "#";

  // ==========================================
  // FILE TYPE
  // ==========================================

  const getFileType = () => {
    if (mimeType.startsWith("image/")) {
      return "image";
    }

    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text") ||
      mimeType.includes("word")
    ) {
      return "document";
    }

    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      return "spreadsheet";
    }

    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("archive")
    ) {
      return "archive";
    }

    if (
      mimeType.includes("javascript") ||
      mimeType.includes("json") ||
      mimeType.includes("html") ||
      mimeType.includes("css")
    ) {
      return "code";
    }

    return "file";
  };

  const type =
    getFileType();

  // ==========================================
  // ICON
  // ==========================================

  const iconMap = {
    image: {
      icon: FileImage,
      className:
        "bg-purple-500/10 text-purple-400",
    },

    document: {
      icon: FileText,
      className:
        "bg-indigo-500/10 text-indigo-400",
    },

    spreadsheet: {
      icon: FileSpreadsheet,
      className:
        "bg-emerald-500/10 text-emerald-400",
    },

    archive: {
      icon: FileArchive,
      className:
        "bg-amber-500/10 text-amber-400",
    },

    code: {
      icon: FileCode2,
      className:
        "bg-cyan-500/10 text-cyan-400",
    },

    file: {
      icon: File,
      className:
        "bg-slate-800 text-slate-400",
    },
  };

  const {
    icon: FileIcon,
    className: iconClass,
  } = iconMap[type];

  // ==========================================
  // FILE SIZE
  // ==========================================

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    if (
      bytes <
      1024 * 1024 * 1024
    ) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  };

  // ==========================================
  // DATE
  // ==========================================

  const formattedDate =
    file?.createdAt
      ? new Date(
          file.createdAt
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        )
      : "Unknown date";

  // ==========================================
  // SOURCE
  // ==========================================

  const source =
    file?.source;

  const isProjectFile =
    source?.type === "project";

  const sourceName =
    isProjectFile
      ? source?.project?.name
      : source?.workspace?.name;

  // ==========================================
  // DOWNLOAD
  // ==========================================

  const handleDownload = () => {
    if (
      !fileUrl ||
      fileUrl === "#"
    ) {
      return;
    }

    window.open(
      fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = () => {
    if (
      !canDelete ||
      !onDelete
    ) {
      return;
    }

    onDelete(
      file?._id ||
      file?.id
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className="
        group
        rounded-xl
        border
        border-slate-800
        bg-slate-900/40
        p-4
        transition-all
        duration-200
        hover:border-slate-700
        hover:bg-slate-900/70
        hover:shadow-lg
        hover:shadow-black/10
      "
    >
      {/* ======================================
          TOP
      ======================================= */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          {/* ICON */}

          <div
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              ${iconClass}
            `}
          >
            <FileIcon size={19} />
          </div>

          {/* NAME */}

          <div className="min-w-0">
            <h3
              className="
                truncate
                text-sm
                font-medium
                text-slate-200
              "
              title={fileName}
            >
              {fileName}
            </h3>

            <p
              className="
                mt-1
                truncate
                text-[11px]
                text-slate-500
              "
            >
              {formatSize(file?.size)}
            </p>
          </div>
        </div>

        {/* MENU */}

        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="
              rounded-md
              p-1.5
              text-slate-600
              opacity-0
              transition
              group-hover:opacity-100
              hover:bg-red-500/10
              hover:text-red-400
            "
            title="Delete file"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* ======================================
          SOURCE
      ======================================= */}

      {sourceName && (
        <div
          className="
            mt-4
            flex
            items-center
            gap-1.5
          "
        >
          <span
            className="
              rounded-md
              bg-slate-800
              px-2
              py-1
              text-[10px]
              font-medium
              text-slate-400
            "
          >
            {isProjectFile
              ? "Project"
              : "Workspace"}
          </span>

          <span
            className="
              truncate
              text-[11px]
              text-slate-500
            "
          >
            {sourceName}
          </span>
        </div>
      )}

      {/* ======================================
          FOOTER
      ======================================= */}

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          pt-3
        "
      >
        <span
          className="
            text-[10px]
            text-slate-600
          "
        >
          {formattedDate}
        </span>

        <button
          type="button"
          onClick={handleDownload}
          disabled={
            !fileUrl ||
            fileUrl === "#"
          }
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-md
            px-2
            py-1
            text-[11px]
            font-medium
            text-indigo-400
            transition
            hover:bg-indigo-500/10
            hover:text-indigo-300
            disabled:cursor-not-allowed
            disabled:text-slate-700
          "
        >
          <Download size={13} />
          Open
        </button>
      </div>
    </div>
  );
};

export default FileCard;