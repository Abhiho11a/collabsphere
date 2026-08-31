import { useEffect, useState } from "react";
import {
  CalendarDays,
  FolderKanban,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const CreateProjectModal = ({
  isOpen,
  onClose,
  onCreate,
  workspaceId,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "Medium",
    startDate: "",
    dueDate: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // RESET FORM
  // ==========================================

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
        priority: "Medium",
        startDate: "",
        dueDate: "",
      });

      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!name) {
      return "Project name is required.";
    }

    if (name.length < 2) {
      return "Project name must be at least 2 characters.";
    }

    if (name.length > 100) {
      return "Project name cannot exceed 100 characters.";
    }

    if (description.length > 500) {
      return "Description cannot exceed 500 characters.";
    }

    if (
      formData.startDate &&
      formData.dueDate &&
      formData.dueDate < formData.startDate
    ) {
      return "Due date cannot be before the start date.";
    }

    return "";
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    // ========================================
    // WORKSPACE ID CHECK
    // ========================================

    if (!workspaceId) {
      setError(
        "Workspace information is missing."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      // ======================================
      // CREATE PROJECT THROUGH BACKEND
      // ======================================

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: formData.name.trim(),
            description:
              formData.description.trim(),
            priority: formData.priority,
            startDate:
              formData.startDate || null,
            dueDate:
              formData.dueDate || null,
          }),
        }
      );

      // ======================================
      // CHECK RESPONSE TYPE
      // ======================================

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

      // ======================================
      // API ERROR
      // ======================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create project."
        );
      }

      // ======================================
      // SUCCESS
      // ======================================

      console.log(
        "Project created successfully:",
        data
      );

      /*
       * Send the REAL project returned
       * from the backend to Projects.jsx.
       */
      if (onCreate) {
        await onCreate(data.project);
      }

      onClose();

    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      setError(
        error.message ||
          "Unable to create project."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ESCAPE KEY
  // ==========================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !loading
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, onClose, loading]);

  // ==========================================
  // DON'T RENDER
  // ==========================================

  if (!isOpen) {
    return null;
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-6">

      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      {/* MODAL */}

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">

              <FolderKanban
                size={19}
                className="text-indigo-400"
              />

            </div>

            <div>

              <h2 className="text-base font-semibold text-white">
                Create project
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Add a new project to this workspace.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* PROJECT NAME */}

          <div>

            <label
              htmlFor="project-name"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Project name
              <span className="ml-1 text-red-400">
                *
              </span>
            </label>

            <input
              id="project-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. w1proj1"
              maxLength={100}
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />

          </div>

          {/* DESCRIPTION */}

          <div className="mt-5">

            <label
              htmlFor="project-description"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Description
            </label>

            <textarea
              id="project-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What is this project about?"
              rows={3}
              maxLength={500}
              disabled={loading}
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />

            <div className="mt-1 flex justify-end">

              <span className="text-[11px] text-slate-600">
                {formData.description.length}/500
              </span>

            </div>

          </div>

          {/* PRIORITY */}

          <div className="mt-5">

            <label
              htmlFor="project-priority"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Priority
            </label>

            <select
              id="project-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-indigo-500 disabled:opacity-60"
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

          {/* DATES */}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            {/* START DATE */}

            <div>

              <label
                htmlFor="project-start-date"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
              >

                <CalendarDays
                  size={14}
                  className="text-slate-500"
                />

                Start date

              </label>

              <input
                id="project-start-date"
                name="startDate"
                type="date"
                value={
                  formData.startDate
                }
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 outline-none focus:border-indigo-500 disabled:opacity-60"
              />

            </div>

            {/* DUE DATE */}

            <div>

              <label
                htmlFor="project-due-date"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
              >

                <CalendarDays
                  size={14}
                  className="text-slate-500"
                />

                Due date

              </label>

              <input
                id="project-due-date"
                name="dueDate"
                type="date"
                value={
                  formData.dueDate
                }
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 outline-none focus:border-indigo-500 disabled:opacity-60"
              />

            </div>

          </div>

          {/* FOOTER */}

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
                : "Create project"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateProjectModal;