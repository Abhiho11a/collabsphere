import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Trash2,
  User,
  Users,
  AlertCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// HELPERS
// =====================================================

const normalizeStatus = (
  status
) => {
  const value =
    String(
      status || ""
    )
      .toLowerCase()
      .trim();

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


const formatDate = (
  value
) => {
  if (!value) {
    return "No date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};


const getInitials = (
  name = ""
) => {
  return String(name)
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


// =====================================================
// TASK DETAILS
// =====================================================

const TaskDetails = () => {
  const {
    workspaceId,
    projectId,
    taskId,
  } = useParams();

  const navigate =
    useNavigate();


  // ===================================================
  // STATE
  // ===================================================

  const [task, setTask] =
    useState(null);

  const [project, setProject] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ===================================================
  // EDIT MODE
  // ===================================================

  const [editMode, setEditMode] =
    useState(false);

  const [editTitle, setEditTitle] =
    useState("");

  const [
    editDescription,
    setEditDescription,
  ] = useState("");


  // ===================================================
  // COMMENTS
  // ===================================================

  const [
    commentText,
    setCommentText,
  ] = useState("");


  // ===================================================
  // MEMBER HELPERS
  // ===================================================

  const getMemberUser =
    useCallback(
      (member) => {
        if (!member) {
          return null;
        }

        if (
          member.user &&
          typeof member.user ===
            "object"
        ) {
          return member.user;
        }

        if (
          member.member &&
          typeof member.member ===
            "object"
        ) {
          return member.member;
        }

        if (
          member.userId &&
          typeof member.userId ===
            "object"
        ) {
          return member.userId;
        }

        return member;
      },
      []
    );


  const getMemberId =
    useCallback(
      (member) => {
        const user =
          getMemberUser(
            member
          );

        return String(
          user?._id ||
            user?.id ||
            member?.userId ||
            member?.memberId ||
            ""
        );
      },
      [getMemberUser]
    );


  const getMemberName =
    useCallback(
      (member) => {
        const user =
          getMemberUser(
            member
          );

        return (
          user?.name ||
          user?.fullName ||
          user?.username ||
          user?.email ||
          ""
        );
      },
      [getMemberUser]
    );


  // ===================================================
  // RESOLVE ASSIGNEE
  // ===================================================

  const resolveAssignee =
    useCallback(
      (rawTask) => {
        if (!rawTask) {
          return {
            id: "",
            name: "Unassigned",
            object: null,
          };
        }

        const rawAssignee =
          rawTask.assignee ??
          rawTask.assignedTo ??
          rawTask.user ??
          null;

        const rawId =
          rawTask.assigneeId ??
          rawTask.assignedToId ??
          rawTask.assignee_id ??
          rawTask.assigned_to ??
          "";

        if (
          rawAssignee &&
          typeof rawAssignee ===
            "object"
        ) {
          return {
            id: String(
              rawAssignee._id ||
                rawAssignee.id ||
                rawAssignee.userId ||
                rawId ||
                ""
            ),
            name:
              rawAssignee.name ||
              rawAssignee.fullName ||
              rawAssignee.username ||
              rawAssignee.email ||
              "Unassigned",
            object:
              rawAssignee,
          };
        }

        const candidateId =
          String(
            rawId ||
              (typeof rawAssignee ===
              "string"
                ? rawAssignee
                : "")
          );

        if (candidateId) {
          const member =
            members.find(
              (item) =>
                getMemberId(item) ===
                candidateId
            );

          if (member) {
            return {
              id: candidateId,
              name:
                getMemberName(
                  member
                ) ||
                "Unassigned",
              object:
                getMemberUser(
                  member
                ),
            };
          }

          if (
            !/^[a-f\d]{24}$/i.test(
              candidateId
            )
          ) {
            return {
              id: "",
              name: candidateId,
              object: null,
            };
          }
        }

        return {
          id: "",
          name: "Unassigned",
          object: null,
        };
      },
      [
        members,
        getMemberId,
        getMemberName,
        getMemberUser,
      ]
    );


  // ===================================================
  // NORMALIZE TASK
  // ===================================================

  const normalizeTask =
    useCallback(
      (rawTask) => {
        if (!rawTask) {
          return null;
        }

        const assignee =
          resolveAssignee(
            rawTask
          );

        const createdBy =
          rawTask.createdBy ||
          rawTask.creator ||
          null;

        return {
          ...rawTask,

          id:
            rawTask._id ||
            rawTask.id,

          title:
            rawTask.title ||
            rawTask.name ||
            "Untitled task",

          description:
            rawTask.description ||
            "",

          status:
            normalizeStatus(
              rawTask.status
            ),

          priority:
            rawTask.priority ||
            "Medium",

          assignee:
            assignee.object ||
            assignee.name,

          assigneeId:
            assignee.id,

          assigneeName:
            assignee.name,

          dueDate:
            rawTask.dueDate ||
            rawTask.due ||
            null,

          createdBy:
            createdBy,

          createdByName:
            typeof createdBy ===
            "string"
              ? createdBy
              : createdBy?.name ||
                createdBy?.fullName ||
                "Unknown",

          commentsList:
            Array.isArray(
              rawTask.comments
            )
              ? rawTask.comments
              : [],
        };
      },
      [resolveAssignee]
    );


  // ===================================================
  // FETCH TASK
  // ===================================================

  const fetchTask =
    useCallback(
      async () => {
        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
            {
              credentials:
                "include",
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

        const data =
          contentType?.includes(
            "application/json"
          )
            ? await response.json()
            : {};

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load task."
          );
        }

        const rawTask =
          data?.task ||
          data?.data ||
          data;

        const normalized =
          normalizeTask(
            rawTask
          );

        setTask(
          normalized
        );

        setEditTitle(
          normalized?.title ||
            ""
        );

        setEditDescription(
          normalized?.description ||
            ""
        );

        return normalized;
      },
      [
        workspaceId,
        projectId,
        taskId,
        normalizeTask,
      ]
    );


  // ===================================================
  // FETCH PROJECT
  // ===================================================

  const fetchProject =
    useCallback(
      async () => {
        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}`,
            {
              credentials:
                "include",
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

        const data =
          contentType?.includes(
            "application/json"
          )
            ? await response.json()
            : {};

        if (!response.ok) {
          return;
        }

        setProject(
          data?.project ||
            data?.data ||
            data
        );
      },
      [
        workspaceId,
        projectId,
      ]
    );


  // ===================================================
  // FETCH PROJECT MEMBERS
  // ===================================================

  const fetchMembers =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members`,
              {
                credentials:
                  "include",
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

          setMembers(
            Array.isArray(
              data?.members
            )
              ? data.members
              : Array.isArray(
                  data?.data
                )
              ? data.data
              : []
          );
        } catch (memberError) {
          console.warn(
            "Could not load task members:",
            memberError
          );
        }
      },
      [
        workspaceId,
        projectId,
      ]
    );


  // ===================================================
  // LOAD
  // ===================================================

  const loadTask =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          await Promise.all([
            fetchTask(),
            fetchProject(),
            fetchMembers(),
          ]);
        } catch (loadError) {
          console.error(
            "Load task error:",
            loadError
          );

          setError(
            loadError.message ||
              "Unable to load task."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        fetchTask,
        fetchProject,
        fetchMembers,
      ]
    );


  useEffect(() => {
    loadTask();
  }, [loadTask]);


  // ===================================================
  // RESOLVED TASK
  // ===================================================

  const displayTask =
    useMemo(() => {
      if (!task) {
        return null;
      }

      const assignee =
        resolveAssignee(
          task
        );

      return {
        ...task,
        assignee:
          assignee.object ||
          assignee.name,
        assigneeId:
          assignee.id,
        assigneeName:
          assignee.name,
      };
    }, [
      task,
      resolveAssignee,
    ]);


  // ===================================================
  // STATUS / PRIORITY
  // ===================================================

  const statusDetails = {
    todo: {
      label: "To Do",
      icon: CheckCircle2,
      style:
        "bg-slate-800 text-slate-300",
    },

    "in-progress": {
      label: "In Progress",
      icon: Clock3,
      style:
        "bg-indigo-500/10 text-indigo-400",
    },

    review: {
      label: "In Review",
      icon: Users,
      style:
        "bg-amber-500/10 text-amber-400",
    },

    done: {
      label: "Done",
      icon: CheckCircle2,
      style:
        "bg-emerald-500/10 text-emerald-400",
    },
  };


  const priorityStyles = {
    High:
      "bg-red-500/10 text-red-400 border-red-500/20",

    Medium:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",

    Low:
      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };


  // ===================================================
  // UPDATE TASK
  // ===================================================

  const updateTask =
    async (updates) => {
      if (!task?.id) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
            {
              method: "PATCH",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify(
                updates
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
              "Unable to update task."
          );
        }

        const updated =
          data?.task ||
          data?.data;

        if (updated) {
          setTask(
            normalizeTask(
              updated
            )
          );
        } else {
          await fetchTask();
        }

        return true;
      } catch (updateError) {
        console.error(
          "Update task error:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to update task."
        );

        return false;
      } finally {
        setSaving(false);
      }
    };


  // ===================================================
  // STATUS
  // ===================================================

  const handleStatusChange =
    async (event) => {
      await updateTask({
        status:
          event.target.value,
      });
    };


  // ===================================================
  // PRIORITY
  // ===================================================

  const handlePriorityChange =
    async (event) => {
      await updateTask({
        priority:
          event.target.value,
      });
    };


  // ===================================================
  // SAVE EDIT
  // ===================================================

  const handleSaveEdit =
    async () => {
      const title =
        editTitle.trim();

      const description =
        editDescription.trim();

      if (!title) {
        setError(
          "Task title is required."
        );

        return;
      }

      const success =
        await updateTask({
          title,
          description,
        });

      if (success) {
        setEditMode(false);
      }
    };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete =
    async () => {
      if (!task?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this task?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleting(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
            {
              method: "DELETE",
              credentials:
                "include",
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

        const data =
          contentType?.includes(
            "application/json"
          )
            ? await response.json()
            : {};

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to delete task."
          );
        }

        navigate(
          `/workspaces/${workspaceId}/projects/${projectId}/board`
        );
      } catch (deleteError) {
        console.error(
          "Delete task error:",
          deleteError
        );

        setError(
          deleteError.message ||
            "Unable to delete task."
        );
      } finally {
        setDeleting(false);
      }
    };


  // ===================================================
  // COMMENTS FROM BACKEND
  // ===================================================

  const comments =
    displayTask?.commentsList ||
    [];


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="animate-pulse">

          <div className="h-4 w-44 rounded bg-slate-800" />

          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

            <div className="h-[620px] rounded-xl border border-slate-800 bg-slate-900/40" />

            <div className="h-[620px] rounded-xl border border-slate-800 bg-slate-900/40" />

          </div>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (error && !displayTask) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="flex min-h-[600px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">

              <AlertCircle
                size={25}
                className="text-red-400"
              />

            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              Unable to load task
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadTask
              }
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
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


  const currentStatus =
    statusDetails[
      displayTask?.status
    ] ||
    statusDetails.todo;

  const StatusIcon =
    currentStatus.icon;


  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">

      {/* TOP NAVIGATION */}

      <div className="mb-7">

        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}/board`}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft
            size={15}
          />
          Back to Kanban Board
        </Link>

      </div>


      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}


      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* LEFT */}

        <main>

          {/* TASK HEADER */}

          <section className="rounded-xl border border-slate-800 bg-slate-950/40">

            <div className="border-b border-slate-800 p-6">

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0 flex-1">

                  {/* STATUS */}

                  <div className="mb-4 flex flex-wrap items-center gap-2">

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${currentStatus.style}`}
                    >
                      <StatusIcon
                        size={12}
                      />
                      {currentStatus.label}
                    </span>


                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                        priorityStyles[
                          displayTask?.priority
                        ] ||
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {displayTask?.priority ||
                        "Medium"}
                    </span>

                  </div>


                  {/* TITLE */}

                  {editMode ? (
                    <input
                      value={
                        editTitle
                      }
                      onChange={(event) =>
                        setEditTitle(
                          event.target.value
                        )
                      }
                      disabled={
                        saving
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xl font-semibold text-white outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      {displayTask?.title}
                    </h1>
                  )}


                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                    <span>
                      Task #{displayTask?.id}
                    </span>

                    <span>•</span>

                    <span>
                      {project?.name ||
                        displayTask?.project?.name ||
                        "Project"}
                    </span>

                  </div>

                </div>


                {/* ACTIONS */}

                <div className="flex shrink-0 items-center gap-2">

                  {editMode ? (
                    <>
                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          setEditMode(
                            false
                          )
                        }
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={
                          handleSaveEdit
                        }
                        className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                      >
                        {saving
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          setEditMode(
                            true
                          )
                        }
                        className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                        title="Edit task"
                      >
                        <Edit3
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          saving ||
                          deleting
                        }
                        onClick={
                          handleDelete
                        }
                        className="rounded-lg border border-red-500/10 p-2 text-red-400 hover:bg-red-500/5 disabled:opacity-50"
                        title="Delete task"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </>
                  )}

                </div>

              </div>

            </div>


            {/* DESCRIPTION */}

            <div className="p-6">

              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Description
              </h2>


              {editMode ? (
                <textarea
                  value={
                    editDescription
                  }
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  rows={6}
                  disabled={
                    saving
                  }
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-300 outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="max-w-4xl whitespace-pre-line text-sm leading-7 text-slate-500">
                  {displayTask?.description ||
                    "No description provided."}
                </p>
              )}

            </div>

          </section>


          {/* COMMENTS */}

          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40">

            <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">

              <MessageSquare
                size={16}
                className="text-slate-500"
              />

              <h2 className="text-sm font-semibold text-slate-200">
                Comments
              </h2>

              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                {comments.length}
              </span>

            </div>


            <div className="divide-y divide-slate-800">

              {comments.length >
                0 ? (
                comments.map(
                  (
                    comment,
                    index
                  ) => {
                    const author =
                      comment.author ||
                      comment.user ||
                      comment.createdBy ||
                      {};

                    const authorName =
                      typeof author ===
                      "string"
                        ? author
                        : author.name ||
                          author.fullName ||
                          author.email ||
                          "Unknown";

                    const message =
                      comment.message ||
                      comment.text ||
                      comment.content ||
                      "";

                    return (
                      <div
                        key={
                          comment._id ||
                          comment.id ||
                          index
                        }
                        className="p-6"
                      >

                        <div className="flex gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-400">
                            {getInitials(
                              authorName
                            )}
                          </div>


                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="text-xs font-semibold text-slate-300">
                                {authorName}
                              </span>

                              {comment.createdAt && (
                                <span className="text-[10px] text-slate-600">
                                  {formatDate(
                                    comment.createdAt
                                  )}
                                </span>
                              )}

                            </div>


                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {message}
                            </p>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )
              ) : (
                <div className="p-8 text-center">

                  <MessageSquare
                    size={20}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-3 text-xs text-slate-600">
                    No comments yet.
                  </p>

                </div>
              )}

            </div>


            {/* COMMENT INPUT */}

            <form
              onSubmit={(event) => {
                event.preventDefault();

                // Comment persistence should be connected
                // to the comments API when that endpoint
                // is available.
                setCommentText("");
              }}
              className="border-t border-slate-800 p-5"
            >

              <div className="flex gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                  You
                </div>


                <div className="flex flex-1 gap-2">

                  <input
                    type="text"
                    value={
                      commentText
                    }
                    onChange={(event) =>
                      setCommentText(
                        event.target.value
                      )
                    }
                    placeholder="Write a comment..."
                    className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  />


                  <button
                    type="submit"
                    disabled={
                      !commentText.trim()
                    }
                    className="rounded-lg bg-indigo-500 px-3 text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MessageSquare
                      size={15}
                    />
                  </button>

                </div>

              </div>

            </form>

          </section>

        </main>


        {/* RIGHT SIDEBAR */}

        <aside>

          <div className="sticky top-24 rounded-xl border border-slate-800 bg-slate-950/40">

            <div className="border-b border-slate-800 px-5 py-4">

              <h2 className="text-sm font-semibold text-slate-200">
                Task Details
              </h2>

            </div>


            <div className="divide-y divide-slate-800">

              {/* STATUS */}

              <div className="px-5 py-4">

                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </label>


                <select
                  value={
                    displayTask?.status ||
                    "todo"
                  }
                  onChange={
                    handleStatusChange
                  }
                  disabled={
                    saving
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 disabled:opacity-50"
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

              </div>


              {/* PRIORITY */}

              <div className="px-5 py-4">

                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Priority
                </label>


                <select
                  value={
                    displayTask?.priority ||
                    "Medium"
                  }
                  onChange={
                    handlePriorityChange
                  }
                  disabled={
                    saving
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 disabled:opacity-50"
                >
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


              {/* ASSIGNEE */}

              <div className="px-5 py-4">

                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Assignee
                </label>


                <div className="flex items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-400">

                    {displayTask?.assignee?.avatar ? (
                      <img
                        src={
                          displayTask
                            .assignee
                            .avatar
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(
                        displayTask?.assigneeName ||
                          "Unassigned"
                      )
                    )}

                  </div>


                  <div>

                    <p className="text-xs font-medium text-slate-300">
                      {displayTask?.assigneeName ||
                        "Unassigned"}
                    </p>

                    <p className="text-[10px] text-slate-600">
                      Project member
                    </p>

                  </div>

                </div>

              </div>


              {/* DUE DATE */}

              <div className="px-5 py-4">

                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Due Date
                </label>


                <div className="flex items-center gap-2 text-xs text-slate-400">

                  <CalendarDays
                    size={14}
                    className="text-slate-600"
                  />

                  {formatDate(
                    displayTask?.dueDate
                  )}

                </div>

              </div>


              {/* CREATED BY */}

              <div className="px-5 py-4">

                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Created By
                </label>


                <div className="flex items-center gap-2">

                  <User
                    size={14}
                    className="text-slate-600"
                  />

                  <span className="text-xs text-slate-400">
                    {displayTask?.createdByName ||
                      "Unknown"}
                  </span>

                </div>

              </div>


              {/* CREATED / UPDATED */}

              <div className="px-5 py-4">

                <div className="flex items-center justify-between">

                  <span className="text-[10px] text-slate-600">
                    Created
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {formatDate(
                      displayTask?.createdAt
                    )}
                  </span>

                </div>


                <div className="mt-2 flex items-center justify-between">

                  <span className="text-[10px] text-slate-600">
                    Updated
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {formatDate(
                      displayTask?.updatedAt
                    )}
                  </span>

                </div>

              </div>

            </div>


            {/* ATTACHMENTS */}

            <div className="border-t border-slate-800 p-5">

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Paperclip
                    size={14}
                    className="text-slate-600"
                  />

                  <span className="text-xs font-semibold text-slate-300">
                    Attachments
                  </span>

                </div>


                <span className="text-[10px] text-slate-600">
                  {Array.isArray(
                    displayTask?.attachments
                  )
                    ? displayTask
                        .attachments
                        .length
                    : 0}
                </span>

              </div>


              <button
                type="button"
                className="w-full rounded-lg border border-dashed border-slate-800 py-3 text-[10px] font-medium text-slate-600 hover:border-slate-700 hover:text-slate-400"
              >
                Add attachment
              </button>

            </div>


            {/* DELETE */}

            <div className="border-t border-slate-800 p-5">

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  handleDelete
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/10 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-500/5 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {deleting ? (
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={14}
                  />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete Task"}

              </button>

            </div>

          </div>

        </aside>

      </div>

    </div>
  );
};


export default TaskDetails;
