import React, {
  useEffect,
  useState,
} from "react";

import {
  Search,
  FileText,
  Plus,
  MoreHorizontal,
  X,
  Loader2,
  Folder,
  BriefcaseBusiness,
  User,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getMyDocuments,
  getWorkspaceDocuments,
  getProjectDocuments,
  createDocument,
} from "../services/documentSevice";

import {
  getWorkspaces,
  getWorkspaceProjects,
} from "../services/dashboardService";


// =====================================================
// DOCUMENTS PAGE
// =====================================================

const Documents = () => {

  const navigate = useNavigate();

  const {
    workspaceId,
    projectId,
  } = useParams();


  // ===================================================
  // DETERMINE PAGE CONTEXT
  // ===================================================

  const isProjectDocuments =
    Boolean(workspaceId) &&
    Boolean(projectId);

  const isWorkspaceDocuments =
    Boolean(workspaceId) &&
    !projectId;

  const isGlobalDocuments =
    !workspaceId &&
    !projectId;


  // ===================================================
  // DATA
  // ===================================================

  const [documents, setDocuments] =
    useState([]);

  const [workspaces, setWorkspaces] =
    useState([]);

  const [projects, setProjects] =
    useState([]);


  // ===================================================
  // PAGE INFORMATION
  // ===================================================

  const [workspaceName, setWorkspaceName] =
    useState("");

  const [projectName, setProjectName] =
    useState("");


  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingContext, setLoadingContext] =
    useState(false);

  const [creating, setCreating] =
    useState(false);


  // ===================================================
  // ERROR
  // ===================================================

  const [error, setError] =
    useState("");


  // ===================================================
  // SEARCH
  // ===================================================

  const [searchQuery, setSearchQuery] =
    useState("");


  // ===================================================
  // CREATE MODAL
  // ===================================================

  const [showCreateModal, setShowCreateModal] =
    useState(false);


  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] = useState({
    title: "",
    content: "",
  });


  // ===================================================
  // GET ID
  // ===================================================

  const getId = (item) => {
    return item?._id || item?.id;
  };


  // ===================================================
  // FETCH GLOBAL DOCUMENTS
  // ===================================================

  const fetchGlobalDocuments = async () => {

    const data =
      await getMyDocuments();

    return Array.isArray(data)
      ? data
      : [];
  };


  // ===================================================
  // FETCH WORKSPACE DOCUMENTS
  // ===================================================

  const fetchWorkspaceDocumentsData =
    async () => {

      if (!workspaceId) {
        return [];
      }


      const data =
        await getWorkspaceDocuments(
          workspaceId
        );


      return Array.isArray(data)
        ? data
        : [];
    };


  // ===================================================
  // FETCH PROJECT DOCUMENTS
  // ===================================================

  const fetchProjectDocumentsData =
    async () => {

      if (
        !workspaceId ||
        !projectId
      ) {
        return [];
      }


      const data =
        await getProjectDocuments(
          workspaceId,
          projectId
        );


      return Array.isArray(data)
        ? data
        : [];
    };


  // ===================================================
  // FETCH DOCUMENTS
  // ===================================================

  const fetchDocuments = async () => {

    try {

      setLoading(true);

      setError("");


      let data = [];


      // -----------------------------------------------
      // GLOBAL
      // -----------------------------------------------

      if (isGlobalDocuments) {

        data =
          await fetchGlobalDocuments();

      }


      // -----------------------------------------------
      // WORKSPACE
      // -----------------------------------------------

      else if (
        isWorkspaceDocuments
      ) {

        data =
          await fetchWorkspaceDocumentsData();

      }


      // -----------------------------------------------
      // PROJECT
      // -----------------------------------------------

      else if (
        isProjectDocuments
      ) {

        data =
          await fetchProjectDocumentsData();

      }


      setDocuments(data);


    } catch (error) {

      console.error(
        "Fetch documents error:",
        error
      );


      setError(
        error.message ||
        "Unable to load documents"
      );


    } finally {

      setLoading(false);

    }
  };


  // ===================================================
  // LOAD WORKSPACE / PROJECT CONTEXT
  // ===================================================

  const loadContext =
    async () => {

      // -----------------------------------------------
      // GLOBAL PAGE
      // -----------------------------------------------

      if (isGlobalDocuments) {
        return;
      }


      try {

        setLoadingContext(true);


        // ---------------------------------------------
        // WORKSPACE CONTEXT
        // ---------------------------------------------

        const workspaces =
          await getWorkspaces();


        const currentWorkspace =
          workspaces.find(
            (workspace) =>
              getId(workspace) ===
              workspaceId
          );


        if (currentWorkspace) {

          setWorkspaceName(
            currentWorkspace.name
          );

        }


        // ---------------------------------------------
        // PROJECT CONTEXT
        // ---------------------------------------------

        if (isProjectDocuments) {

          const projectList =
            await getWorkspaceProjects(
              workspaceId
            );


          setProjects(
            Array.isArray(projectList)
              ? projectList
              : []
          );


          const currentProject =
            projectList.find(
              (project) =>
                getId(project) ===
                projectId
            );


          if (currentProject) {

            setProjectName(
              currentProject.name
            );

          }

        }

      } catch (error) {

        console.error(
          "Load document context error:",
          error
        );

      } finally {

        setLoadingContext(false);

      }
    };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    fetchDocuments();

    loadContext();

  }, [
    workspaceId,
    projectId,
  ]);


  // ===================================================
  // OPEN CREATE MODAL
  // ===================================================

  const openCreateModal = () => {

    setForm({
      title: "",
      content: "",
    });

    setShowCreateModal(true);

  };


  // ===================================================
  // CLOSE CREATE MODAL
  // ===================================================

  const closeCreateModal = () => {

    if (creating) {
      return;
    }

    setShowCreateModal(false);

  };


  // ===================================================
  // CREATE DOCUMENT
  // ===================================================

  const handleCreateDocument =
    async (event) => {

      event.preventDefault();


      if (!form.title.trim()) {

        alert(
          "Document title is required"
        );

        return;
      }


      try {

        setCreating(true);


        // ---------------------------------------------
        // PAYLOAD
        // ---------------------------------------------

        const payload = {
          title:
            form.title.trim(),

          content:
            form.content,
        };


        // ---------------------------------------------
        // WORKSPACE DOCUMENT
        // ---------------------------------------------

        if (
          isWorkspaceDocuments
        ) {

          payload.workspaceId =
            workspaceId;

        }


        // ---------------------------------------------
        // PROJECT DOCUMENT
        // ---------------------------------------------

        if (
          isProjectDocuments
        ) {

          payload.projectId =
            projectId;

        }


        // ---------------------------------------------
        // GLOBAL PAGE
        // ---------------------------------------------
        // On /documents we create a personal
        // document by default.
        //
        // We intentionally don't show
        // workspace/project selectors here.
        //
        // Contextual creation happens from
        // workspace/project pages.

        const document =
          await createDocument(
            payload
          );


        // ---------------------------------------------
        // ADD TO LIST
        // ---------------------------------------------

        if (document) {

          setDocuments(
            (previous) => [
              document,
              ...previous,
            ]
          );

        }


        // ---------------------------------------------
        // RESET
        // ---------------------------------------------

        setForm({
          title: "",
          content: "",
        });


        setShowCreateModal(false);


      } catch (error) {

        console.error(
          "Create document error:",
          error
        );


        alert(
          error.message ||
          "Unable to create document"
        );


      } finally {

        setCreating(false);

      }
    };


  // ===================================================
  // FILTER DOCUMENTS
  // ===================================================

  const filteredDocuments =
    documents.filter(
      (document) => {

        const query =
          searchQuery
            .trim()
            .toLowerCase();


        if (!query) {
          return true;
        }


        return (
          document.title
            ?.toLowerCase()
            .includes(query) ||

          document.workspace?.name
            ?.toLowerCase()
            .includes(query) ||

          document.project?.name
            ?.toLowerCase()
            .includes(query)
        );

      }
    );


  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "Unknown";
    }


    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

  };


  // ===================================================
  // DOCUMENT SCOPE
  // ===================================================

  const getDocumentScope = (
    document
  ) => {

    if (document.project) {

      return {
        label:
          document.project.name,

        type:
          "Project",

        icon:
          BriefcaseBusiness,
      };

    }


    if (document.workspace) {

      return {
        label:
          document.workspace.name,

        type:
          "Workspace",

        icon:
          Folder,
      };

    }


    return {
      label:
        "Personal",

      type:
        "Personal",

      icon:
        User,
    };

  };


  // ===================================================
  // PAGE TITLE
  // ===================================================

  const pageTitle =
    isProjectDocuments
      ? projectName || "Project Documents"
      : isWorkspaceDocuments
      ? workspaceName || "Workspace Documents"
      : "Documents";


  // ===================================================
  // PAGE DESCRIPTION
  // ===================================================

  const pageDescription =
    isProjectDocuments
      ? "Documents belonging to this project."
      : isWorkspaceDocuments
      ? "Shared documents belonging to this workspace."
      : "Create, organize and manage your documents.";


  // ===================================================
  // CREATE MODAL TITLE
  // ===================================================

  const createModalTitle =
    isProjectDocuments
      ? "Create Project Document"
      : isWorkspaceDocuments
      ? "Create Workspace Document"
      : "Create Document";


  // ===================================================
  // CREATE MODAL DESCRIPTION
  // ===================================================

  const createModalDescription =
    isProjectDocuments
      ? `Create a new document for ${
          projectName || "this project"
        }.`
      : isWorkspaceDocuments
      ? `Create a shared document for ${
          workspaceName || "this workspace"
        }.`
      : "Create a new personal document.";


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div className="min-h-full bg-[#020617] px-8 py-8">

        <div className="mx-auto max-w-[1500px]">

          <div className="animate-pulse">

            <div className="h-8 w-48 rounded bg-slate-800" />

            <div className="mt-3 h-4 w-80 rounded bg-slate-800" />

            <div className="mt-8 h-11 rounded-xl bg-slate-900" />

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">

              {[1, 2, 3, 4].map(
                (item) => (

                  <div
                    key={item}
                    className="flex items-center gap-4 border-b border-slate-800 px-5 py-5"
                  >

                    <div className="h-10 w-10 rounded-xl bg-slate-800" />

                    <div className="flex-1">

                      <div className="h-4 w-60 rounded bg-slate-800" />

                      <div className="mt-2 h-3 w-40 rounded bg-slate-800" />

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>
    );

  }


  // ===================================================
  // ERROR
  // ===================================================

  if (error) {

    return (
      <div className="min-h-full bg-[#020617] px-8 py-8">

        <div className="mx-auto max-w-[1400px]">

          <div className="flex min-h-[500px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">

                <AlertCircle
                  size={26}
                  className="text-red-400"
                />

              </div>


              <h3 className="mt-5 text-lg font-semibold text-white">
                Unable to load documents
              </h3>


              <p className="mt-2 text-sm text-slate-500">
                {error}
              </p>


              <button
                onClick={
                  fetchDocuments
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
              >

                <RefreshCw
                  size={15}
                />

                Try again

              </button>

            </div>

          </div>

        </div>

      </div>
    );

  }


  // ===================================================
  // MAIN
  // ===================================================

  return (

    <div className="min-h-full bg-[#020617] px-8 py-8">

      <div className="mx-auto max-w-[1500px]">


        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex items-start justify-between">

          <div className="flex items-center gap-3">


            {/* BACK BUTTON FOR CONTEXTUAL PAGES */}

            {!isGlobalDocuments && (

              <button
                onClick={() =>
                  navigate(
                    isProjectDocuments
                      ? `/workspaces/${workspaceId}/projects/${projectId}`
                      : `/workspaces/${workspaceId}`
                  )
                }
                className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 transition hover:bg-slate-900 hover:text-white"
                title="Go back"
              >

                <ArrowLeft
                  size={18}
                />

              </button>

            )}


            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">

              <FileText
                size={22}
                className="text-indigo-400"
              />

            </div>


            <div>

              <h1 className="text-2xl font-semibold text-white">
                {pageTitle}
              </h1>


              <p className="mt-1 text-sm text-slate-500">
                {pageDescription}
              </p>

            </div>

          </div>


          <button
            onClick={
              openCreateModal
            }
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
          >

            <Plus size={17} />

            New Document

          </button>

        </div>


        {/* ==========================================
            CONTEXT BADGE
        ========================================== */}

        {!isGlobalDocuments && (

          <div className="mt-5 flex items-center gap-2">

            {isProjectDocuments ? (

              <>
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">

                  <Folder
                    size={14}
                    className="text-slate-500"
                  />

                  <span className="text-xs text-slate-500">
                    {workspaceName ||
                      "Workspace"}
                  </span>

                </div>


                <span className="text-slate-700">
                  /
                </span>


                <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">

                  <BriefcaseBusiness
                    size={14}
                    className="text-indigo-400"
                  />

                  <span className="text-xs text-indigo-300">
                    {projectName ||
                      "Project"}
                  </span>

                </div>

              </>

            ) : (

              <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">

                <Folder
                  size={14}
                  className="text-indigo-400"
                />

                <span className="text-xs text-indigo-300">
                  {workspaceName ||
                    "Workspace"}
                </span>

              </div>

            )}

          </div>

        )}


        {/* ==========================================
            SEARCH
        ========================================== */}

        <div className="mt-7 flex items-center gap-3">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />


            <input
              type="text"
              value={
                searchQuery
              }
              onChange={(
                event
              ) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search documents..."
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/60"
            />

          </div>


          <button
            onClick={
              fetchDocuments
            }
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >

            <RefreshCw
              size={15}
            />

            Refresh

          </button>

        </div>


        {/* ==========================================
            COUNT
        ========================================== */}

        <div className="mt-6">

          <p className="text-sm text-slate-500">

            {filteredDocuments.length}{" "}

            {
              filteredDocuments.length === 1
                ? "document"
                : "documents"
            }

          </p>

        </div>


        {/* ==========================================
            DOCUMENT TABLE
        ========================================== */}

        <div className="mt-3 overflow-visible rounded-2xl border border-slate-800 bg-slate-950/40">

          {filteredDocuments.length === 0 ? (

            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">

                <FileText
                  size={25}
                  className="text-slate-600"
                />

              </div>


              <h3 className="mt-5 text-base font-semibold text-white">

                {documents.length === 0
                  ? "No documents yet"
                  : "No documents found"}

              </h3>


              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">

                {documents.length === 0
                  ? "Create your first document to get started."
                  : "Try changing your search query."}

              </p>


              {documents.length === 0 && (

                <button
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
                >

                  <Plus size={16} />

                  Create Document

                </button>

              )}

            </div>

          ) : (

            <div>


              {/* TABLE HEADER */}

              <div className="hidden grid-cols-[minmax(350px,2fr)_1.3fr_1fr_120px_50px] gap-4 border-b border-slate-800 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-600 md:grid">

                <span>
                  Document
                </span>

                <span>
                  Location
                </span>

                <span>
                  Status
                </span>

                <span>
                  Updated
                </span>

                <span />

              </div>


              {/* DOCUMENT ROWS */}

              {filteredDocuments.map(
                (document) => {

                  const scope =
                    getDocumentScope(
                      document
                    );


                  const ScopeIcon =
                    scope.icon;


                  const documentId =
                    getId(document);


                  return (

                    <div
                      key={
                        documentId
                      }
                      className="group grid cursor-pointer grid-cols-1 gap-3 border-b border-slate-800/70 px-5 py-4 transition last:border-b-0 hover:bg-slate-900/40 md:grid-cols-[minmax(350px,2fr)_1.3fr_1fr_120px_50px] md:items-center md:gap-4"
                      onClick={() =>
                        navigate(
                          `/documents/${documentId}`
                        )
                      }
                    >


                      {/* DOCUMENT */}

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">

                          <FileText
                            size={20}
                            className="text-indigo-400"
                          />

                        </div>


                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white">
                            {document.title}
                          </p>


                          <p className="mt-1 truncate text-xs text-slate-600">

                            Created{" "}

                            {formatDate(
                              document.createdAt
                            )}

                          </p>

                        </div>

                      </div>


                      {/* LOCATION */}

                      <div className="flex min-w-0 items-center gap-2">

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">

                          <ScopeIcon
                            size={14}
                            className="text-slate-500"
                          />

                        </div>


                        <div className="min-w-0">

                          <p className="truncate text-sm text-slate-400">
                            {scope.label}
                          </p>


                          <p className="text-xs text-slate-600">
                            {scope.type}
                          </p>

                        </div>

                      </div>


                      {/* STATUS */}

                      <div>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            document.status ===
                            "Published"

                              ? "bg-emerald-500/10 text-emerald-400"

                              : document.status ===
                                "Archived"

                              ? "bg-slate-800 text-slate-500"

                              : "bg-indigo-500/10 text-indigo-400"
                          }`}
                        >

                          {
                            document.status ||
                            "Draft"
                          }

                        </span>

                      </div>


                      {/* UPDATED */}

                      <div className="text-sm text-slate-500">

                        {formatDate(
                          document.updatedAt
                        )}

                      </div>


                      {/* MENU */}

                      <div className="flex justify-end">

                        <button
                          onClick={(
                            event
                          ) => {

                            event.stopPropagation();

                          }}
                          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-white md:opacity-0 md:group-hover:opacity-100"
                        >

                          <MoreHorizontal
                            size={18}
                          />

                        </button>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          CREATE DOCUMENT MODAL
      ================================================= */}

      {showCreateModal && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={
            closeCreateModal
          }
        >

          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#080d1f] shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >


            {/* =========================================
                MODAL HEADER
            ========================================= */}

            <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">

                  <FileText
                    size={20}
                    className="text-indigo-400"
                  />

                </div>


                <div>

                  <h2 className="text-base font-semibold text-white">
                    {createModalTitle}
                  </h2>


                  <p className="mt-1 text-xs text-slate-500">
                    {createModalDescription}
                  </p>

                </div>

              </div>


              <button
                disabled={
                  creating
                }
                onClick={
                  closeCreateModal
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >

                <X size={18} />

              </button>

            </div>


            {/* =========================================
                FORM
            ========================================= */}

            <form
              onSubmit={
                handleCreateDocument
              }
              className="space-y-5 px-6 py-6"
            >


              {/* =======================================
                  CONTEXT
              ======================================= */}

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">

                <div className="flex items-center gap-3">

                  {isProjectDocuments ? (

                    <BriefcaseBusiness
                      size={17}
                      className="text-indigo-400"
                    />

                  ) : isWorkspaceDocuments ? (

                    <Folder
                      size={17}
                      className="text-indigo-400"
                    />

                  ) : (

                    <User
                      size={17}
                      className="text-indigo-400"
                    />

                  )}


                  <div className="min-w-0">

                    <p className="text-xs text-slate-500">
                      Document location
                    </p>


                    <p className="mt-0.5 truncate text-sm font-medium text-slate-300">

                      {isProjectDocuments
                        ? projectName ||
                          "Project"

                        : isWorkspaceDocuments
                        ? workspaceName ||
                          "Workspace"

                        : "Personal"}

                    </p>

                  </div>

                </div>

              </div>


              {/* =======================================
                  TITLE
              ======================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Document title
                </label>


                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Project Requirements"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/60"
                />

              </div>


              {/* =======================================
                  CONTENT
              ======================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Content
                </label>


                <textarea
                  value={
                    form.content
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        content:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Start writing your document..."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/60"
                />

              </div>


              {/* =======================================
                  ACTIONS
              ======================================= */}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  disabled={
                    creating
                  }
                  onClick={
                    closeCreateModal
                  }
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  disabled={
                    creating ||
                    !form.title.trim()
                  }
                  className="flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {creating ? (

                    <>

                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                      Creating...

                    </>

                  ) : (

                    <>

                      <Plus size={15} />

                      Create Document

                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};


export default Documents;