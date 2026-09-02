import {
  ArrowLeft,
  FolderKanban,
  FolderOpen,
  Loader2,
  RefreshCw,
  Search,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useFiles from "../hooks/useFiles";

import FileGrid from "../components/files/FileGrid";
import FileUpload from "../components/files/FileUpload";
import FileEmptyState from "../components/files/FileEmptyState";


// ==========================================
// FILES PAGE
// ==========================================

const Files = () => {

  const navigate = useNavigate();

  const {
    workspaceId,
    projectId,
  } = useParams();

  const [
    organizationId,
    setOrganizationId,
  ] = useState(
    () =>
      localStorage.getItem(
        "currentOrganizationId"
      ) || ""
  );


  // ==========================================
  // DETERMINE SCOPE
  // ==========================================

  const scope =
    projectId
      ? "project"
      : workspaceId
      ? "workspace"
      : "organization";


  // ==========================================
  // FILES HOOK
  // ==========================================

  const {
    files,
    loading,
    uploading,
    deleting,
    error,
    refresh,
    uploadFile,
    deleteFile,
  } = useFiles({
    scope,
    workspaceId,
    projectId,
  });


  // ==========================================
  // LOCAL STATE
  // ==========================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  const [
    showUpload,
    setShowUpload,
  ] = useState(false);


  const uploadRef =
    useRef(null);


  // ==========================================
  // FILTER FILES
  // ==========================================

  const filteredFiles =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      if (!query) {
        return files;
      }


      return files.filter(
        (file) => {

          const name =
            file?.name ||
            file?.originalName ||
            "";


          const workspaceName =
            file?.source
              ?.workspace
              ?.name ||
            "";


          const projectName =
            file?.source
              ?.project
              ?.name ||
            "";


          return (
            name
              .toLowerCase()
              .includes(query) ||

            workspaceName
              .toLowerCase()
              .includes(query) ||

            projectName
              .toLowerCase()
              .includes(query)
          );
        }
      );

    }, [
      files,
      searchQuery,
    ]);


  // ==========================================
  // PAGE TITLE
  // ==========================================

  const pageTitle =
    scope === "project"
      ? "Project Files"
      : scope === "workspace"
      ? "Workspace Files"
      : "Files";


  const pageDescription =
    scope === "project"
      ? "Files shared within this project."
      : scope === "workspace"
      ? "Files shared across this workspace."
      : "Upload organization files and access files from your permitted workspaces and projects.";


  // ==========================================
  // UPLOAD
  // ==========================================

  const handleUpload =
    async (file) => {

      try {

        await uploadFile(file);

        setShowUpload(false);

      } catch {
        // useFiles handles error
      }

    };


  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete =
    async (fileId) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this file?"
        );


      if (!confirmed) {
        return;
      }


      try {

        await deleteFile(fileId);

      } catch {
        // useFiles handles error
      }

    };


  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {

    if (scope === "project") {

      navigate(
        `/workspaces/${workspaceId}/projects/${projectId}`
      );

      return;
    }


    if (scope === "workspace") {

      navigate(
        `/workspaces/${workspaceId}`
      );

      return;
    }


    navigate("/dashboard");

  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className="
        min-h-[calc(100vh-4rem)]
        bg-slate-950
        px-5
        py-6
        sm:px-8
        lg:px-10
      "
    >

      {/* ======================================
          HEADER
      ======================================= */}

      <div
        className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        {/* LEFT */}

        <div
          className="
            flex
            items-start
            gap-3
          "
        >

          {/* BACK */}

          {(
            scope === "organization" ||
            scope === "workspace" ||
            scope === "project"
          ) && (
            <button
              type="button"
              onClick={handleBack}
              className="
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-slate-800
                bg-slate-900
                text-slate-400
                transition
                hover:border-slate-700
                hover:bg-slate-800
                hover:text-slate-200
              "
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}


          {/* ICON */}

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-indigo-500/10
              text-indigo-400
            "
          >

            {scope === "project" ? (
              <FolderKanban size={21} />
            ) : scope === "workspace" ? (
              <Users size={21} />
            ) : (
              <FolderOpen size={21} />
            )}

          </div>


          {/* TITLE */}

          <div className="min-w-0">

            <h1
              className="
                text-xl
                font-semibold
                tracking-tight
                text-white
              "
            >
              {pageTitle}
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              {pageDescription}
            </p>

          </div>

        </div>


        {/* ACTIONS */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          {/* REFRESH */}

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-slate-800
              bg-slate-900
              px-3
              py-2
              text-xs
              font-medium
              text-slate-400
              transition
              hover:border-slate-700
              hover:bg-slate-800
              hover:text-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            <RefreshCw
              size={14}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>


          {/* UPLOAD */}

          {(
            scope === "organization" ||
            scope === "workspace" ||
            scope === "project"
          ) && (
            <button
              type="button"
              onClick={() =>
                setShowUpload(
                  (value) => !value
                )
              }
              className="
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
              "
            >

              <UploadCloud size={14} />

              Upload file

            </button>
          )}

        </div>

      </div>


      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div
          className="
            mt-6
            flex
            items-center
            justify-between
            gap-4
            rounded-lg
            border
            border-red-500/20
            bg-red-500/5
            px-4
            py-3
          "
        >

          <p
            className="
              text-xs
              text-red-400
            "
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              refresh();
            }}
            className="
              shrink-0
              text-xs
              font-medium
              text-red-300
              hover:text-red-200
            "
          >
            Try again
          </button>

        </div>
      )}


      {/* ======================================
          UPLOAD PANEL
      ======================================= */}

      {showUpload && (
          <div className="mt-6">

            <div
              className="
                relative
                rounded-xl
                border
                border-slate-800
                bg-slate-900/30
                p-4
              "
            >

              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setShowUpload(false)
                }
                className="
                  absolute
                  right-3
                  top-3
                  rounded-md
                  p-1.5
                  text-slate-600
                  transition
                  hover:bg-slate-800
                  hover:text-slate-300
                "
              >
                <X size={15} />
              </button>


              <FileUpload
                onUpload={
                  handleUpload
                }
                uploading={
                  uploading
                }
              />

            </div>

          </div>
        )}


      {/* ======================================
          TOOLBAR
      ======================================= */}

      <div
        className="
          mt-7
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        {/* SEARCH */}

        <div
          className="
            relative
            w-full
            sm:max-w-sm
          "
        >

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
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search files..."
            className="
              w-full
              rounded-lg
              border
              border-slate-800
              bg-slate-900/50
              py-2.5
              pl-9
              pr-3
              text-xs
              text-slate-200
              outline-none
              placeholder:text-slate-600
              focus:border-indigo-500/50
              focus:ring-1
              focus:ring-indigo-500/20
            "
          />

        </div>


        {/* COUNT */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <span
            className="
              text-xs
              text-slate-600
            "
          >
            {filteredFiles.length}{" "}
            {filteredFiles.length === 1
              ? "file"
              : "files"}
          </span>

        </div>

      </div>


      {/* ======================================
          CONTENT
      ======================================= */}

      <div className="mt-5">

        {/* LOADING */}

        {loading ? (
          <div
            className="
              flex
              min-h-60
              items-center
              justify-center
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >

              <Loader2
                size={16}
                className="animate-spin"
              />

              Loading files...

            </div>

          </div>
        ) : filteredFiles.length > 0 ? (

          <FileGrid
            files={filteredFiles}
            onDelete={
              handleDelete
            }
            canDelete={
              scope !== "global"
            }
          />

        ) : searchQuery ? (

          <FileEmptyState
            title="No matching files"
            description={`No files match "${searchQuery}". Try another search.`}
          />

        ) : (

          <FileEmptyState
            title={
              scope === "project"
                ? "No project files"
                : scope === "workspace"
                ? "No workspace files"
                : "No files yet"
            }
            description={
              scope === "project"
                ? "Files uploaded to this project will appear here."
                : scope === "workspace"
                ? "Files shared across this workspace will appear here."
                : "Files from your accessible workspaces and projects will appear here."
            }
            showUpload={
              true
            }
            onUpload={() =>
              setShowUpload(true)
            }
          />

        )}

      </div>


      {/* ======================================
          DELETE INDICATOR
      ======================================= */}

      {deleting && (
        <div
          className="
            fixed
            bottom-5
            right-5
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-slate-800
            bg-slate-900
            px-3
            py-2
            text-xs
            text-slate-400
            shadow-xl
          "
        >

          <Loader2
            size={14}
            className="animate-spin"
          />

          Deleting file...

        </div>
      )}

    </div>
  );
};


export default Files;