import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import CreateProjectModal from "../components/project/CreateProjectModal";
import ProjectCard from "../components/project/ProjectCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const Projects = () => {
  const navigate = useNavigate();

  const { workspaceId } = useParams();

  const [organizationId, setOrganizationId] =
    useState(
      () =>
        localStorage.getItem(
          "currentOrganizationId"
        ) || ""
    );

  const [projects, setProjects] = useState([]);
  const [workspace, setWorkspace] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createModalOpen, setCreateModalOpen] =
    useState(false);

  // ==========================================
  // FETCH WORKSPACE PROJECTS
  // ==========================================

  const fetchProjects = useCallback(async () => {
    if (!workspaceId) {
      setError("Workspace ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const contentType =
        response.headers.get("content-type");

      let data;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Unexpected server response:",
          text
        );

        throw new Error(
          "Server returned an unexpected response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to fetch workspace projects."
        );
      }

      // ======================================
      // SET PROJECTS
      // ======================================

      const fetchedProjects =
        Array.isArray(data?.projects)
          ? data.projects
          : [];

      setProjects(fetchedProjects);

      // ======================================
      // WORKSPACE DETAILS
      // ======================================

      if (data?.workspace) {
        setWorkspace(data.workspace);
      }

    } catch (error) {
      console.error(
        "Fetch workspace projects error:",
        error
      );

      setError(
        error.message ||
          "Unable to load projects."
      );

    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ==========================================
  // PROJECT CREATED
  // ==========================================

  const handleProjectCreated = async () => {
    /*
     * Don't manually create a fake project here.
     *
     * The backend has already created the project
     * in MongoDB.
     *
     * Fetch again so the UI always reflects the
     * actual database state.
     */

    await fetchProjects();
  };

  // ==========================================
  // FILTER PROJECTS
  // ==========================================

  const filteredProjects = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.name
          ?.toLowerCase()
          .includes(query) ||
        project.description
          ?.toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "All" ||
        project.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    projects,
    search,
    filter,
  ]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="animate-pulse">

          <div className="h-4 w-40 rounded bg-slate-800" />

          <div className="mt-5 h-8 w-44 rounded bg-slate-800" />

          <div className="mt-3 h-4 w-80 rounded bg-slate-800" />

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

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
  // ERROR
  // ==========================================

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

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchProjects}
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

      <section className="mb-7">

        <button
          type="button"
          onClick={() =>
            navigate(
              `/workspaces/${workspaceId}`
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft size={15} />
          Back to workspace
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">

              <FolderKanban size={14} />

              <span>
                {workspace?.name ||
                  "Workspace"}
              </span>

            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Plan, organize and track projects
              across this workspace.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setCreateModalOpen(true)
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <Plus size={17} />
            New Project
          </button>

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
              setSearch(event.target.value)
            }
            placeholder="Search projects..."
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
          PROJECT GRID
      ====================================== */}

      {filteredProjects.length > 0 ? (

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredProjects.map(
            (project) => {

              const projectId =
                project._id ||
                project.id;

              return (
                <ProjectCard
                  key={projectId}
                  project={project}
                  hasAccess={project.hasAccess}
                  onOpen={() =>
                    navigate(
                      `/workspaces/${workspaceId}/projects/${projectId}`
                    )
                  }
                />
              );
            }
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
            {search || filter !== "All"
              ? "No projects found"
              : "No projects yet"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {search || filter !== "All"
              ? "Try changing your search or filter."
              : "Create your first project in this workspace."}
          </p>

          {!search &&
            filter === "All" && (
              <button
                type="button"
                onClick={() =>
                  setCreateModalOpen(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400"
              >
                <Plus size={15} />
                Create Project
              </button>
            )}

        </div>

      )}

      {/* =====================================
          CREATE PROJECT MODAL
      ====================================== */}

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() =>
          setCreateModalOpen(false)
        }
        workspaceId={workspaceId}
        onCreate={handleProjectCreated}
      />

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


// // ==========================================
// // PROJECT CARD
// // ==========================================

// const ProjectCard = ({
//   project,
//   onOpen,
// }) => {

//   const statusStyles = {
//     Planning:
//       "bg-slate-800 text-slate-400",

//     "In Progress":
//       "bg-indigo-500/10 text-indigo-400",

//     Completed:
//       "bg-emerald-500/10 text-emerald-400",

//     "On Hold":
//       "bg-amber-500/10 text-amber-400",

//     Archived:
//       "bg-slate-800 text-slate-500",
//   };

//   const priorityStyles = {
//     High:
//       "bg-red-500/10 text-red-400",

//     Medium:
//       "bg-amber-500/10 text-amber-400",

//     Low:
//       "bg-slate-800 text-slate-400",

//     Critical:
//       "bg-red-500/10 text-red-400",
//   };

//   const progress =
//     project.status === "Completed"
//       ? 100
//       : project.status === "In Progress"
//       ? 50
//       : project.status === "Planning"
//       ? 20
//       : 0;

//   return (
//     <div className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700 hover:bg-slate-900/70">

//       {/* HEADER */}

//       <div className="flex items-start justify-between gap-3">

//         <button
//           type="button"
//           onClick={onOpen}
//           className="flex min-w-0 items-center gap-3 text-left"
//         >

//           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">

//             <FolderKanban
//               size={18}
//               className="text-indigo-400"
//             />

//           </div>

//           <div className="min-w-0">

//             <h2 className="truncate text-sm font-semibold text-slate-100 transition group-hover:text-indigo-400">
//               {project.name}
//             </h2>

//             <span
//               className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
//                 statusStyles[
//                   project.status
//                 ] ||
//                 "bg-slate-800 text-slate-400"
//               }`}
//             >
//               {project.status ||
//                 "Planning"}
//             </span>

//           </div>

//         </button>

//         <button
//           type="button"
//           className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
//         >
//           <MoreHorizontal size={17} />
//         </button>

//       </div>

//       {/* DESCRIPTION */}

//       <p className="mt-5 min-h-10 text-sm leading-5 text-slate-400">
//         {project.description ||
//           "No project description provided."}
//       </p>

//       {/* PROGRESS */}

//       <div className="mt-5">

//         <div className="mb-2 flex items-center justify-between">

//           <span className="text-xs text-slate-500">
//             Progress
//           </span>

//           <span className="text-xs font-medium text-slate-300">
//             {progress}%
//           </span>

//         </div>

//         <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

//           <div
//             className={`h-full rounded-full ${
//               project.status ===
//               "Completed"
//                 ? "bg-emerald-500"
//                 : "bg-indigo-500"
//             }`}
//             style={{
//               width: `${progress}%`,
//             }}
//           />

//         </div>

//       </div>

//       {/* METADATA */}

//       <div className="mt-5 grid grid-cols-2 gap-3">

//         <div className="flex items-center gap-2 text-xs text-slate-500">

//           <Users size={14} />

//           <span>
//             Project members
//           </span>

//         </div>

//         <div className="flex items-center gap-2 text-xs text-slate-500">

//           <CalendarDays size={14} />

//           <span>
//             {project.dueDate
//               ? new Date(
//                   project.dueDate
//                 ).toLocaleDateString(
//                   "en-US",
//                   {
//                     month: "short",
//                     day: "numeric",
//                     year: "numeric",
//                   }
//                 )
//               : "No deadline"}
//           </span>

//         </div>

//         <div>

//           <span
//             className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
//               priorityStyles[
//                 project.priority
//               ] ||
//               "bg-slate-800 text-slate-400"
//             }`}
//           >
//             {project.priority ||
//               "Medium"}{" "}
//             priority
//           </span>

//         </div>

//       </div>

//       {/* FOOTER */}

//       <div className="mt-5 border-t border-slate-800 pt-4">

//         <button
//           type="button"
//           onClick={onOpen}
//           className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
//         >
//           Open project
//           <ArrowRight size={14} />
//         </button>

//       </div>

//     </div>
//   );
// };


export default Projects;