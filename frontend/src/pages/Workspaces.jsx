import {
  Building2,
  Plus,
  Users,
  FolderKanban,
  MoreHorizontal,
  ArrowRight,
  Search,
  RefreshCw,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import CreateWorkspaceModal from "../components/workspace/CreateWorkspaceModal";
import EditWorkspaceModal from "../components/workspace/EditWorkspaceModal";
import DeleteWorkspaceModal from "../components/workspace/DeleteWorkspaceModal";


// ==========================================
// API
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const Workspaces = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [search, setSearch] =
    useState("");

  const [createModalOpen, setCreateModalOpen] =
    useState(false);

  const [workspaces, setWorkspaces] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedWorkspace, setSelectedWorkspace] =
    useState(null);

  const [showEditWorkspace, setShowEditWorkspace] =
    useState(false);

  const [showDeleteWorkspace, setShowDeleteWorkspace] =
    useState(false);

  const [openMenu, setOpenMenu] =
    useState(null);
  
  const [organizationId, setOrganizationId] =
    useState(
      () =>
        localStorage.getItem(
          "currentOrganizationId"
        ) || ""
    );

  const [organizationRole, setOrganizationRole] =
    useState(""); 

  const canCreateWorkspace =
    organizationRole === "organization_admin" ||
    organizationRole === "member";



  // ==========================================
  // FETCH WORKSPACES
  // ==========================================

  const fetchWorkspaces = async (
  selectedOrganizationId = organizationId
) => {

  try {

    setLoading(true);
    setError("");

    // ==========================================
    // ORGANIZATION VALIDATION
    // ==========================================

    if (!selectedOrganizationId) {

      setWorkspaces([]);

      setError(
        "Please select an organization."
      );

      return;
    }


    // ==========================================
    // FETCH WORKSPACES
    // ==========================================

    const response = await fetch(
      `${API_BASE_URL}/workspaces?organizationId=${encodeURIComponent(
        selectedOrganizationId
      )}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );


    // ==========================================
    // RESPONSE TYPE
    // ==========================================

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    let data;


    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const text =
        await response.text();

      console.error(
        "Unexpected server response:",
        text
      );

      throw new Error(
        "Server returned an unexpected response."
      );

    }


    // ==========================================
    // API ERROR
    // ==========================================

    if (!response.ok) {

      throw new Error(
        data?.message ||
          "Unable to fetch workspaces."
      );

    }


    // ==========================================
    // SUCCESS
    // ==========================================

    setWorkspaces(
      Array.isArray(
        data?.workspaces
      )
        ? data.workspaces
        : []
    );

  } catch (error) {

    console.error(
      "Fetch workspaces error:",
      error
    );

    setWorkspaces([]);

    setError(
      error?.message ||
        "Unable to load workspaces."
    );

  } finally {

    setLoading(false);

  }

};


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const storedOrganizationId =
      localStorage.getItem(
        "currentOrganizationId"
      ) || "";

    const storedOrganizationRole =
      localStorage.getItem(
        "currentOrganizationRole"
      ) || "";

    setOrganizationRole(
      storedOrganizationRole
    );


    setOrganizationId(
      storedOrganizationId
    );


    if (storedOrganizationId) {

      fetchWorkspaces(
        storedOrganizationId
      );

    } else {

      setWorkspaces([]);

      setLoading(false);

      setError(
        "Please select an organization."
      );

    }

  }, []);

  useEffect(() => {

    const handleOrganizationChanged =
      () => {

        const newOrganizationId =
          localStorage.getItem(
            "currentOrganizationId"
          ) || "";


        // ------------------------------------------
        // UPDATE ORGANIZATION
        // ------------------------------------------

        setOrganizationId(
          newOrganizationId
        );


        const newOrganizationRole =
          localStorage.getItem(
            "currentOrganizationRole"
          ) || "";

        setOrganizationRole(
          newOrganizationRole
        );

        // ------------------------------------------
        // CLEAR OLD ORGANIZATION DATA
        // ------------------------------------------

        setWorkspaces([]);


        // ------------------------------------------
        // LOAD NEW ORGANIZATION WORKSPACES
        // ------------------------------------------

        if (newOrganizationId) {

          fetchWorkspaces(
            newOrganizationId
          );

        } else {

          setLoading(false);

          setError(
            "Please select an organization."
          );

        }

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

  }, []);


  // ==========================================
  // FILTER
  // ==========================================

  const filteredWorkspaces =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return workspaces;
      }

      return workspaces.filter(
        (workspace) =>
          workspace.name
            ?.toLowerCase()
            .includes(query) ||
          workspace.description
            ?.toLowerCase()
            .includes(query)
      );

    }, [
      workspaces,
      search,
    ]);


  // ==========================================
  // WORKSPACE CREATED
  // ==========================================

  const handleWorkspaceCreated = (
    workspace
  ) => {

    /*
     * The backend returns the real workspace.
     * Add it to the top of the list.
     */

    setWorkspaces(
      (previous) => [
        workspace,
        ...previous,
      ]
    );

  };

  const handleWorkspaceUpdated = (
    updatedWorkspace
  ) => {
    setWorkspaces((previous) =>
      previous.map((workspace) => {
        const workspaceId =
          workspace._id || workspace.id;

        const updatedId =
          updatedWorkspace._id ||
          updatedWorkspace.id;

        if (workspaceId === updatedId) {
          return {
            ...workspace,
            ...updatedWorkspace,
          };
        }

        return workspace;
      })
    );

    setSelectedWorkspace(null);
  };

  const handleWorkspaceDeleted = (
    deletedWorkspaceId
  ) => {
    setWorkspaces((previous) =>
      previous.filter((workspace) => {
        const workspaceId =
          workspace._id || workspace.id;

        return workspaceId !==
          deletedWorkspaceId;
      })
    );

    setSelectedWorkspace(null);
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {

    return (
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        {/* Header skeleton */}

        <div className="animate-pulse">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="h-4 w-28 rounded bg-slate-800" />

              <div className="mt-3 h-8 w-40 rounded bg-slate-800" />

              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-800" />

            </div>

            <div className="h-10 w-40 rounded-lg bg-slate-800" />

          </div>


          {/* Search skeleton */}

          <div className="mt-8 h-10 w-full max-w-md rounded-lg bg-slate-900" />


          {/* Cards */}

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (

                <div
                  key={item}
                  className="h-64 rounded-xl border border-slate-800 bg-slate-900/40"
                />

              )
            )}

          </div>

        </div>

      </div>
    );

  }


  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {

    return (
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">

              <AlertCircle
                size={25}
                className="text-red-400"
              />

            </div>


            <h2 className="mt-5 text-lg font-semibold text-white">
              Unable to load workspaces
            </h2>


            <p className="mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>


            <button
              type="button"
              onClick={
                fetchWorkspaces
              }
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
            >

              <RefreshCw size={15} />

              Try again

            </button>

          </div>

        </div>

      </div>
    );

  }


  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* =====================================
          HEADER
      ====================================== */}

      <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="mb-2 text-sm font-medium text-indigo-400">
            Organization
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Workspaces
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Create and manage separate
            collaborative spaces for your teams
            and projects.
          </p>

        </div>


        {canCreateWorkspace && (
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            onClick={() =>
              setCreateModalOpen(true)
            }
          >
            <Plus size={17} />
            Create Workspace
          </button>
        )}

      </section>


      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="mb-6">

        <div className="relative max-w-md">

          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search workspaces..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

        </div>

      </section>


      {/* =====================================
          WORKSPACE GRID
      ====================================== */}

      {filteredWorkspaces.length > 0 ? (

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredWorkspaces.map(
            (workspace) => {

              /*
               * Backend may return _id.
               * We use _id as the real MongoDB ID.
               */

              const workspaceId =
                workspace._id ||
                workspace.id;


              /*
               * These values depend on what
               * getMyWorkspaces returns.
               *
               * Safe fallbacks prevent
               * undefined from appearing.
               */

              const memberCount =
                workspace.memberCount ??
                workspace.membersCount ??
                workspace.members?.length ??
                0;


              const projectCount =
                workspace.projectCount ??
                workspace.projectsCount ??
                workspace.projects?.length ??
                0;


              const role =
                workspace.role ||
                "Member";
              
              const canEdit =
                workspace.role === "Owner" ||
                workspace.role === "Admin";

              const canDelete =
                workspace.role === "Owner";


              return (

                <div
                  key={workspaceId}
                  className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700 hover:bg-slate-900/70"
                >

                  {/* =================================
                      TOP
                  ================================== */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">

                        <Building2
                          size={20}
                          className="text-indigo-400"
                        />

                      </div>


                      <div className="min-w-0">

                        <h2 className="truncate text-sm font-semibold text-slate-100">
                          {workspace.name}
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {role}
                        </p>

                      </div>

                    </div>


                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === workspaceId
                              ? null
                              : workspaceId
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenu === workspaceId && (
                        <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-slate-800 bg-[#0b1022] p-1.5 shadow-2xl">

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWorkspace(workspace);
                                setShowEditWorkspace(true);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                              <Pencil size={15} />
                              Edit Workspace
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWorkspace(workspace);
                                setShowDeleteWorkspace(true);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                              Delete Workspace
                            </button>
                          )}

                        </div>
                      )}
                    </div>

                  </div>


                  {/* =================================
                      DESCRIPTION
                  ================================== */}

                  <p className="mt-5 min-h-10 text-sm leading-5 text-slate-400">

                    {workspace.description ||
                      "No workspace description provided."}

                  </p>


                  {/* =================================
                      STATISTICS
                  ================================== */}

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    {/* Members */}

                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">

                      <div className="flex items-center gap-2">

                        <Users
                          size={15}
                          className="text-slate-500"
                        />

                        <span className="text-xs text-slate-500">
                          Members
                        </span>

                      </div>

                      <p className="mt-2 text-lg font-semibold text-slate-200">
                        {memberCount}
                      </p>

                    </div>


                    {/* Projects */}

                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">

                      <div className="flex items-center gap-2">

                        <FolderKanban
                          size={15}
                          className="text-slate-500"
                        />

                        <span className="text-xs text-slate-500">
                          Projects
                        </span>

                      </div>

                      <p className="mt-2 text-lg font-semibold text-slate-200">
                        {projectCount}
                      </p>

                    </div>

                  </div>


                  {/* =================================
                      FOOTER
                  ================================== */}

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">

                    <span className="text-xs text-slate-600">

                      {workspace.updatedAt
                        ? new Date(
                            workspace.updatedAt
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month:
                                "short",
                              day:
                                "numeric",
                              year:
                                "numeric",
                            }
                          )
                        : workspace.createdAt
                        ? `Created ${new Date(
                            workspace.createdAt
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month:
                                "short",
                              day:
                                "numeric",
                              year:
                                "numeric",
                            }
                          )}`
                        : ""}

                    </span>


                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/workspaces/${workspaceId}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                    >

                      Open workspace

                      <ArrowRight
                        size={14}
                      />

                    </button>

                  </div>

                </div>

              );

            }
          )}

        </section>

      ) : (

        /* =====================================
            EMPTY STATE
        ====================================== */

        <div className="rounded-xl border border-dashed border-slate-800 py-16 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">

            <Building2
              size={21}
              className="text-slate-500"
            />

          </div>


          <h2 className="mt-4 text-sm font-semibold text-slate-200">

            {workspaces.length === 0
              ? "No workspaces yet"
              : "No workspaces found"}

          </h2>


          <p className="mt-1 text-sm text-slate-500">

            {workspaces.length === 0
              ? "Create your first workspace to get started."
              : "Try a different search term."}

          </p>


          {workspaces.length === 0 &&
            canCreateWorkspace && (
              <button
                type="button"
                onClick={() =>
                  setCreateModalOpen(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                <Plus size={15} />
                Create Workspace
              </button>
          )}

        </div>

      )}


      {/* =====================================
          CREATE WORKSPACE MODAL
      ====================================== */}

      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() =>
          setCreateModalOpen(false)
        }
        onCreate={
          handleWorkspaceCreated
        }
        organizationId={organizationId}
      />

      <EditWorkspaceModal
        isOpen={showEditWorkspace}
        workspace={selectedWorkspace}
        onClose={() => {
          setShowEditWorkspace(false);
          setSelectedWorkspace(null);
        }}
        onUpdated={handleWorkspaceUpdated}
      />

      <DeleteWorkspaceModal
        isOpen={showDeleteWorkspace}
        workspace={selectedWorkspace}
        onClose={() => {
          setShowDeleteWorkspace(false);
          setSelectedWorkspace(null);
        }}
        onDeleted={handleWorkspaceDeleted}
      />

    </div>
  );
};


export default Workspaces;