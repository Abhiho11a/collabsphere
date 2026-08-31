import { useEffect, useState } from "react";
import {
  X,
  Building2,
  FileText,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
      });

      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  // ==========================================
  // INPUT CHANGE
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
  // CREATE WORKSPACE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!name) {
      setError("Workspace name is required.");
      return;
    }

    if (name.length < 2) {
      setError(
        "Workspace name must be at least 2 characters."
      );
      return;
    }

    if (name.length > 50) {
      setError(
        "Workspace name cannot exceed 50 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      // ------------------------------------------
      // BACKEND REQUEST
      // ------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/workspaces`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name,
            description,
          }),
        }
      );

      // ------------------------------------------
      // HANDLE RESPONSE SAFELY
      // ------------------------------------------

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

      // ------------------------------------------
      // API ERROR
      // ------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create workspace."
        );
      }

      // ------------------------------------------
      // SUCCESS
      // ------------------------------------------

      console.log(
        "Workspace created successfully:",
        data
      );

      /*
       * Send the REAL workspace returned by
       * the backend to the parent component.
       */
      if (onCreate) {
        await onCreate(data.workspace);
      }

      // Close modal
      onClose();

    } catch (error) {
      console.error(
        "Create workspace error:",
        error
      );

      setError(
        error.message ||
          "Unable to create workspace. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLOSE ON ESCAPE
  // ==========================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">

      {/* =====================================
          BACKDROP
      ====================================== */}

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      {/* =====================================
          MODAL
      ====================================== */}

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Building2
                size={19}
                className="text-indigo-400"
              />
            </div>

            <div>

              <h2 className="text-base font-semibold text-white">
                Create workspace
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Create a dedicated space for your team.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

        </div>

        {/* =====================================
            FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >

          {/* ===================================
              ERROR
          ==================================== */}

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

              <span className="mt-0.5 font-bold">
                !
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* ===================================
              WORKSPACE NAME
          ==================================== */}

          <div>

            <label
              htmlFor="workspace-name"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Workspace name
            </label>

            <input
              id="workspace-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Engineering Team"
              maxLength={50}
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-1.5 text-xs text-slate-600">
              Choose a clear name your team will recognize.
            </p>

          </div>

          {/* ===================================
              DESCRIPTION
          ==================================== */}

          <div className="mt-5">

            <label
              htmlFor="workspace-description"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
            >

              <FileText
                size={14}
                className="text-slate-500"
              />

              Description

              <span className="font-normal text-slate-600">
                (optional)
              </span>

            </label>

            <textarea
              id="workspace-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What is this workspace used for?"
              rows={4}
              maxLength={200}
              disabled={loading}
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-1.5 flex justify-end">

              <span className="text-xs text-slate-600">
                {formData.description.length}/200
              </span>

            </div>

          </div>

          {/* ===================================
              INFO
          ==================================== */}

          <div className="mt-5 flex gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">

            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <div>

              <p className="text-xs font-medium text-slate-300">
                Workspace ownership
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                You will become the owner of this
                workspace and can invite members and
                manage permissions.
              </p>

            </div>

          </div>

          {/* ===================================
              ACTIONS
          ==================================== */}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                : "Create workspace"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateWorkspaceModal;