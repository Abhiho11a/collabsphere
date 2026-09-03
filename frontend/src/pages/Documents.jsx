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
  Building2,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

import DOMPurify from "dompurify";

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

  const [
    organizationId,
    setOrganizationId,
  ] = useState(
    () =>
      localStorage.getItem(
        "currentOrganizationId"
      ) || ""
  );


  const [
    organizationRole,
    setOrganizationRole,
    ] = useState(
    () =>
        localStorage.getItem(
        "currentOrganizationRole"
        ) || ""
    );

  const isOrganizationAdmin= () => {return organizationRole === "organization_admin";}


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
  // DOCUMENT ACTION MENU
  // ===================================================

  const [
    openMenuDocumentId,
    setOpenMenuDocumentId,
  ] = useState(null);


  // ===================================================
  // DOCUMENT PREVIEW
  // ===================================================

  const [
    previewDocument,
    setPreviewDocument,
  ] = useState(null);


  // ===================================================
  // DELETE DOCUMENT
  // ===================================================

  const [
    deletingDocumentId,
    setDeletingDocumentId,
  ] = useState(null);


  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] = useState({
    title: "",
    content: "",

    inheritViewAccess: true,
    inheritEditAccess: false,

    viewers: [],
    editors: [],
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
    const currentOrganizationId =
      localStorage.getItem(
        "currentOrganizationId"
      );

    if (!currentOrganizationId) {
      return [];
    }

    const data =
      await getMyDocuments(
        currentOrganizationId
      );

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

      // ======================================
      // GLOBAL DOCUMENTS
      // CURRENT ORGANIZATION
      // ======================================

      if (isGlobalDocuments) {
        data = await fetchGlobalDocuments();
      }

      // ======================================
      // WORKSPACE DOCUMENTS
      // EXISTING BEHAVIOR
      // ======================================

      else if (isWorkspaceDocuments) {

        data =
          await fetchWorkspaceDocumentsData();

      }

      // ======================================
      // PROJECT DOCUMENTS
      // EXISTING BEHAVIOR
      // ======================================

      else if (isProjectDocuments) {

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
        error?.message ||
          "Unable to load documents"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    const handleOrganizationChanged =
      () => {

        setDocuments([]);

        fetchDocuments();

      };

    window.addEventListener(
      "organizationChanged",
      handleOrganizationChanged
    );

    return () => {

      window.removeEventListener(
        "organizationChanged",
        handleOrganizationChanged
      );

    };

  }, [organizationId]);


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

      inheritViewAccess: true,
      inheritEditAccess: false,

      viewers: [],
      editors: [],
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

  const handleCreateDocument = async (event) => {
  event.preventDefault();

  if (!form.title.trim()) {
    return;
  }

  try {
    setCreating(true);
    setError("");

    const currentOrganizationId =
      localStorage.getItem(
        "currentOrganizationId"
      );

    if (!currentOrganizationId) {
      throw new Error(
        "Please select an organization first"
      );
    }

    const body = {
      title: form.title.trim(),
      content: form.content,
    };

    // ==========================================
    // ORGANIZATION DOCUMENT
    // ==========================================

    if (isGlobalDocuments) {
      body.organizationId =
        currentOrganizationId;

      body.scope = "organization";
    }

    // ==========================================
    // WORKSPACE DOCUMENT
    // ==========================================

    if (isWorkspaceDocuments) {
      if (!workspaceId) {
        throw new Error(
          "Workspace ID is required"
        );
      }

      body.workspaceId = workspaceId;
      body.scope = "workspace";
    }

    // ==========================================
    // PROJECT DOCUMENT
    // ==========================================

    if (isProjectDocuments) {
      if (!projectId) {
        throw new Error(
          "Project ID is required"
        );
      }

      body.projectId = projectId;
      body.scope = "project";
    }

    const response = await fetch(
      `http://localhost:5000/api/documents`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to create document"
      );
    }

    if (data.document) {
      setDocuments((previous) => [
        data.document,
        ...previous,
      ]);
    }

    setForm({
      title: "",
      content: "",
    });

    setShowCreateModal(false);

    // Refresh from backend to guarantee
    // the list matches database state.
    await fetchDocuments();
  } catch (error) {
    console.error(
      "Create document error:",
      error
    );

    setError(
      error?.message ||
        "Unable to create document"
    );
  } finally {
    setCreating(false);
  }
};

// ===================================================
// DELETE DOCUMENT
// ===================================================

const handleDeleteDocument = async (document) => {
  if (!document) {
    return;
  }

  const documentId = getId(document);

  if (!documentId) {
    setError("Invalid document ID");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${document.title}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingDocumentId(documentId);
    setError("");

    const response = await fetch(
      `http://localhost:5000/api/documents/${documentId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );

    // -----------------------------------------
    // Read response safely
    // -----------------------------------------

    const contentType =
      response.headers.get("content-type") || "";

    let data = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();

      console.error(
        "Delete API returned non-JSON response:",
        text
      );

      throw new Error(
        `Delete API returned ${response.status} ${response.statusText}`
      );
    }

    // -----------------------------------------
    // Backend error
    // -----------------------------------------

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to delete document"
      );
    }

    // -----------------------------------------
    // Remove document from UI
    // -----------------------------------------

    setDocuments((previous) =>
      previous.filter(
        (item) =>
          getId(item) !== documentId
      )
    );

    setOpenMenuDocumentId(null);
    setPreviewDocument(null);

  } catch (error) {
    console.error(
      "Delete document error:",
      error
    );

    setError(
      error?.message ||
        "Unable to delete document"
    );
  } finally {
    setDeletingDocumentId(null);
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

                  const canDelete =
                    isOrganizationAdmin(
                      document
                    );

                  const isDeleting =
                    deletingDocumentId ===
                    documentId;

                  return (
                    <div
                      key={documentId}
                      className="group relative grid cursor-pointer grid-cols-1 gap-3 border-b border-slate-800/70 px-5 py-4 transition last:border-b-0 hover:bg-slate-900/40 md:grid-cols-[minmax(350px,2fr)_1.3fr_1fr_120px_50px] md:items-center md:gap-4"
                      onClick={() => {
                        setPreviewDocument(
                          document
                        );

                        setOpenMenuDocumentId(
                          null
                        );
                      }}
                    >

                      {/* ==========================================
                          DOCUMENT
                      ========================================== */}

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


                      {/* ==========================================
                          LOCATION
                      ========================================== */}

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


                      {/* ==========================================
                          STATUS
                      ========================================== */}

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

                          {document.status ||
                            "Draft"}

                        </span>

                      </div>


                      {/* ==========================================
                          UPDATED
                      ========================================== */}

                      <div className="text-sm text-slate-500">

                        {formatDate(
                          document.updatedAt
                        )}

                      </div>


                      {/* ==========================================
                          ACTION MENU
                      ========================================== */}

                      <div className="relative flex justify-end">

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(event) => {

                            event.stopPropagation();

                            setOpenMenuDocumentId(
                              (previous) =>
                                previous ===
                                documentId
                                  ? null
                                  : documentId
                            );

                        }}
                          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-white md:opacity-0 md:group-hover:opacity-100"
                          title="More actions"
                        >

                          {isDeleting ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <MoreHorizontal
                              size={18}
                            />
                          )}

                        </button>


                        {/* ======================================
                            DROPDOWN
                        ====================================== */}

                        {openMenuDocumentId ===
                          documentId && (

                          <div
                            className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-slate-800 bg-[#0b1124] p-1.5 shadow-2xl"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() => {

                                setOpenMenuDocumentId(
                                  null
                                );

                                navigate(
                                  `/documents/${documentId}`
                                );

                              }}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >

                              <Pencil
                                size={15}
                              />

                              Edit document

                            </button>


                            {/* DELETE */}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => {

                                  setOpenMenuDocumentId(
                                    null
                                  );

                                  handleDeleteDocument(
                                    document
                                  );

                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                              >

                                <Trash2
                                  size={15}
                                />

                                Delete document

                              </button>
                            )}

                          </div>

                        )}

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
                    <Building2
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
                        ? projectName || "Project"
                        : isWorkspaceDocuments
                        ? workspaceName || "Workspace"
                        : "Organization"}

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


      {/* =================================================
            DOCUMENT PREVIEW
        ================================================= */}

        {previewDocument && (
          <DocumentPreviewSheet
            document={
              previewDocument
            }

            onClose={() => {
              setPreviewDocument(
                null
              );
            }}

            onEdit={() => {
              const documentId =
                getId(
                  previewDocument
                );

              navigate(
                `/documents/${documentId}`
              );
            }}
          />
        )}

    </div>
  );
};


export default Documents;


const DocumentPreviewSheet = ({
  document,
  onClose,
  onEdit,
}) => {
  if (!document) {
    return null;
  }

  const scope =
    document.project
      ? {
          label:
            document.project.name,
          type: "Project",
          icon: BriefcaseBusiness,
        }
      : document.workspace
      ? {
          label:
            document.workspace.name,
          type: "Workspace",
          icon: Folder,
        }
      : {
          label:
            "Organization",
          type: "Organization",
          icon: Building2,
        };

  const ScopeIcon =
    scope.icon;

  const sanitizedContent =
    DOMPurify.sanitize(
      document.content || ""
    );


  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >

      <div
        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#080d1f] shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">

              <FileText
                size={19}
                className="text-indigo-400"
              />

            </div>


            <div className="min-w-0">

              <h2 className="truncate text-base font-semibold text-white">

                {document.title}

              </h2>


              <div className="mt-1 flex items-center gap-2">

                <ScopeIcon
                  size={12}
                  className="text-slate-500"
                />

                <span className="text-xs text-slate-500">

                  {scope.label}

                </span>

                <span className="text-slate-700">
                  •
                </span>

                <span className="text-xs text-slate-600">

                  {scope.type}

                </span>

              </div>

            </div>

          </div>


          <div className="flex items-center gap-2">

            {/* STATUS */}

            <span
              className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
                document.status ===
                "Published"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : document.status ===
                    "Archived"
                  ? "bg-slate-800 text-slate-500"
                  : "bg-indigo-500/10 text-indigo-400"
              }`}
            >
              {document.status ||
                "Draft"}
            </span>


            {/* EDIT */}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            >

              <Pencil
                size={14}
              />

              Edit

            </button>


            {/* CLOSE */}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              title="Close preview"
            >

              <X size={18} />

            </button>

          </div>

        </div>


        {/* ==========================================
            META
        ========================================== */}

        <div className="flex shrink-0 items-center gap-4 border-b border-slate-800/70 px-6 py-3">

          <span className="text-xs text-slate-500">

            Created{" "}

            {document.createdAt
              ? new Date(
                  document.createdAt
                ).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )
              : "Unknown"}

          </span>


          <span className="text-slate-700">
            •
          </span>


          <span className="text-xs text-slate-500">

            Updated{" "}

            {document.updatedAt
              ? new Date(
                  document.updatedAt
                ).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )
              : "Unknown"}

          </span>

        </div>


        {/* ==========================================
            CONTENT
        ========================================== */}

        <div className="flex-1 overflow-y-auto bg-[#020617] px-5 py-8 sm:px-10">

          <article className="mx-auto min-h-full w-full max-w-4xl rounded-xl border border-slate-800 bg-[#080d1f] px-6 py-8 shadow-xl sm:px-10 sm:py-10">

            {/* DOCUMENT TITLE */}

            <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">

              {document.title}

            </h1>


            {/* DOCUMENT CONTENT */}

            {document.content ? (

              <div
                className="document-preview prose prose-invert max-w-none text-slate-300"
                dangerouslySetInnerHTML={{
                  __html:
                    sanitizedContent,
                }}
              />

            ) : (

              <div className="flex min-h-[300px] items-center justify-center">

                <div className="text-center">

                  <FileText
                    size={28}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-4 text-sm text-slate-500">
                    This document is empty.
                  </p>

                </div>

              </div>

            )}

          </article>

        </div>

      </div>

    </div>
  );
};