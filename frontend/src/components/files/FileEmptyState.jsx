import {
  File,
  Upload,
} from "lucide-react";

const FileEmptyState = ({
  title = "No files yet",
  description =
    "Files uploaded to this location will appear here.",
  showUpload = false,
  onUpload,
}) => {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        border-slate-800
        bg-slate-900/20
        px-6
        py-14
        text-center
      "
    >
      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          bg-slate-800
          text-slate-500
        "
      >
        <File size={21} />
      </div>

      <h3
        className="
          mt-4
          text-sm
          font-medium
          text-slate-300
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1.5
          max-w-sm
          text-xs
          leading-5
          text-slate-500
        "
      >
        {description}
      </p>

      {showUpload && (
        <button
          type="button"
          onClick={onUpload}
          className="
            mt-4
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-slate-700
            px-3.5
            py-2
            text-xs
            font-medium
            text-slate-300
            transition
            hover:border-slate-600
            hover:bg-slate-800
            hover:text-white
          "
        >
          <Upload size={14} />
          Upload file
        </button>
      )}
    </div>
  );
};

export default FileEmptyState;