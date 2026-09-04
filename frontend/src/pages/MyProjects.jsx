import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  MoreHorizontal,
  RefreshCw,
  Search,
  Users,
  AlertCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { getWorkspaces } from "../services/dashboardService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const MyProjects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH MY PROJECTS
  //
  // /projects/my returns only projects where
  // the logged-in user is an active member.
  //
  // We then scope those projects to workspaces
  // belonging to the CURRENT organization.
  //
  // Result:
  //   Current Org
  //     Workspace 1 -> user is in Project A -> SHOW
  //     Workspace 2 -> user is NOT in Project B -> HIDE
  //
  //   Other Org
  //     User's projects -> HIDE
  // ========================================

  const fetchMyProjects = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const currentOrganizationId =
          localStorage.getItem(
            "currentOrganizationId"
          ) || "";

        if (!currentOrganizationId) {
          setProjects([]);
          setError(
            "Please select an organization."
          );
          return;
        }

        // ----------------------------------------
        // 1. Get ONLY workspaces in current org
        // ----------------------------------------

        const organizationWorkspaces =
          await getWorkspaces(
            currentOrganizationId
          );

        if (
          !Array.isArray(
            organizationWorkspaces
          ) ||
          organizationWorkspaces.length === 0
        ) {
          setProjects([]);
          return;
        }

        const organizationWorkspaceIds =
          new Set(
            organizationWorkspaces
              .map(
                (workspace) =>
                  workspace?._id ||
                  workspace?.id
              )
              .filter(Boolean)
              .map((id) => String(id))
          );

        // ----------------------------------------
        // 2. Get projects where the logged-in user
        //    is an active project member
        // ----------------------------------------

        const response = await fetch(
          `${API_BASE_URL}/projects/my`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to fetch your projects"
          );
        }

        const myProjects =
          Array.isArray(data?.projects)
            ? data.projects
            : [];

        // ----------------------------------------
        // 3. Keep only projects whose workspace
        //    belongs to the current organization.
        // ----------------------------------------

        const currentOrganizationProjects =
          myProjects
            .filter((project) => {
              const projectWorkspaceId =
                project?.workspace?._id ||
                project?.workspace?.id ||
                project?.workspace;

              return (
                projectWorkspaceId &&
                organizationWorkspaceIds.has(
                  String(projectWorkspaceId)
                )
              );
            })
            .map((project) => {
              const projectWorkspaceId =
                project?.workspace?._id ||
                project?.workspace?.id ||
                project?.workspace;

              const workspace =
                organizationWorkspaces.find(
                  (item) =>
                    String(
                      item?._id ||
                        item?.id
                    ) ===
                    String(
                      projectWorkspaceId
                    )
                );

              return {
                ...project,
                workspace:
                  workspace ||
                  project.workspace,
                workspaceId:
                  projectWorkspaceId,
              };
            });

        setProjects(
          currentOrganizationProjects
        );
      } catch (error) {
        console.error(
          "Fetch my organization projects error:",
          error
        );

        setProjects([]);

        setError(
          error?.message ||
            "Unable to load your projects"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ========================================
  // INITIAL LOAD + ORGANIZATION CHANGE
  // ========================================

  useEffect(() => {
    fetchMyProjects();

    const handleOrganizationChanged =
      () => {
        // Immediately clear projects from the
        // previous organization.
        setProjects([]);
        setError("");

        fetchMyProjects();
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
  }, [fetchMyProjects]);

  // ========================================
  // FILTER
  // ========================================

  const filteredProjects = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return projects.filter(
      (project) => {
        const matchesSearch =
          !query ||
          project.name
            ?.toLowerCase()
            .includes(query) ||
          project.description
            ?.toLowerCase()
            .includes(query) ||
          project.workspace?.name
            ?.toLowerCase()
            .includes(query);

        const matchesFilter =
          filter === "All" ||
          project.status === filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    projects,
    search,
    filter,
  ]);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="animate-pulse">

          <div className="h-8 w-40 rounded bg-slate-800" />

          <div className="mt-3 h-4 w-80 rounded bg-slate-800" />

          <div className="mt-8 h-11 rounded-lg bg-slate-900" />

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

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="flex min-h-[450px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertCircle
                size={25}
                className="text-red-400"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              Unable to load projects
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={fetchMyProjects}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
            >
              <RefreshCw size={15} />
              Try again
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ========================================
  // MAIN
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* =====================================
          HEADER
      ====================================== */}

      <section className="mb-7">

        <div>

          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <FolderKanban size={14} />

            <span>
              My Workspace
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            My Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            All projects you're currently a
            member of across your workspaces.
          </p>

        </div>

      </section>

      {/* =====================================
          SUMMARY
      ====================================== */}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          label="Total Projects"
          value={projects.length}
        />

        <SummaryCard
          label="In Progress"
          value={
            projects.filter(
              (project) =>
                project.status ===
                "In Progress"
            ).length
          }
        />

        <SummaryCard
          label="Completed"
          value={
            projects.filter(
              (project) =>
                project.status ===
                "Completed"
            ).length
          }
        />

        <SummaryCard
          label="Planning"
          value={
            projects.filter(
              (project) =>
                project.status ===
                "Planning"
            ).length
          }
        />

      </section>

      {/* =====================================
          TOOLBAR
      ====================================== */}

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="relative w-full lg:max-w-md">

          <Search
            size={16}
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
            placeholder="Search your projects..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

        </div>

        <div className="flex items-center gap-2 overflow-x-auto">

          {[
            "All",
            "Planning",
            "In Progress",
            "Completed",
          ].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setFilter(option)
              }
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                filter === option
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
              }`}
            >
              {option}
            </button>
          ))}

        </div>

      </section>

      {/* =====================================
          PROJECTS
      ====================================== */}

      {filteredProjects.length > 0 ? (

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredProjects.map(
            (project) => (
              <MyProjectCard
                key={project._id}
                project={project}
                onOpen={() =>
                  navigate(
                    `/workspaces/${
                      project.workspaceId ||
                      project.workspace?._id ||
                      project.workspace?.id
                    }/projects/${project._id}`
                  )
                }
              />
            )
          )}

        </section>

      ) : (

        <div className="rounded-xl border border-dashed border-slate-800 py-16 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <FolderKanban
              size={21}
              className="text-slate-500"
            />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-slate-200">
            {projects.length === 0
              ? "No projects yet"
              : "No projects found"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {projects.length === 0
              ? "Projects you're a member of will appear here."
              : "Try changing your search or filter."}
          </p>

        </div>

      )}

    </div>
  );
};


// ==========================================
// SUMMARY CARD
// ==========================================

const SummaryCard = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-white">
        {value}
      </p>

    </div>
  );
};


// ==========================================
// MY PROJECT CARD
// ==========================================

const MyProjectCard = ({
  project,
  onOpen,
}) => {

  const statusStyles = {
    Planning:
      "bg-slate-800 text-slate-400",

    "In Progress":
      "bg-indigo-500/10 text-indigo-400",

    Completed:
      "bg-emerald-500/10 text-emerald-400",

    "On Hold":
      "bg-amber-500/10 text-amber-400",

    Archived:
      "bg-slate-800 text-slate-500",
  };

  const priorityStyles = {
    High:
      "bg-red-500/10 text-red-400",

    Medium:
      "bg-amber-500/10 text-amber-400",

    Low:
      "bg-slate-800 text-slate-400",

    Critical:
      "bg-red-500/10 text-red-400",
  };

  const progress =
    project.status === "Completed"
      ? 100
      : project.status ===
        "In Progress"
      ? 50
      : project.status ===
        "Planning"
      ? 20
      : 0;

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700 hover:bg-slate-900/70">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">

        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 items-center gap-3 text-left"
        >

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
            <FolderKanban
              size={18}
              className="text-indigo-400"
            />
          </div>

          <div className="min-w-0">

            <h2 className="truncate text-sm font-semibold text-slate-100 transition group-hover:text-indigo-400">
              {project.name}
            </h2>

            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                statusStyles[
                  project.status
                ] ||
                "bg-slate-800 text-slate-400"
              }`}
            >
              {project.status}
            </span>

          </div>

        </button>

        <button
          type="button"
          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
        >
          <MoreHorizontal size={17} />
        </button>

      </div>

      {/* WORKSPACE */}

      {project.workspace?.name && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
          <FolderKanban size={12} />

          <span className="truncate">
            {project.workspace.name}
          </span>
        </div>
      )}

      {/* DESCRIPTION */}

      <p className="mt-4 min-h-10 text-sm leading-5 text-slate-400">
        {project.description ||
          "No project description provided."}
      </p>

      {/* PROGRESS */}

      <div className="mt-5">

        <div className="mb-2 flex items-center justify-between">

          <span className="text-xs text-slate-500">
            Progress
          </span>

          <span className="text-xs font-medium text-slate-300">
            {progress}%
          </span>

        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

          <div
            className={`h-full rounded-full ${
              project.status ===
              "Completed"
                ? "bg-emerald-500"
                : "bg-indigo-500"
            }`}
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* METADATA */}

      <div className="mt-5 grid grid-cols-2 gap-3">

        <div className="flex items-center gap-2 text-xs text-slate-500">

          <Users size={14} />

          <span>
            Project members
          </span>

        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">

          <CalendarDays size={14} />

          <span>
            {project.dueDate
              ? new Date(
                  project.dueDate
                ).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )
              : "No deadline"}
          </span>

        </div>

        <div>

          <span
            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
              priorityStyles[
                project.priority
              ] ||
              "bg-slate-800 text-slate-400"
            }`}
          >
            {project.priority ||
              "Medium"}{" "}
            priority
          </span>

        </div>

      </div>

      {/* FOOTER */}

      <div className="mt-5 border-t border-slate-800 pt-4">

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Open project
          <ArrowRight size={14} />
        </button>

      </div>

    </div>
  );
};

export default MyProjects;