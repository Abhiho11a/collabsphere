import {
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

const FileUpload = ({
  onUpload,
  uploading = false,
}) => {
  const inputRef =
    useRef(null);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);


  // ==========================================
  // SELECT FILE
  // ==========================================

  const handleFile = async (
    file
  ) => {
    if (!file || uploading) {
      return;
    }

    try {
      await onUpload(file);
    } catch {
      // Error is handled by useFiles
    }
  };


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    handleFile(file);

    event.target.value = "";
  };


  // ==========================================
  // DROP
  // ==========================================

  const handleDrop = (
    event
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    handleFile(file);
  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();

        if (!uploading) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() =>
        setIsDragging(false)
      }
      onDrop={handleDrop}
      className={`
        rounded-xl
        border
        border-dashed
        p-6
        transition

        ${
          isDragging
            ? `
              border-indigo-500/60
              bg-indigo-500/5
            `
            : `
              border-slate-800
              bg-slate-900/20
              hover:border-slate-700
            `
        }
      `}
    >
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          text-center
        "
      >
        {/* ICON */}

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-indigo-500/10
            text-indigo-400
          "
        >
          {uploading ? (
            <Loader2
              size={20}
              className="animate-spin"
            />
          ) : (
            <FileUp size={20} />
          )}
        </div>


        {/* TEXT */}

        <h3
          className="
            mt-3
            text-sm
            font-medium
            text-slate-200
          "
        >
          {uploading
            ? "Uploading file..."
            : "Upload a file"}
        </h3>

        <p
          className="
            mt-1
            text-xs
            text-slate-500
          "
        >
          Drag and drop or select
          a file from your device
        </p>


        {/* BUTTON */}

        <button
          type="button"
          disabled={uploading}
          onClick={() =>
            inputRef.current?.click()
          }
          className="
            mt-4
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-indigo-500
            px-3.5
            py-2
            text-xs
            font-semibold
            text-white
            transition
            hover:bg-indigo-400
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <Upload size={14} />

          Select file
        </button>


        {/* HIDDEN INPUT */}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default FileUpload;