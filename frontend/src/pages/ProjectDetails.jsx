import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  MoreHorizontal,
  Plus,
  Users,
  Activity,
  ArrowRight,
  FolderOpen,
  Search,
  RefreshCw,
  AlertCircle,
  FileText,
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

import ProjectMembersModal from "../components/project/ProjectMembersModal";
import ProjectFilesModal from "../components/project/ProjectFilesModal";
import { useAuth } from "../context/AuthContext";


// ==========================================
// API
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// ==========================================
// PROJECT DETAILS
// ==========================================

const ProjectDetails = () => {
  const navigate = useNavigate();

  const {
    workspaceId,
    projectId,
  } = useParams();


  // ==========================================
  // STATE
  // ==========================================

  const [project, setProject] =
    useState(null);

  const [workspace, setWorkspace] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [activities, setActivities] =
    useState([]);

  const [projectFiles, setProjectFiles] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [showMembersModal, setShowMembersModal] =
    useState(false);

  const [showFilesModal, setShowFilesModal] =
    useState(false);

  const [filesLoading, setFilesLoading] =
    useState(false);

  const [filesError, setFilesError] =
    useState("");

  const { user } = useAuth();


  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) {
      return "0 KB";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
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
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "No date";
    }

    const parsedDate =
      new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "No date";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  // ==========================================
  // ACTIVITY TIME
  // ==========================================

  const formatActivityTime = (date) => {
    if (!date) {
      return "Recently";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    const diff = Date.now() - parsedDate.getTime();
    const seconds = Math.max(0, Math.floor(diff / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };


  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");
  };


  // ==========================================
  // FETCH PROJECT
  // ==========================================

  const fetchProject = useCallback(
    async () => {
      if (!workspaceId || !projectId) {
        setError(
          "Workspace or project ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );


        const contentType =
          response.headers.get(
            "content-type"
          );


        let data;


        if (
          contentType &&
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
            "Unexpected project response:",
            text
          );

          throw new Error(
            "Server returned an unexpected response."
          );
        }


        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load project."
          );
        }


        // ======================================
        // PROJECT
        // ======================================

        const fetchedProject =
          data?.project ||
          data?.data ||
          data;


        if (
          !fetchedProject ||
          !fetchedProject._id &&
          !fetchedProject.id
        ) {
          throw new Error(
            "Project data was not returned by the server."
          );
        }


        setProject(
          fetchedProject
        );


        // ======================================
        // WORKSPACE
        // ======================================

        if (data?.workspace) {
          setWorkspace(
            data.workspace
          );
        }

      } catch (error) {
        console.error(
          "Fetch project error:",
          error
        );

        setError(
          error.message ||
            "Unable to load project."
        );

      } finally {
        setLoading(false);
      }
    },
    [
      workspaceId,
      projectId,
    ]
  );


  // ==========================================
  // FETCH PROJECT FILES
  // ==========================================

  const fetchProjectFiles =
    useCallback(
      async () => {
        if (
          !workspaceId ||
          !projectId
        ) {
          return;
        }

        try {
          setFilesLoading(true);
          setFilesError("");

          const response =
            await fetch(
              `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/files`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );


          const contentType =
            response.headers.get(
              "content-type"
            );


          let data;


          if (
            contentType &&
            contentType.includes(
              "application/json"
            )
          ) {
            data =
              await response.json();
          } else {
            throw new Error(
              "Server returned an unexpected response."
            );
          }


          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load project files."
            );
          }


          const formattedFiles =
            (
              data?.files || []
            ).map((file) => ({
              id:
                file._id ||
                file.id,

              name:
                file.originalName ||
                file.name ||
                "Unnamed file",

              type:
                file.mimeType
                  ?.split("/")
                  .pop()
                  ?.toUpperCase() ||
                "FILE",

              size:
                formatFileSize(
                  file.size
                ),

              uploadedBy:
                file.uploadedBy?.name ||
                "Unknown",

              uploadedAt:
                file.createdAt
                  ? formatDate(
                      file.createdAt
                    )
                  : "Unknown",

              url:
                file.fileUrl ||
                file.url,
            }));


          setProjectFiles(
            formattedFiles
          );

        } catch (error) {
          console.error(
            "Fetch project files error:",
            error
          );

          setFilesError(
            error.message ||
              "Unable to load project files."
          );

        } finally {
          setFilesLoading(false);
        }
      },
      [
        workspaceId,
        projectId,
      ]
    );

    // ==========================================
    // FETCH PROJECT TASKS
    // ==========================================

    const fetchProjectTasks = useCallback(
      async () => {
        if (!workspaceId || !projectId) {
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load project tasks."
            );
          }

          const fetchedTasks =
            data?.tasks ||
            data?.data ||
            [];

          setTasks(
            Array.isArray(fetchedTasks)
              ? fetchedTasks
              : []
          );
        } catch (error) {
          console.error(
            "Fetch project tasks error:",
            error
          );
        }
      },
      [
        workspaceId,
        projectId,
      ]
    );

    // ==========================================
    // FETCH PROJECT MEMBERS
    // ==========================================

    const fetchProjectMembers = useCallback(
      async () => {
        if (!workspaceId || !projectId) {
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load project members."
            );
          }

          const fetchedMembers =
            data?.members ||
            data?.data ||
            [];

          setMembers(
            Array.isArray(fetchedMembers)
              ? fetchedMembers
              : []
          );
        } catch (error) {
          console.error(
            "Fetch project members error:",
            error
          );
        }
      },
      [
        workspaceId,
        projectId,
      ]
    );


  // ==========================================
  // FETCH PROJECT ACTIVITY
  // ==========================================

  const fetchProjectActivity = useCallback(
    async () => {
      if (!workspaceId || !projectId) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/activity`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          // Activity endpoint may not exist yet. Keep the page usable
          // and fall back to activities returned with the project.
          return;
        }

        const data = await response.json();

        const fetchedActivities =
          data?.activities ||
          data?.data ||
          [];

        if (Array.isArray(fetchedActivities)) {
          setActivities(fetchedActivities);
        }
      } catch (error) {
        console.error(
          "Fetch project activity error:",
          error
        );
      }
    },
    [workspaceId, projectId]
  );


  // ==========================================
  // INITIAL LOAD
  // ==========================================


  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    fetchProjectFiles();
  }, [fetchProjectFiles]);

  useEffect(() => {
    fetchProjectTasks();
  }, [fetchProjectTasks]);

  useEffect(() => {
    fetchProjectMembers();
  }, [fetchProjectMembers]);

  useEffect(() => {
    fetchProjectActivity();
  }, [fetchProjectActivity]);


  // ==========================================
  // PROJECT VALUES
  // ==========================================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter((task) => {
    const status = String(task.status || "").toLowerCase();
    return [
      "done",
      "completed",
    ].includes(status);
  }).length;

  const projectProgress =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;


  // ==========================================
  // MEMBERS COUNT
  // ==========================================

  const memberCount = members.length;


  // ==========================================
  // PROJECT NAME
  // ==========================================

  const projectName =
    project?.name ||
    "Project";


  // ==========================================
  // WORKSPACE NAME
  // ==========================================

  const workspaceName =
    workspace?.name ||
    project?.workspace?.name ||
    project?.workspaceName ||
    "Workspace";


  // ==========================================
  // TASK DATA
  // ==========================================

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const status = String(
          task.status || ""
        ).toLowerCase();

        return ![
          "done",
          "completed",
        ].includes(status);
      })
      .sort((a, b) => {
        const dateA = a.dueDate
          ? new Date(a.dueDate).getTime()
          : Infinity;

        const dateB = b.dueDate
          ? new Date(b.dueDate).getTime()
          : Infinity;

        return dateA - dateB;
      })
      .slice(0, 5);
  }, [tasks]);


  // ==========================================
  // ACTIVITY DATA
  // ==========================================

  const recentActivities = useMemo(() => {
    const source =
      activities.length > 0
        ? activities
        : Array.isArray(project?.activities)
        ? project.activities
        : [];

    return [...source].sort((a, b) => {
      const dateA = a?.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const dateB = b?.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [activities, project?.activities]);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="animate-pulse">

          <div className="h-4 w-36 rounded bg-slate-800" />

          <div className="mt-6 h-10 w-72 rounded bg-slate-800" />

          <div className="mt-3 h-5 w-[500px] max-w-full rounded bg-slate-800" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            {[
              1,
              2,
              3,
              4,
              5,
            ].map((item) => (
              <div
                key={item}
                className="h-36 rounded-xl border border-slate-800 bg-slate-900/40"
              />
            ))}

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

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">

              <AlertCircle
                size={25}
                className="text-red-400"
              />

            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              Unable to load project
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchProject}
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
    );
  }


  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* =====================================
          BACK
      ====================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            `/workspaces/${workspaceId}/projects`
          )
        }
        className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-300"
      >
        <ArrowLeft size={15} />

        Back to projects
      </button>


      {/* =====================================
          PROJECT HEADER
      ====================================== */}

      <section className="mb-7">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">

              <FolderKanban
                size={25}
                className="text-indigo-400"
              />

            </div>


            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {projectName}
                </h1>


                {project?.status && (
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-400">
                    {project.status}
                  </span>
                )}


                {project?.priority && (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400">
                    {project.priority}{" "}
                    priority
                  </span>
                )}

              </div>


              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                {project?.description ||
                  "No project description provided."}
              </p>


              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">

                <span>
                  Workspace:{" "}
                  <span className="text-slate-300">
                    {workspaceName}
                  </span>
                </span>


                <span>
                  Started{" "}
                  {formatDate(
                    project?.startDate
                  )}
                </span>

              </div>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <MoreHorizontal size={17} />
              More
            </button>


            {/* MEMBERS */}

            <button
              type="button"
              onClick={() =>
                setShowMembersModal(true)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
            >
              <Users size={16} />
              Members
            </button>


            {/* DOCUMENTS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}/documents`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
            >
              <FileText size={16} />
              Documents
            </button>


            {/* BOARD */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}/board`
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <FolderKanban size={16} />
              Open Board
            </button>


            {/* ADD TASK */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}/tasks`
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Plus size={17} />
              Add Task
            </button>

          </div>

        </div>

      </section>


      {/* =====================================
          PROJECT STATISTICS
      ====================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <StatCard
          icon={ListTodo}
          label="Total Tasks"
          value={totalTasks}
          description="Tasks in this project"
        />


        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completedTasks}
          description={`${Math.max(
            totalTasks -
              completedTasks,
            0
          )} remaining`}
        />


        <StatCard
          icon={Users}
          label="Members"
          value={memberCount}
          description="People working on project"
        />


        <StatCard
          icon={CalendarDays}
          label="Due Date"
          value={
            project?.dueDate
              ? formatDate(
                  project.dueDate
                )
              : "No deadline"
          }
          description="Project deadline"
        />


        {/* FILES */}

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">

            <FolderOpen
              size={18}
              className="text-indigo-400"
            />

          </div>


          <p className="mt-4 text-xs text-slate-500">
            Files
          </p>


          <p className="mt-1 text-2xl font-semibold text-white">
            {projectFiles.length}
          </p>


          <p className="mt-1 text-[10px] text-slate-600">
            Project files
          </p>


          <button
            type="button"
            onClick={async () => {
              setShowFilesModal(
                true
              );

              await fetchProjectFiles();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-3 py-2 text-[10px] font-semibold text-indigo-300 transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-200"
          >
            <FolderOpen
              size={13}
            />

            Open Files
          </button>

        </div>

      </section>


      {/* =====================================
          PROJECT WORK AREA
      ====================================== */}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ===================================
            PROJECT PROGRESS
        ==================================== */}

        <div className="flex h-[500px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-5">

          <div className="flex shrink-0 items-start justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Activity
                    size={17}
                    className="text-indigo-400"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Project Progress
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Overall completion of project tasks
                  </p>
                </div>
              </div>

            </div>

            <span className="text-2xl font-semibold text-white">
              {projectProgress}%
            </span>

          </div>


          <div className="mt-7 shrink-0">

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.max(projectProgress, 0),
                    100
                  )}%`,
                }}
              />

            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>{completedTasks} completed</span>
              <span>
                {Math.max(
                  totalTasks - completedTasks,
                  0
                )} remaining
              </span>
            </div>

          </div>


          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">

            <DateCard
              label="Start date"
              value={
                project?.startDate
                  ? formatDate(project.startDate)
                  : "No start date"
              }
            />

            <DateCard
              label="Due date"
              value={
                project?.dueDate
                  ? formatDate(project.dueDate)
                  : "No deadline"
              }
            />

          </div>


          <div className="mt-auto border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Task completion</span>
              <span className="font-medium text-indigo-400">
                {completedTasks} / {totalTasks}
              </span>
            </div>
          </div>

        </div>


        {/* ===================================
            UPCOMING TASKS
        ==================================== */}

        <div className="flex h-[500px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">

          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                <ListTodo
                  size={17}
                  className="text-indigo-400"
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate font-semibold text-white">
                  Upcoming Tasks
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Tasks that need attention
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}/tasks`
                )
              }
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              View all
              <ArrowRight size={13} />
            </button>

          </div>


          <div className="min-h-0 flex-1 overflow-y-auto">

            {upcomingTasks.length > 0 ? (

              <div className="divide-y divide-slate-800">

                {upcomingTasks.map((task, index) => (

                  <div
                    key={
                      task._id ||
                      task.id ||
                      index
                    }
                    className="group p-4 transition hover:bg-slate-900/70"
                  >

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 transition group-hover:bg-indigo-500/10">
                        <ListTodo
                          size={14}
                          className="text-slate-500 transition group-hover:text-indigo-400"
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="truncate text-sm font-medium text-slate-200 group-hover:text-white">
                          {task.title ||
                            task.name ||
                            "Untitled task"}
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          Assigned to{" "}
                          {task.assignee?.name ||
                            task.assignedTo?.name ||
                            task.assignee ||
                            "Unassigned"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-400">
                            {task.status || "To Do"}
                          </span>

                          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400">
                            {task.priority || "Medium"}
                          </span>

                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock3 size={12} />
                            {task.due
                              ? formatDate(task.due)
                              : task.dueDate
                              ? formatDate(task.dueDate)
                              : "No deadline"}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <EmptySection
                icon={ListTodo}
                title="No upcoming tasks"
                description="Tasks will appear here once they are created for this project."
                compact
              />

            )}

          </div>

        </div>


        {/* ===================================
            PROJECT ACTIVITY
        ==================================== */}


        <div className="flex h-[500px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">

          <div className="flex shrink-0 items-center gap-3 border-b border-slate-800 px-5 py-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Activity
                size={17}
                className="text-indigo-400"
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-white">
                Project Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Recent activity from this project
              </p>
            </div>

          </div>


          <div className="min-h-0 flex-1 overflow-y-auto">

            {recentActivities.length > 0 ? (

              <div className="relative px-5 py-4">

                <div className="absolute bottom-5 left-[36px] top-5 w-px bg-slate-800" />

                <div className="space-y-1">

                  {recentActivities.map((activity, index) => {
                    const actorName =
                      activity?.name ||
                      activity?.user?.name ||
                      activity?.actor?.name ||
                      "User";

                    const action =
                      activity?.action ||
                      activity?.message ||
                      "performed an action";

                    const target =
                      activity?.target ||
                      activity?.entityName ||
                      activity?.metadata?.target ||
                      "";

                    const time =
                      activity?.time ||
                      activity?.createdAt;

                    return (
                      <div
                        key={
                          activity?._id ||
                          activity?.id ||
                          index
                        }
                        className="relative flex gap-3 rounded-lg p-2 transition hover:bg-slate-900/70"
                      >

                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-[10px] font-semibold text-indigo-300">
                          {getInitials(actorName)}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">

                          <p className="text-xs leading-5 text-slate-400">
                            <span className="font-medium text-slate-200">
                              {actorName}
                            </span>{" "}
                            {action}{" "}
                            {target && (
                              <span className="font-medium text-slate-300">
                                {target}
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-600">
                            {time
                              ? formatActivityTime(time)
                              : "Recently"}
                          </p>

                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>

            ) : (

              <EmptySection
                icon={Activity}
                title="No recent activity"
                description="Project activity will appear here as your team works."
                compact
              />

            )}

          </div>

        </div>

      </section>


      <div className="h-8" />


      {/* =====================================
          FILES MODAL
      ====================================== */}

      {showFilesModal && (
        <ProjectFilesModal
          files={projectFiles}
          setFiles={setProjectFiles}
          projectName={projectName}
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() =>
            setShowFilesModal(false)
          }
        />
      )}


      {/* =====================================
          MEMBERS MODAL
      ====================================== */}

      <ProjectMembersModal
        isOpen={showMembersModal}
        onClose={() =>
          setShowMembersModal(false)
        }
        workspaceId={workspaceId}
        projectId={projectId}
        projectName={projectName}
        currentUserId={user?.id}
      />

    </div>
  );
};


// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">

      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">

        <Icon
          size={18}
          className="text-indigo-400"
        />

      </div>


      <p className="mt-4 text-xs text-slate-500">
        {label}
      </p>


      <p className="mt-1 text-2xl font-semibold text-white">
        {value}
      </p>


      <p className="mt-1 text-[11px] text-slate-600">
        {description}
      </p>

    </div>
  );
};


// ==========================================
// DATE CARD
// ==========================================

const DateCard = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4">

      <div className="flex items-center gap-2 text-xs text-slate-500">

        <CalendarDays
          size={14}
        />

        {label}

      </div>


      <p className="mt-2 text-sm font-medium text-slate-300">
        {value}
      </p>

    </div>
  );
};


// ==========================================
// EMPTY SECTION
// ==========================================

const EmptySection = ({
  icon: Icon,
  title,
  description,
  compact = false,
}) => {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center px-5 text-center ${
        compact ? "py-8" : "py-14"
      }`}
    >

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">

        <Icon
          size={21}
          className="text-slate-500"
        />

      </div>


      <h3 className="mt-4 text-sm font-semibold text-slate-300">
        {title}
      </h3>


      <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">
        {description}
      </p>

    </div>
  );
};


export default ProjectDetails;