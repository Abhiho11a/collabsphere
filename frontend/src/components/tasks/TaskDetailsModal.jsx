import {
  X,
  CalendarDays,
  User,
  MessageSquare,
  Send,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock3,
  Users,
  AlertCircle,
  Save,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(
    value._id ||
      value.id ||
      value.userId ||
      value.memberId ||
      value.user?._id ||
      value.user?.id ||
      ""
  );
};

const getName = (value) => {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  const user = value.user || value.member || value;

  return (
    user.name ||
    user.fullName ||
    user.username ||
    user.email ||
    ""
  );
};

const getInitials = (name = "") => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const formatDate = (value) => {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeStatus = (status) => {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (value === "todo" || value === "to do" || value === "pending") {
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

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

const TaskDetailsModal = ({
  task,
  isOpen,
  onClose,
  workspaceId,
  projectId,
  members = [],
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [currentTask, setCurrentTask] = useState(task);
  const [editMode, setEditMode] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("todo");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editAssignee, setEditAssignee] = useState("");

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Sync selected task
  // --------------------------------------------------

  useEffect(() => {
    if (!task) return;

    setCurrentTask(task);
    setEditTitle(task.title || task.name || "");
    setEditDescription(task.description || "");
    setEditStatus(normalizeStatus(task.status));
    setEditPriority(task.priority || "Medium");

    const rawAssignee =
      task.assigneeId ||
      task.assignedToId ||
      task.assignee?._id ||
      task.assignee?.id ||
      task.assignee?.userId ||
      task.assignedTo?._id ||
      task.assignedTo?.id ||
      "";

    setEditAssignee(String(rawAssignee || ""));
    setComments(Array.isArray(task.comments) ? task.comments : []);
    setEditMode(false);
    setError("");
    setCommentText("");
  }, [task]);

  // --------------------------------------------------
  // Fetch fresh task details
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || !task?.id || !workspaceId || !projectId) return;

    let cancelled = false;

    const fetchTask = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
          {
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("Server returned an unexpected task response.");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load task details."
          );
        }

        const fetchedTask =
          data?.task ||
          data?.data ||
          data;

        if (!cancelled && fetchedTask) {
          setCurrentTask(fetchedTask);

          setEditTitle(
            fetchedTask.title ||
              fetchedTask.name ||
              ""
          );

          setEditDescription(
            fetchedTask.description || ""
          );

          setEditStatus(
            normalizeStatus(fetchedTask.status)
          );

          setEditPriority(
            fetchedTask.priority || "Medium"
          );

          const rawAssignee =
            fetchedTask.assigneeId ||
            fetchedTask.assignedToId ||
            fetchedTask.assignee?._id ||
            fetchedTask.assignee?.id ||
            fetchedTask.assignee?.userId ||
            fetchedTask.assignedTo?._id ||
            fetchedTask.assignedTo?.id ||
            "";

          setEditAssignee(String(rawAssignee || ""));

          if (Array.isArray(fetchedTask.comments)) {
            setComments(fetchedTask.comments);
          }
        }
      } catch (fetchError) {
        console.warn(
          "Task details could not be refreshed:",
          fetchError
        );

        // The board task is still usable, so don't block the modal.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTask();

    return () => {
      cancelled = true;
    };
  }, [isOpen, task?.id, workspaceId, projectId]);

  // --------------------------------------------------
  // Escape key
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving && !deleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen, onClose, saving, deleting]);

  const selectedMember = useMemo(() => {
    if (!editAssignee) return null;

    return (
      members.find(
        (member) =>
          getId(member) === String(editAssignee)
      ) || null
    );
  }, [members, editAssignee]);

  if (!isOpen || !currentTask) {
    return null;
  }

  const taskId =
    currentTask._id ||
    currentTask.id;

  const title =
    currentTask.title ||
    currentTask.name ||
    "Untitled task";

  const description =
    currentTask.description ||
    "No description has been added for this task.";

  const assigneeName =
    getName(
      currentTask.assignee ||
        currentTask.assignedTo ||
        currentTask.assigneeUser
    ) ||
    currentTask.assigneeName ||
    currentTask.assignedToName ||
    "Unassigned";

  const createdBy =
    getName(currentTask.createdBy) ||
    currentTask.createdByName ||
    "Unknown";

  const status = normalizeStatus(
    currentTask.status
  );

  const statusConfig = {
    todo: {
      label: "To Do",
      icon: CheckCircle2,
      className:
        "bg-slate-800 text-slate-300",
    },

    "in-progress": {
      label: "In Progress",
      icon: Clock3,
      className:
        "bg-indigo-500/10 text-indigo-400",
    },

    review: {
      label: "In Review",
      icon: Users,
      className:
        "bg-amber-500/10 text-amber-400",
    },

    done: {
      label: "Done",
      icon: CheckCircle2,
      className:
        "bg-emerald-500/10 text-emerald-400",
    },
  };

  const currentStatus =
    statusConfig[status] ||
    statusConfig.todo;

  const StatusIcon = currentStatus.icon;

  const priorityClass = {
    Critical:
      "border-red-500/20 bg-red-500/10 text-red-400",
    High:
      "border-red-500/20 bg-red-500/10 text-red-400",
    Medium:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
    Low:
      "border-blue-500/20 bg-blue-500/10 text-blue-400",
  };

  // --------------------------------------------------
  // Save task
  // --------------------------------------------------

  const handleSave = async () => {
    const cleanTitle = editTitle.trim();

    if (!cleanTitle) {
      setError("Task title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            title: cleanTitle,
            description: editDescription.trim(),
            status: editStatus,
            priority: editPriority,
            assigneeId:
              editAssignee || null,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type");

      const data =
        contentType?.includes("application/json")
          ? await response.json()
          : {};

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update task."
        );
      }

      const updatedTask =
        data?.task ||
        data?.data ||
        {
          ...currentTask,
          title: cleanTitle,
          description: editDescription.trim(),
          status: editStatus,
          priority: editPriority,
          assigneeId:
            editAssignee || null,
          assignee:
            selectedMember
              ? getName(selectedMember)
              : "Unassigned",
        };

      setCurrentTask(updatedTask);
      setEditMode(false);

      if (onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }
    } catch (saveError) {
      console.error(
        "Update task error:",
        saveError
      );

      setError(
        saveError.message ||
          "Unable to update task."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Delete task
  // --------------------------------------------------

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const contentType =
        response.headers.get("content-type");

      const data =
        contentType?.includes("application/json")
          ? await response.json()
          : {};

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete task."
        );
      }

      if (onTaskDeleted) {
        onTaskDeleted(taskId);
      } else {
        onClose();
      }
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

  // --------------------------------------------------
  // Add comment - local until comments API exists
  // --------------------------------------------------

  const handleAddComment = (event) => {
    event.preventDefault();

    const message =
      commentText.trim();

    if (!message) return;

    const comment = {
      id: `local-${Date.now()}`,
      author: "You",
      initials: "YO",
      message,
      time: "Just now",
    };

    setComments((previous) => [
      ...previous,
      comment,
    ]);

    setCommentText("");
  };

  const handleOverlayClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !saving &&
      !deleting
    ) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={handleOverlayClick}
    >
      <aside
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#080d1d] shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Task Details
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {currentTask.project?.name ||
                currentTask.projectName ||
                "Project task"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close task details"
          >
            <X size={18} />
          </button>
        </header>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="border-b border-slate-800 px-6 py-6">
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div className="mb-4 text-[10px] text-slate-600">
                Refreshing task details...
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${currentStatus.className}`}
              >
                <StatusIcon size={12} />
                {currentStatus.label}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                  priorityClass[
                    currentTask.priority
                  ] ||
                  "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                {currentTask.priority || "Medium"}
              </span>
            </div>

            {editMode ? (
              <input
                value={editTitle}
                onChange={(event) =>
                  setEditTitle(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xl font-semibold text-white outline-none focus:border-indigo-500"
              />
            ) : (
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {title}
              </h2>
            )}

            <p className="mt-2 text-[10px] text-slate-600">
              Task #{String(taskId)}
            </p>

            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold text-slate-300">
                Description
              </h3>

              {editMode ? (
                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-300 outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  {description}
                </p>
              )}
            </div>

            {/* EDIT CONTROLS */}
            {editMode && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                  >
                    {statusOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Priority
                  </label>

                  <select
                    value={editPriority}
                    onChange={(event) =>
                      setEditPriority(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                  >
                    {priorityOptions.map(
                      (priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Assignee
                  </label>

                  <select
                    value={editAssignee}
                    onChange={(event) =>
                      setEditAssignee(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {members.map(
                      (member) => {
                        const id =
                          getId(member);

                        const name =
                          getName(member);

                        if (!id || !name) {
                          return null;
                        }

                        return (
                          <option
                            key={id}
                            value={id}
                          >
                            {name}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* QUICK DETAILS */}
          <section className="grid grid-cols-1 divide-y divide-slate-800 border-b border-slate-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-400">
                {getInitials(assigneeName)}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Assignee
                </p>

                <p className="mt-0.5 truncate text-xs font-medium text-slate-300">
                  {assigneeName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <CalendarDays
                size={17}
                className="shrink-0 text-slate-600"
              />

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Due Date
                </p>

                <p className="mt-0.5 text-xs font-medium text-slate-300">
                  {formatDate(
                    currentTask.dueDate ||
                      currentTask.due
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <User
                size={17}
                className="shrink-0 text-slate-600"
              />

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Created By
                </p>

                <p className="mt-0.5 truncate text-xs font-medium text-slate-300">
                  {createdBy}
                </p>
              </div>
            </div>
          </section>

          {/* COMMENTS */}
          <section className="px-6 py-5">
            <div className="mb-5 flex items-center gap-2">
              <MessageSquare
                size={15}
                className="text-slate-600"
              />

              <h3 className="text-xs font-semibold text-slate-300">
                Comments
              </h3>

              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                {comments.length}
              </span>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-5">
                {comments.map(
                  (comment, index) => {
                    const author =
                      getName(comment.author) ||
                      comment.authorName ||
                      "User";

                    const message =
                      typeof comment.message ===
                      "string"
                        ? comment.message
                        : typeof comment.text ===
                          "string"
                        ? comment.text
                        : "";

                    if (!message) return null;

                    return (
                      <div
                        key={
                          comment._id ||
                          comment.id ||
                          index
                        }
                        className="flex gap-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-400">
                          {getInitials(author)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-300">
                              {author}
                            </span>

                            <span className="text-[10px] text-slate-600">
                              {comment.createdAt
                                ? formatDate(
                                    comment.createdAt
                                  )
                                : comment.time ||
                                  ""}
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            {message}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-800 px-4 py-7 text-center">
                <MessageSquare
                  size={18}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-2 text-xs text-slate-600">
                  No comments yet.
                </p>
              </div>
            )}

            <form
              onSubmit={handleAddComment}
              className="mt-5 flex gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(event) =>
                  setCommentText(
                    event.target.value
                  )
                }
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </form>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950/70 px-5 py-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />

            {deleting
              ? "Deleting..."
              : "Delete Task"}
          </button>

          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                  }}
                  disabled={saving}
                  className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={13} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditMode(true);
                  setError("");
                }}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
              >
                <Edit3 size={13} />
                Edit Task
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
};

export default TaskDetailsModal;
