import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  FolderKanban,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Users,
  X,
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

import TaskDetailsModal from "../components/tasks/TaskDetailsModal";
import { useAuth } from "../context/AuthContext";


// ==========================================
// API
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// ==========================================
// BOARD COLUMNS
// ==========================================

const columns = [
  {
    id: "todo",
    title: "To Do",
    icon: Circle,
    iconClass: "text-slate-400",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: Clock3,
    iconClass: "text-indigo-400",
  },
  {
    id: "review",
    title: "In Review",
    icon: Users,
    iconClass: "text-amber-400",
  },
  {
    id: "done",
    title: "Done",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
  },
];


// ==========================================
// STATUS NORMALIZER
// ==========================================

const normalizeStatus = (status) => {
  if (!status) return "todo";

  const value = String(status)
    .toLowerCase()
    .trim();

  if (
    value === "todo" ||
    value === "to do" ||
    value === "pending"
  ) {
    return "todo";
  }

  if (
    value === "in-progress" ||
    value === "in progress" ||
    value === "in_progress"
  ) {
    return "in-progress";
  }

  if (
    value === "review" ||
    value === "in review" ||
    value === "in-review"
  ) {
    return "review";
  }

  if (
    value === "done" ||
    value === "completed" ||
    value === "complete"
  ) {
    return "done";
  }

  return "todo";
};


// ==========================================
// DATE FORMATTER
// ==========================================

const formatDate = (date) => {
  if (!date) return "No date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};


// ==========================================
// TASK NORMALIZER
// ==========================================

const normalizeTask = (task, projectMembers = []) => {
  if (!task) return null;

  const rawAssignee =
    task.assignee ??
    task.assignedTo ??
    task.user ??
    task.assigneeId ??
    task.assignedToId ??
    null;

  const rawAssigneeId =
    typeof rawAssignee === "object"
      ? (
          rawAssignee?.userId ||
          rawAssignee?.user?._id ||
          rawAssignee?.user?.id ||
          rawAssignee?._id ||
          rawAssignee?.id ||
          ""
        )
      : String(rawAssignee || "");

  const member = projectMembers.find((item) => {
    const memberUserId =
      item?.userId ||
      item?.user?._id ||
      item?.user?.id;

    const memberId =
      item?.id ||
      item?._id;

    return (
      String(memberUserId || "") ===
        String(rawAssigneeId) ||
      String(memberId || "") ===
        String(rawAssigneeId)
    );
  });

  // IMPORTANT:
  // Always store the actual USER ID in task.assigneeId.
  const assigneeId = String(
    member?.userId ||
    member?.user?._id ||
    member?.user?.id ||
    rawAssigneeId ||
    ""
  );

  const assigneeName =
    typeof rawAssignee === "object"
      ? (
          rawAssignee?.name ||
          rawAssignee?.fullName ||
          rawAssignee?.username ||
          ""
        )
      : member?.name ||
        member?.fullName ||
        member?.username ||
        "";

  return {
    ...task,

    id: task._id || task.id,

    title:
      task.title ||
      task.name ||
      "Untitled task",

    description:
      task.description || "",

    status:
      normalizeStatus(task.status),

    priority:
      task.priority || "Medium",

    assignee:
      assigneeName || "Unassigned",

    assigneeId,

    dueDate:
      task.dueDate ||
      task.due ||
      null,

    comments:
      task.commentsCount ??
      task.commentCount ??
      (Array.isArray(task.comments)
        ? task.comments.length
        : 0),
  };
};

const getAssignedUserName = (
  assignee,
  members = []
) => {
  if (!assignee) {
    return "Unassigned";
  }

  if (typeof assignee === "string") {
    const value = assignee.trim();

    if (!value) {
      return "Unassigned";
    }

    // If the string is a user ID, resolve it.
    const member = members.find((member) => {
      const user =
        member?.user ||
        member?.member ||
        member;

      const userId =
        user?._id ||
        user?.id ||
        user?.userId ||
        member?.userId ||
        member?.memberId ||
        member?.id ||
        "";

      return (
        String(userId) === String(value)
      );
    });

    if (member) {
      const user =
        member?.user ||
        member?.member ||
        member;

      return (
        user?.name ||
        user?.fullName ||
        user?.username ||
        user?.email ||
        value
      );
    }

    // Otherwise it is already a display name.
    return value;
  }

  if (typeof assignee === "object") {
    return (
      assignee?.name ||
      assignee?.fullName ||
      assignee?.username ||
      assignee?.email ||
      assignee?.user?.name ||
      assignee?.user?.fullName ||
      assignee?.user?.username ||
      assignee?.user?.email ||
      "Unassigned"
    );
  }

  return "Unassigned";
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};


// ==========================================
// PROJECT BOARD
// ==========================================

const ProjectBoard = () => {
  const {
    workspaceId,
    projectId,
  } = useParams();

  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    null;


  // ==========================================
  // STATE
  // ==========================================

  const [project, setProject] =
    useState(null);

  const [tasks, setTasks] =
    useState([]);

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [priorityFilter, setPriorityFilter] =
    useState("All");

  const [assigneeFilter, setAssigneeFilter] =
    useState("All");

  const [filterOpen, setFilterOpen] =
    useState(false);


  const [createTaskOpen, setCreateTaskOpen] =
    useState(false);

  const [newTaskStatus, setNewTaskStatus] =
    useState("todo");


  const [draggedTaskId, setDraggedTaskId] =
    useState(null);

  const [selectedTask, setSelectedTask] =
    useState(null);


  


  // ==========================================
  // FETCH PROJECT
  // ==========================================

  const fetchProject = useCallback(
    async () => {
      const response =
        await fetch(
          `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}`,
          {
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        !contentType?.includes(
          "application/json"
        )
      ) {
        throw new Error(
          "Server returned an unexpected project response."
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load project."
        );
      }

      const fetchedProject =
        data?.project ||
        data?.data ||
        data;

      setProject(
        fetchedProject
      );

      return fetchedProject;
    },
    [
      workspaceId,
      projectId,
    ]
  );


  // ==========================================
  // FETCH TASKS
  // ==========================================

  const fetchTasks = useCallback(
  async (projectMembers = []) => {
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      {
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

    const rawTasks =
      data?.tasks ||
      data?.data ||
      [];

    setTasks(
      Array.isArray(rawTasks)
        ? rawTasks.map((task) =>
            normalizeTask(
              task,
              projectMembers
            )
          )
        : []
    );
  },
  [
    workspaceId,
    projectId,
  ]
);


  // ==========================================
  // FETCH PROJECT MEMBERS
  // ==========================================

  const fetchMembers = useCallback(
    async () => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members`,
            {
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

        if (
          !contentType?.includes(
            "application/json"
          )
        ) {
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          return;
        }

        const rawMembers =
          data?.members ||
          data?.data ||
          [];

        const projectMembers =
          Array.isArray(rawMembers)
            ? rawMembers
            : [];

          

        setMembers(projectMembers);

        return projectMembers;
      } catch (error) {
        // Member loading should not
        // break the board.
        console.warn(
          "Project members could not be loaded:",
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
  // INITIAL LOAD
  // ==========================================

  const loadBoard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          fetchedProject,
          fetchedMembers,
        ] = await Promise.all([
          fetchProject(),
          fetchMembers(),
        ]);

        if (fetchedProject) {
          setProject(fetchedProject);
        }

        await fetchTasks(
          Array.isArray(fetchedMembers)
            ? fetchedMembers
            : []
        );
      } catch (error) {
        console.error(
          "Load project board error:",
          error
        );

        setError(
          error.message ||
            "Unable to load project board."
        );
      } finally {
        setLoading(false);
      }
    }, [
      fetchProject,
      fetchTasks,
      fetchMembers,
    ]);


  useEffect(() => {
    loadBoard();
  }, [loadBoard]);


  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const assigneeOptions =
    useMemo(() => {
      const values = new Map();

      tasks.forEach((task) => {
        if (
          task.assignee &&
          task.assignee !==
            "Unassigned"
        ) {
          values.set(
            task.assignee,
            task.assignee
          );
        }
      });

      members.forEach((member) => {
        const user =
          member.user ||
          member;

        const name =
          user?.name ||
          user?.fullName;

        if (name) {
          values.set(
            name,
            name
          );
        }
      });

      return Array.from(
        values.values()
      ).sort();
    }, [
      tasks,
      members,
    ]);


  // ==========================================
  // FILTERED TASKS
  // ==========================================

  const filteredTasks =
    useMemo(() => {
      return tasks.filter(
        (task) => {
          const priorityMatches =
            priorityFilter === "All" ||
            task.priority ===
              priorityFilter;

          const assigneeMatches =
            assigneeFilter === "All" ||
            task.assignee ===
              assigneeFilter;

          return (
            priorityMatches &&
            assigneeMatches
          );
        }
      );
    }, [
      tasks,
      priorityFilter,
      assigneeFilter,
    ]);


  // ==========================================
  // CREATE TASK
  // ==========================================

  const handleCreateTask =
    async (taskData) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify(
                taskData
              ),
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          );

        const data =
          contentType?.includes(
            "application/json"
          )
            ? await response.json()
            : {};

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to create task."
          );
        }

        const createdTask =
          data?.task ||
          data?.data;

        if (createdTask) {
          setTasks(
            (previous) => [
              normalizeTask(
                createdTask,
                members
              ),
              ...previous,
            ]
          );
        } else {
          await fetchTasks(members);
        }

        setCreateTaskOpen(false);
      } catch (error) {
        console.error(
          "Create task error:",
          error
        );

        alert(
          error.message ||
            "Unable to create task."
        );
      }
    };


  // ==========================================
  // MOVE TASK
  // ==========================================

  const moveTask = async (
    taskId,
    newStatus
  ) => {
    const previousTasks = tasks;

    setTasks(
      (previous) =>
        previous.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
                  status:
                    newStatus,
                }
              : task
        )
    );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        );

      const data =
        contentType?.includes(
          "application/json"
        )
          ? await response.json()
          : {};

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update task status."
        );
      }

      const updatedTask =
        data?.task ||
        data?.data;

      if (updatedTask) {
        setTasks(
          (previous) =>
            previous.map(
              (task) =>
                task.id === taskId
                  ? normalizeTask(
                      updatedTask,
                      members
                    )
                  : task
            )
        );
      }
    } catch (error) {
      console.error(
        "Move task error:",
        error
      );

      setTasks(
        previousTasks
      );

      alert(
        error.message ||
          "Unable to update task."
      );
    }
  };

  // ==========================================
  // PROJECT MEMBER / ROLE HELPERS
  // ==========================================

  const getMemberUser = (member) => {
    return (
      member?.user ||
      member?.member ||
      member
    );
  };


  const getMemberUserId = (member) => {
  return member?.userId || null;
};


  const getMemberRole = (member) => {
    const memberUser =
      getMemberUser(member);

    return (
      member?.role ||
      member?.memberRole ||
      memberUser?.role ||
      memberUser?.memberRole ||
      ""
    );
  };


  const getMemberStatus = (member) => {
    return (
      member?.status ||
      member?.memberStatus ||
      member?.user?.status ||
      "Active"
    );
  };


  // ==========================================
  // CURRENT PROJECT MEMBER
  // ==========================================

  const currentProjectMember = useMemo(() => {
    if (!currentUserId || !Array.isArray(members)) {
      return null;
    }

    return (
      members.find(
        (member) =>
          String(member.userId) ===
          String(currentUserId)
      ) || null
    );
  }, [
    members,
    currentUserId,
  ]);


  // ==========================================
  // CURRENT USER ROLE
  // ==========================================

  const currentMemberRole = useMemo(() => {
    return String(
      getMemberRole(
        currentProjectMember
      ) || ""
    )
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }, [
    currentProjectMember,
  ]);


  // ==========================================
  // PROJECT MANAGER CHECK
  // ==========================================

  const isProjectManager = useMemo(() => {
    if (!currentProjectMember) {
      return false;
    }

    return (
      String(currentProjectMember.role)
        .trim()
        .toLowerCase() ===
      "project manager"
    );
  }, [
    currentProjectMember,
  ]);


  // ==========================================
  // ACTIVE PROJECT MEMBER CHECK
  // ==========================================

  const isProjectMember = useMemo(() => {
    if (!currentProjectMember) {
      return false;
    }

    return (
      currentProjectMember.status !==
      "Suspended"
    );
  }, [
    currentProjectMember,
  ]);


  useEffect(() => {
  console.log(
    "========== PROJECT MEMBER DEBUG =========="
  );

  console.log(
    "Current User ID:",
    currentUserId
  );

  console.log(
    "Members:",
    JSON.stringify(members, null, 2)
  );

  console.log(
    "Current Project Member:",
    currentProjectMember
  );

  console.log(
    "=========================================="
  );
}, [
  currentUserId,
  members,
  currentProjectMember,
]);

// ==========================================
// CAN USER MOVE THIS TASK?
// ==========================================

const canMoveTask = useCallback(
  (task) => {
    if (!task) {
      return false;
    }

    // User must be an active project member
    if (!isProjectMember) {
      return false;
    }

    // Project Manager can move ANY task
    if (isProjectManager) {
      return true;
    }

    // Normal project member can move
    // ONLY their own assigned task
    if (!task.assigneeId) {
      return false;
    }

    return (
      String(task.assigneeId) ===
      String(currentUserId)
    );
  },
  [
    currentUserId,
    isProjectManager,
    isProjectMember,
  ]
);


// ==========================================
// VALID STATUS TRANSITIONS
// ==========================================

const canMoveToStatus = useCallback(
  (task, newStatus) => {
    if (!task) {
      return false;
    }

    const currentStatus =
      normalizeStatus(task.status);

    // PM has full control
    if (isProjectManager) {
      return true;
    }

    // Only assignee can progress own task
    const isAssignee =
      !!task.assigneeId &&
      String(task.assigneeId) ===
        String(currentUserId);

    if (!isAssignee) {
      return false;
    }

    // TODO → IN PROGRESS
    if (
      currentStatus === "todo" &&
      newStatus === "in-progress"
    ) {
      return true;
    }

    // IN PROGRESS → REVIEW
    if (
      currentStatus === "in-progress" &&
      newStatus === "review"
    ) {
      return true;
    }

    // REVIEW → DONE
    // PM only
    return false;
  },
  [
    currentUserId,
    isProjectManager,
  ]
);
// ==========================================
// DRAG START
// ==========================================

const handleDragStart = (event, taskId) => {
  const task = tasks.find(
    (item) => String(item.id) === String(taskId)
  );

  if (!task) {
    event.preventDefault();
    return;
  }

  // HARD permission check
  if (!canMoveTask(task)) {
    event.preventDefault();
    event.stopPropagation();

    setDraggedTaskId(null);

    alert(
      isProjectMember
        ? "You can't change this task's status. Only the Project Manager or the assigned user can move it."
        : "You are not a project member and cannot change task status."
    );

    return;
  }

  // Only authorized users reach this point
  setDraggedTaskId(taskId);

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    String(taskId)
  );
};


  // ==========================================
  // DROP
  // ==========================================

  const handleDrop = (
    event,
    newStatus
  ) => {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData(
        "text/plain"
      ) || draggedTaskId;

    if (!taskId) {
      return;
    }

    const task = tasks.find(
      (item) =>
        item.id === taskId
    );

    if (!task) {
      setDraggedTaskId(null);
      return;
    }

    // ----------------------------------------
    // PERMISSION CHECK
    // ----------------------------------------

    if (!canMoveTask(task)) {
      alert(
        "You can't change this task's status. Only the Project Manager or the assigned user can move it."
      );

      setDraggedTaskId(null);
      return;
    }

    // ----------------------------------------
    // TRANSITION CHECK
    // ----------------------------------------

    if (
      !canMoveToStatus(
        task,
        newStatus
      )
    ) {
      let message =
        "This status change is not allowed.";

      if (
        task.status === "review" &&
        newStatus === "done"
      ) {
        message =
          "This task is waiting for Project Manager approval.";
      } else if (
        !isProjectManager &&
        task.status === "todo" &&
        newStatus !== "in-progress"
      ) {
        message =
          "You can only start your task by moving it to In Progress.";
      } else if (
        !isProjectManager &&
        task.status === "in-progress" &&
        newStatus !== "review"
      ) {
        message =
          "You can only send your task for review.";
      }

      alert(message);

      setDraggedTaskId(null);
      return;
    }

    // Same column
    if (
      task.status === newStatus
    ) {
      setDraggedTaskId(null);
      return;
    }

    moveTask(
      taskId,
      newStatus
    );

    setDraggedTaskId(null);
  };


  // ==========================================
  // COLUMN TASKS
  // ==========================================

  const getColumnTasks = (
    columnId
  ) => {
    return filteredTasks.filter(
      (task) =>
        task.status ===
        columnId
    );
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1800px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="animate-pulse">

          <div className="h-10 w-64 rounded-lg bg-slate-800" />

          <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-800" />

          <div className="mt-8 grid min-w-[1100px] grid-cols-4 gap-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-[650px] rounded-xl border border-slate-800 bg-slate-950/30"
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
      <div className="mx-auto max-w-[1800px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="flex min-h-[550px] items-center justify-center">

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
              onClick={loadBoard}
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


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto max-w-[1800px] px-5 py-7 sm:px-8 lg:px-10">

      {/* HEADER */}

      <section className="mb-7">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">

              <FolderKanban
                size={23}
                className="text-indigo-400"
              />

            </div>

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {project?.name ||
                    "Project"}
                </h1>

                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-400">
                  {tasks.length}{" "}
                  {tasks.length === 1
                    ? "task"
                    : "tasks"}
                </span>

              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                {project?.description ||
                  "Organize and track project tasks through each stage."}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Workspace:{" "}
                <span className="text-slate-400">
                  {project?.workspace?.name ||
                    project?.workspaceName ||
                    "Workspace"}
                </span>
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}`
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Project details
            </button>

            <button
              type="button"
              onClick={() => {
                setNewTaskStatus(
                  "todo"
                );
                setCreateTaskOpen(
                  true
                );
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400"
            >
              <Plus size={17} />
              Add Task
            </button>

          </div>

        </div>

      </section>


      {/* TOOLBAR */}

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <button
          type="button"
          onClick={() =>
            setFilterOpen(
              !filterOpen
            )
          }
          className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
            filterOpen ||
            priorityFilter !==
              "All" ||
            assigneeFilter !==
              "All"
              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
              : "border-slate-800 bg-slate-950/40 text-slate-500 hover:bg-slate-900 hover:text-slate-300"
          }`}
        >
          <Filter size={14} />
          Filters
        </button>

        <p className="text-xs text-slate-600">
          Drag tasks between columns to update their status.
        </p>

      </section>


      {/* FILTER PANEL */}

      {filterOpen && (
        <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900/50 p-4">

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-2 block text-xs font-medium text-slate-400">
                Priority
              </label>

              <select
                value={
                  priorityFilter
                }
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="All">
                  All priorities
                </option>

                <option value="Critical">
                  Critical
                </option>

                <option value="High">
                  High
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Low">
                  Low
                </option>
              </select>

            </div>


            <div>

              <label className="mb-2 block text-xs font-medium text-slate-400">
                Assignee
              </label>

              <select
                value={
                  assigneeFilter
                }
                onChange={(event) =>
                  setAssigneeFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
              >

                <option value="All">
                  All members
                </option>

                {assigneeOptions.map(
                  (name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </section>
      )}


      {/* BOARD */}

      <section className="overflow-x-auto pb-5">

        <div className="grid min-w-[1100px] grid-cols-4 gap-4">

          {columns.map(
            (column) => {

              const columnTasks =
                getColumnTasks(
                  column.id
                );

              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onTaskClick={setSelectedTask}
                  members={members}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  onDrop={handleDrop}
                  onDragStart={handleDragStart}
                  draggedTaskId={draggedTaskId}
                  canMoveTask={canMoveTask}
                />
              );
            }
          )}

        </div>

      </section>


      {/* CREATE TASK */}

      {createTaskOpen && (
        <CreateTaskModal
          initialStatus={newTaskStatus}
          members={members}
          onClose={() => setCreateTaskOpen(false)}
          onCreate={handleCreateTask}
          isProjectManager={isProjectManager}
        />
      )}


      {/* TASK DETAILS */}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          workspaceId={workspaceId}
          projectId={projectId}
          members={members}
          onTaskUpdated={(updatedTask) => {
            setTasks((previous) =>
              previous.map((task) =>
                task.id === (updatedTask._id || updatedTask.id)
                  ? normalizeTask(updatedTask)
                  : task
              )
            );
          }}
          onTaskDeleted={(taskId) => {
            setTasks((previous) =>
              previous.filter((task) => task.id !== taskId)
            );

            setSelectedTask(null);
          }}
      />)}

    </div>
  );
};


// ==========================================
// KANBAN COLUMN
// ==========================================

const KanbanColumn = ({
  column,
  tasks,
  onTaskClick,
  onDrop,
  members,
  onDragStart,
  draggedTaskId,
  onAddTask,
  workspaceId,
  projectId,
  canMoveTask
}) => {
  const Icon =
    column.icon;

  return (
    <div
      className="flex min-h-[650px] flex-col rounded-xl border border-slate-800 bg-slate-950/30"
      onDragOver={(event) =>
        event.preventDefault()
      }
      onDrop={(event) =>
        onDrop(
          event,
          column.id
        )
      }
    >

      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">

        <div className="flex items-center gap-2.5">

          <Icon
            size={16}
            className={
              column.iconClass
            }
          />

          <h2 className="text-xs font-semibold text-slate-200">
            {column.title}
          </h2>

          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {tasks.length}
          </span>

        </div>

        <button
          type="button"
          onClick={onAddTask}
          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
          title="Add task"
        >
          <Plus size={15} />
        </button>

      </div>


      <div className="flex flex-1 flex-col gap-3 p-3">

        {tasks.map(
          (task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onTaskClick={onTaskClick}
              onDragStart={onDragStart}
              isDragging={
                draggedTaskId === task.id
              }
              canDrag={canMoveTask(task)}
            />
          )
        )}


        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-800">
            <p className="text-xs text-slate-600">
              No tasks here
            </p>
          </div>
        )}

      </div>


      <button
        type="button"
        onClick={onAddTask}
        className="m-3 inline-flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/5 hover:text-indigo-300"
      >
        <Plus size={15} />
        Add Task
      </button>

    </div>
  );
};


// ==========================================
// TASK CARD
// ==========================================

const TaskCard = ({
  task,
  members = [],
  onTaskClick,
  onDragStart,
  isDragging,
  canDrag,
}) => {
  const priorityStyles = {
    Critical: "bg-red-500/10 text-red-400",
    High: "bg-red-500/10 text-red-400",
    Medium: "bg-amber-500/10 text-amber-400",
    Low: "bg-blue-500/10 text-blue-400",
  };

  const isDraggable = Boolean(canDrag);

  return (
    <div
      draggable={isDraggable}
      onDragStart={(event) => {
        event.stopPropagation();

        onDragStart(
          event,
          task.id
        );
      }}
      onClick={() => {
        if (onTaskClick) {
          onTaskClick(task);
        }
      }}
      className={`
        group
        rounded-lg
        border
        border-slate-800
        bg-slate-950/80
        p-4
        shadow-sm
        transition

        ${
          isDraggable
            ? "cursor-grab hover:border-indigo-500/30 hover:bg-slate-900 active:cursor-grabbing"
            : "cursor-not-allowed opacity-90"
        }

        ${
          isDragging
            ? "opacity-40"
            : ""
        }
      `}
    >

      {/* HEADER */}

      <div className="flex items-start justify-between gap-2">

        <div className="flex min-w-0 items-start gap-2">

          <GripVertical
            size={14}
            className={`
              mt-0.5
              shrink-0
              ${
                canDrag
                  ? "text-slate-600 group-hover:text-indigo-400"
                  : "text-slate-800"
              }
            `}
          />

          {!canDrag && (
            <span
              className="
                rounded-md
                border
                border-slate-800
                bg-slate-900
                px-1.5
                py-0.5
                text-[9px]
                text-slate-600
              "
              title="Only the Project Manager or assigned user can move this task"
            >
              Locked
            </span>
          )}

          <h3 className="text-sm font-semibold leading-5 text-slate-200">
            {task.title}
          </h3>

        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="rounded p-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
        >
          <MoreHorizontal size={15} />
        </button>

      </div>


      {/* DESCRIPTION */}

      {task.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
          {task.description}
        </p>
      )}


      {/* PRIORITY */}

      <div className="mt-3">

        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
            priorityStyles[task.priority] ||
            "bg-slate-800 text-slate-400"
          }`}
        >
          {task.priority}
        </span>

      </div>


      {/* FOOTER */}

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">

        <div className="flex min-w-0 items-center gap-2">

          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[9px] font-semibold text-indigo-400">
            {getInitials(
              getAssignedUserName(
                task.assignee,
                members
              )
            )}
          </div>

          <span className="max-w-[100px] truncate text-[10px] text-slate-500">
            {getAssignedUserName(
              task.assignee,
              members
            )}
          </span>

        </div>


        <div className="flex shrink-0 items-center gap-2.5 text-[10px] text-slate-600">

          {task.dueDate && (
            <span className="flex items-center gap-1">

              <CalendarDays size={12} />

              {formatDate(task.dueDate)}

            </span>
          )}

          {task.comments > 0 && (
            <span className="flex items-center gap-1">

              <MessageSquare size={12} />

              {task.comments}

            </span>
          )}

        </div>

      </div>

    </div>
  );
};


// ==========================================
// CREATE TASK MODAL
// ==========================================

const CreateTaskModal = ({
  initialStatus,
  members,
  onClose,
  onCreate,
  isProjectManager,
}) => {
  const [
    formData,
    setFormData,
  ] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignee: "",
    dueDate: "",
    status:
      initialStatus ||
      "todo",
  });


  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  useEffect(() => {
    setFormData(
      (previous) => ({
        ...previous,
        status:
          initialStatus ||
          "todo",
      })
    );
  }, [
    initialStatus,
  ]);


  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setError("");
  };


  const getMemberUser =
    (member) =>
      member?.user ||
      member;


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const title =
        formData.title.trim();

      if (!title) {
        setError(
          "Task title is required."
        );
        return;
      }

      if (title.length < 2) {
        setError(
          "Task title must be at least 2 characters."
        );
        return;
      }

      try {
        setLoading(true);

        const selectedMember =
          members.find(
            (member) => {
              const user =
                getMemberUser(
                  member
                );

              const id =
                user?._id ||
                user?.id;

              return (
                String(id) ===
                String(formData.assignee)
              );
            }
          );

        const selectedUser =
          selectedMember
            ? getMemberUser(
                selectedMember
              )
            : null;

        await onCreate({
          title,
          description: formData.description.trim(),
          priority: formData.priority,
          status: isProjectManager? formData.status:"todo",
          dueDate: formData.dueDate || null,
          assignee: formData.assignee || null,
        });
      } catch (error) {
        console.error(
          "Create task modal error:",
          error
        );

        setError(
          error.message ||
            "Unable to create task."
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-6">

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />


      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">

          <div>

            <h2 className="text-base font-semibold text-white">
              Create task
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Add a new task to{" "}
              {initialStatus ===
              "in-progress"
                ? "In Progress"
                : initialStatus ===
                  "review"
                ? "In Review"
                : initialStatus ===
                  "done"
                ? "Done"
                : "To Do"}
              .
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            <X size={18} />
          </button>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="p-6"
        >

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}


          <div>

            <label className="mb-2 block text-sm font-medium text-slate-200">
              Task title
              <span className="ml-1 text-red-400">
                *
              </span>
            </label>

            <input
              name="title"
              type="text"
              value={
                formData.title
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Implement login page"
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

          </div>


          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium text-slate-200">
              Description
            </label>

            <textarea
              name="description"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              rows={3}
              disabled={loading}
              placeholder="Describe what needs to be done..."
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Priority
              </label>

              <select
                name="priority"
                value={
                  formData.priority
                }
                onChange={
                  handleChange
                }
                disabled={loading}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 outline-none focus:border-indigo-500"
              >

                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Status
              </label>

              {isProjectManager ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="todo">
                    To Do
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="review">
                    In Review
                  </option>

                  <option value="done">
                    Done
                  </option>
                </select>
              ) : (
                <div className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-400">
                  To Do
                </div>
              )}

            </div>

          </div>


          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium text-slate-200">
              Assignee
            </label>

            <select
              name="assignee"
              value={
                formData.assignee
              }
              onChange={
                handleChange
              }
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 outline-none focus:border-indigo-500"
            >

              <option value="">
                Unassigned
              </option>

              {members.map(
                (member) => {
                  const user =
                    getMemberUser(
                      member
                    );

                  const id =
                    user?._id ||
                    user?.id;

                  const name =
                    user?.name ||
                    user?.fullName;

                  if (!id || !name) {
                    return null;
                  }

                  return (
                    <option
                      key={member.id}
                      value={member.userId}
                    >
                      {name}
                    </option>
                  );
                }
              )}

            </select>


            {members.length ===
              0 && (
              <p className="mt-1.5 text-[10px] text-slate-600">
                No project members were returned by the server.
              </p>
            )}

          </div>


          <div className="mt-5">

            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">

              <CalendarDays
                size={14}
              />

              Due date

            </label>

            <input
              name="dueDate"
              type="date"
              value={
                formData.dueDate
              }
              onChange={
                handleChange
              }
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 outline-none focus:border-indigo-500"
            />

          </div>


          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating..."
                : "Create task"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};


export default ProjectBoard;
