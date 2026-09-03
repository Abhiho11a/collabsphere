import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ShieldCheck,
  Building2,
  FolderKanban,
  Users,
  ChevronRight,
  Search,
  LogOut,
  Briefcase,
  Mail,
  Loader2,
  Activity,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedOrganizationId,
    setSelectedOrganizationId,
  ] = useState(null);

  const [
    selectedWorkspaceId,
    setSelectedWorkspaceId,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/superadmin/dashboard`,
            {
              credentials:
                "include",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load dashboard"
          );
        }

        setDashboard(data);
      } catch (error) {
        console.error(
          "Super Admin dashboard error:",
          error
        );

        setError(
          error.message ||
            "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadDashboard();
  }, []);


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout =
    async () => {
      try {
        setLoggingOut(true);

        await fetch(
          `${API_BASE_URL}/superadmin/logout`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );
      } catch (error) {
        console.error(
          "Super Admin logout error:",
          error
        );
      } finally {
        navigate("/login");
      }
    };


  // =====================================================
  // FILTER ORGANIZATIONS
  // =====================================================

  const filteredOrganizations =
    useMemo(() => {
      const organizations =
        dashboard?.organizations ||
        [];

      if (!search.trim()) {
        return organizations;
      }

      const value =
        search.toLowerCase();

      return organizations.filter(
        (organization) =>
          organization.name
            ?.toLowerCase()
            .includes(value)
      );
    }, [
      dashboard,
      search,
    ]);


  // =====================================================
  // SELECTED ORGANIZATION
  // =====================================================

  const selectedOrganization =
    dashboard?.organizations?.find(
      (organization) =>
        String(
          organization.id
        ) ===
        String(
          selectedOrganizationId
        )
    );


  // =====================================================
  // SELECTED WORKSPACE
  // =====================================================

  const selectedWorkspace =
    selectedOrganization?.workspaces?.find(
      (workspace) =>
        String(
          workspace.id
        ) ===
        String(
          selectedWorkspaceId
        )
    );


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">

        <div className="flex items-center gap-3 text-slate-400">

          <Loader2
            size={22}
            className="animate-spin text-indigo-400"
          />

          Loading Super Admin dashboard...

        </div>

      </div>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">

        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

          <ShieldCheck
            size={35}
            className="mx-auto mb-4 text-red-400"
          />

          <h2 className="text-lg font-semibold">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error}
          </p>

          <button
            onClick={
              loadDashboard
            }
            className="mt-6 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium hover:bg-indigo-400"
          >
            Try again
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // DELETE ENTITY
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      let endpoint = "";

      if (
        deleteTarget.type ===
        "organization"
      ) {
        endpoint =
          `${API_BASE_URL}/superadmin/organizations/${deleteTarget.id}`;
      }

      if (
        deleteTarget.type ===
        "workspace"
      ) {
        endpoint =
          `${API_BASE_URL}/superadmin/workspaces/${deleteTarget.id}`;
      }

      if (
        deleteTarget.type ===
        "project"
      ) {
        endpoint =
          `${API_BASE_URL}/superadmin/projects/${deleteTarget.id}`;
      }

      const response =
        await fetch(endpoint, {
          method: "DELETE",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        });

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete"
        );
      }

      // ---------------------------------------------
      // CLOSE MODAL
      // ---------------------------------------------

      setDeleteTarget(null);

      // ---------------------------------------------
      // RESET SELECTION
      // ---------------------------------------------

      if (
        deleteTarget.type ===
        "organization"
      ) {
        setSelectedOrganizationId(
          null
        );

        setSelectedWorkspaceId(
          null
        );
      }

      if (
        deleteTarget.type ===
        "workspace"
      ) {
        setSelectedWorkspaceId(
          null
        );
      }

      // ---------------------------------------------
      // RELOAD DASHBOARD
      // ---------------------------------------------

      await loadDashboard();
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      setError(
        error.message ||
          "Unable to delete"
      );
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">

        <div className="flex h-16 items-center justify-between px-6">

          {/* BRAND */}

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold">
              C
            </div>

            <div>

              <div className="font-semibold tracking-tight">
                COLLABSPHERE
              </div>

              <div className="text-[11px] text-slate-500">
                Global Administration
              </div>

            </div>

          </div>


          {/* RIGHT */}

          <div className="flex items-center gap-4">

            <div className="hidden items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 sm:flex">

              <ShieldCheck
                size={15}
                className="text-indigo-400"
              />

              <span className="text-xs font-medium text-indigo-300">
                Super Admin
              </span>

            </div>

            <button
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
            >

              <LogOut
                size={15}
              />

              Logout

            </button>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-[1600px] px-6 py-8">

        {/* PAGE HEADER */}

        <div className="mb-8">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>

              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-indigo-400">

                <Activity
                  size={14}
                />

                System Overview

              </div>

              <h1 className="text-3xl font-semibold tracking-tight">
                Super Admin Dashboard
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Manage organizations, workspaces, projects and members from one place.
              </p>

            </div>


            {/* SEARCH */}

            <div className="relative w-full lg:w-80">

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
                placeholder="Search organizations..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

            </div>

          </div>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            icon={
              <Building2
                size={19}
              />
            }
            label="Organizations"
            value={
              dashboard
                ?.statistics
                ?.organizations ||
              0
            }
          />

          <StatCard
            icon={
              <Briefcase
                size={19}
              />
            }
            label="Workspaces"
            value={
              dashboard
                ?.statistics
                ?.workspaces ||
              0
            }
          />

          <StatCard
            icon={
              <FolderKanban
                size={19}
              />
            }
            label="Projects"
            value={
              dashboard
                ?.statistics
                ?.projects ||
              0
            }
          />

          <StatCard
            icon={
              <Users
                size={19}
              />
            }
            label="Active Users"
            value={
              dashboard
                ?.statistics
                ?.users ||
              0
            }
          />

        </div>


        {/* =================================================
            ORGANIZATION LIST
        ================================================= */}

        {!selectedOrganization && (
          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold">
                  Organizations
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select an organization to inspect its workspaces and members.
                </p>

              </div>

              <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                {
                  filteredOrganizations.length
                }{" "}
                organizations
              </span>

            </div>


            {filteredOrganizations.length ===
            0 ? (
              <EmptyState
                icon={
                  <Building2
                    size={25}
                  />
                }
                title="No organizations found"
                description="There are no organizations matching your search."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                {filteredOrganizations.map(
                  (organization) => (
                    <OrganizationCard
                      key={organization.id}
                      organization={organization}

                      onClick={() => {
                        setSelectedOrganizationId(
                          organization.id
                        );

                        setSelectedWorkspaceId(
                          null
                        );
                      }}

                      onDelete={() => {
                        setDeleteTarget({
                          type: "organization",
                          id: organization.id,
                          name: organization.name,
                        });
                      }}
                    />
                  )
                )}

              </div>
            )}

          </section>
        )}


        {/* =================================================
            ORGANIZATION DETAILS
        ================================================= */}

        {selectedOrganization && (
          <section>

            {/* BREADCRUMB */}

            <div className="mb-6 flex items-center gap-2 text-sm">

              <button
                onClick={() => {
                  setSelectedOrganizationId(
                    null
                  );

                  setSelectedWorkspaceId(
                    null
                  );
                }}
                className="text-slate-500 hover:text-white"
              >
                Organizations
              </button>

              <ChevronRight
                size={15}
                className="text-slate-600"
              />

              <span className="font-medium text-white">
                {
                  selectedOrganization.name
                }
              </span>

            </div>


            {/* ORG HEADER */}

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">

                    <Building2
                      size={25}
                    />

                  </div>

                  <div>

                    <h2 className="text-xl font-semibold">
                      {
                        selectedOrganization.name
                      }
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Organization
                    </p>

                  </div>

                </div>


                <div className="grid grid-cols-3 gap-3">

                  <MiniStat
                    label="Members"
                    value={
                      selectedOrganization.memberCount
                    }
                  />

                  <MiniStat
                    label="Workspaces"
                    value={
                      selectedOrganization.workspaceCount
                    }
                  />

                  <MiniStat
                    label="Projects"
                    value={
                      selectedOrganization.projectCount
                    }
                  />

                </div>

              </div>

            </div>


            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

              {/* WORKSPACES */}

              <div>

                <div className="mb-4">

                  <h3 className="text-base font-semibold">
                    Workspaces
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Click a workspace to view its projects.
                  </p>

                </div>


                <div className="space-y-3">

                  {selectedOrganization.workspaces
                    ?.length ===
                  0 ? (
                    <EmptyState
                      icon={
                        <Briefcase
                          size={23}
                        />
                      }
                      title="No workspaces"
                      description="This organization does not have any workspaces yet."
                    />
                  ) : (
                    selectedOrganization.workspaces.map(
                      (workspace) => (
                        <WorkspaceRow
                          key={workspace.id}
                          workspace={workspace}

                          selected={
                            String(
                              selectedWorkspaceId
                            ) ===
                            String(workspace.id)
                          }

                          onClick={() => {
                            setSelectedWorkspaceId(
                              workspace.id
                            );
                          }}

                          onDelete={() => {
                            setDeleteTarget({
                              type: "workspace",
                              id: workspace.id,
                              name: workspace.name,
                            });
                          }}
                        />
                      )
                    )
                  )}

                </div>


                {/* PROJECTS */}

                {selectedWorkspace && (
                  <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50">

                    <div className="border-b border-slate-800 p-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">

                          <FolderKanban
                            size={18}
                          />

                        </div>

                        <div>

                          <h3 className="font-semibold">
                            {
                              selectedWorkspace.name
                            }
                          </h3>

                          <p className="text-xs text-slate-500">
                            Workspace Projects
                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="p-4">

                      {selectedWorkspace.projects
                        ?.length ===
                      0 ? (
                        <EmptyState
                          icon={
                            <FolderKanban
                              size={22}
                            />
                          }
                          title="No projects"
                          description="This workspace does not contain any projects."
                        />
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">

                          {selectedWorkspace.projects.map(
                            (project) => (
                              <ProjectCard
                                key={project.id}
                                project={project}
                                onDelete={() => {
                                  setDeleteTarget({
                                    type: "project",
                                    id: project.id,
                                    name: project.name,
                                  });
                                }}
                              />
                            )
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>


              {/* MEMBERS */}

              <div>

                <div className="mb-4">

                  <h3 className="text-base font-semibold">
                    Organization Members
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    All active members of this organization.
                  </p>

                </div>


                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">

                  <div className="max-h-[650px] overflow-y-auto">

                    {selectedOrganization.members
                      ?.length ===
                    0 ? (
                      <EmptyState
                        icon={
                          <Users
                            size={22}
                          />
                        }
                        title="No members"
                        description="This organization has no active members."
                      />
                    ) : (
                      selectedOrganization.members.map(
                        (member) => (
                          <MemberRow
                            key={
                              member.id
                            }
                            member={
                              member
                            }
                          />
                        )
                      )
                    )}

                  </div>

                </div>

              </div>

            </div>

          </section>
        )}

      </main>


      {deleteTarget && (
        <DeleteConfirmationModal
          target={deleteTarget}
          deleting={deleting}
          onCancel={() => {
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={
            handleDelete
          }
        />
      )}

    </div>
  );
};


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <div className="text-2xl font-semibold">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {label}
      </div>

    </div>
  );
};


// =====================================================
// ORGANIZATION CARD
// =====================================================

const OrganizationCard = ({
  organization,
  onClick,
  onDelete,
}) => {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-indigo-500/40 hover:bg-slate-900">

      <div className="mb-5 flex items-start justify-between">

        <button
          onClick={onClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition hover:bg-indigo-500/20"
        >
          <Building2 size={21} />
        </button>

        <div className="flex items-center gap-1">

          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
            title="Delete organization"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={onClick}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-indigo-400"
          >
            <ChevronRight size={18} />
          </button>

        </div>

      </div>


      <button
        onClick={onClick}
        className="w-full text-left"
      >

        <h3 className="font-semibold">
          {organization.name}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Organization
        </p>

      </button>


      <div className="mt-5 grid grid-cols-3 gap-2">

        <CardMetric
          value={
            organization.memberCount
          }
          label="Members"
        />

        <CardMetric
          value={
            organization.workspaceCount
          }
          label="Workspaces"
        />

        <CardMetric
          value={
            organization.projectCount
          }
          label="Projects"
        />

      </div>

    </div>
  );
};


// =====================================================
// CARD METRIC
// =====================================================

const CardMetric = ({
  value,
  label,
}) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">

      <div className="text-sm font-semibold text-slate-200">
        {value}
      </div>

      <div className="mt-0.5 text-[10px] text-slate-600">
        {label}
      </div>

    </div>
  );
};


// =====================================================
// WORKSPACE ROW
// =====================================================

const WorkspaceRow = ({
  workspace,
  selected,
  onClick,
  onDelete,
}) => {
  return (
    <div
      className={`group flex w-full items-center justify-between rounded-xl border p-4 transition ${
        selected
          ? "border-indigo-500/40 bg-indigo-500/5"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
      }`}
    >

      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">

          <Briefcase size={18} />

        </div>

        <div className="min-w-0">

          <div className="truncate font-medium">
            {workspace.name}
          </div>

          <div className="mt-1 flex gap-3 text-xs text-slate-500">

            <span>
              {workspace.memberCount} members
            </span>

            <span>
              {workspace.projectCount} projects
            </span>

          </div>

        </div>

      </button>


      <div className="ml-3 flex items-center gap-1">

        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
          title="Delete workspace"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={onClick}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
        >
          <ChevronRight
            size={17}
          />
        </button>

      </div>

    </div>
  );
};


// =====================================================
// PROJECT CARD
// =====================================================

const ProjectCard = ({
  project,
  onDelete,
}) => {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">

          <FolderKanban
            size={17}
          />

        </div>


        <div className="min-w-0 flex-1">

          <h4 className="truncate text-sm font-medium">
            {project.name}
          </h4>

          {project.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {project.description}
            </p>
          )}

        </div>


        <button
          onClick={onDelete}
          className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
          title="Delete project"
        >
          <Trash2 size={15} />
        </button>

      </div>

    </div>
  );
};


// =====================================================
// MEMBER ROW
// =====================================================

const MemberRow = ({
  member,
}) => {
  const initials =
    (
      member.name ||
      member.email ||
      "U"
    )
      .charAt(0)
      .toUpperCase();

  return (
    <div className="flex items-center gap-3 border-b border-slate-800/70 p-4 last:border-b-0">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-300">

        {member.avatar ? (
          <img
            src={member.avatar}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}

      </div>


      <div className="min-w-0 flex-1">

        <div className="truncate text-sm font-medium">
          {member.name}
        </div>

        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">

          <Mail
            size={11}
          />

          {member.email}

        </div>

      </div>


      <span className="shrink-0 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] capitalize text-slate-400">
        {member.role
          ?.replace(
            "_",
            " "
          )}
      </span>

    </div>
  );
};


// =====================================================
// MINI STAT
// =====================================================

const MiniStat = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-center">

      <div className="text-lg font-semibold">
        {value}
      </div>

      <div className="text-[10px] text-slate-500">
        {label}
      </div>

    </div>
  );
};


// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">

      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-slate-500">
        {icon}
      </div>

      <h3 className="text-sm font-medium text-slate-300">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-600">
        {description}
      </p>

    </div>
  );
};


const DeleteConfirmationModal = ({
  target,
  deleting,
  onCancel,
  onConfirm,
}) => {
  const isOrganization =
    target.type ===
    "organization";

  const isWorkspace =
    target.type ===
    "workspace";

  const isProject =
    target.type ===
    "project";


  const entityName =
    isOrganization
      ? "organization"
      : isWorkspace
      ? "workspace"
      : "project";


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-800 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">

              <AlertTriangle
                size={20}
              />

            </div>

            <div>

              <h3 className="font-semibold text-white">
                Delete {entityName}
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                This action cannot be undone.
              </p>

            </div>

          </div>


          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>

        </div>


        {/* BODY */}

        <div className="p-5">

          <p className="text-sm leading-6 text-slate-300">

            Are you sure you want to permanently delete{" "}

            <span className="font-semibold text-white">
              {target.name}
            </span>
            ?

          </p>


          {isOrganization && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-xs leading-5 text-red-300">

                This will also permanently delete
                all workspaces, projects, workspace
                members and project members belonging
                to this organization.

              </p>

            </div>
          )}


          {isWorkspace && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-xs leading-5 text-red-300">

                This will also permanently delete
                all projects and memberships belonging
                to this workspace.

              </p>

            </div>
          )}


          {isProject && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-xs leading-5 text-red-300">

                This will permanently delete the
                project and its project memberships.

              </p>

            </div>
          )}

        </div>


        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-slate-800 bg-slate-950/40 p-5">

          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>


          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                <Trash2
                  size={15}
                />

                Delete permanently

              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
};

export default SuperAdminDashboard;