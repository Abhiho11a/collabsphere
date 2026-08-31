import {
  X,
  Pencil,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const EditWorkspaceModal = ({
  isOpen,
  onClose,
  workspace,
  onUpdated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ========================================
  // LOAD WORKSPACE DATA
  // ========================================

  useEffect(() => {
    if (workspace && isOpen) {
      setName(workspace.name || "");
      setDescription(
        workspace.description || ""
      );
      setError("");
    }
  }, [workspace, isOpen]);

  // ========================================
  // CLOSE
  // ========================================

  const handleClose = () => {
    if (loading) return;

    setError("");
    onClose();
  };

  // ========================================
  // UPDATE WORKSPACE
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Workspace name is required."
      );
      return;
    }

    if (!workspace?._id && !workspace?.id) {
      setError(
        "Workspace ID is missing."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const workspaceId =
        workspace._id || workspace.id;

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update workspace."
        );
      }

      // ======================================
      // SEND UPDATED WORKSPACE TO PARENT
      // ======================================

      if (onUpdated) {
        onUpdated(data.workspace);
      }

      onClose();

    } catch (error) {
      console.error(
        "Update workspace error:",
        error
      );

      setError(
        error.message ||
          "Unable to update workspace."
      );

    } finally {
      setLoading(false);
    }
  };


  // ========================================
  // DON'T RENDER
  // ========================================

  if (!isOpen || !workspace) {
    return null;
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={handleClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#080d1f] shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* ==================================
            HEADER
        ================================== */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Pencil
                size={18}
                className="text-indigo-400"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Edit Workspace
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Update workspace details
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>

        </div>


        {/* ==================================
            FORM
        ================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >

          {/* NAME */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Workspace name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={100}
              placeholder="Enter workspace name"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            <p className="mt-1.5 text-right text-xs text-slate-600">
              {name.length}/100
            </p>
          </div>


          {/* DESCRIPTION */}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              maxLength={500}
              rows={4}
              placeholder="Describe your workspace..."
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            <p className="mt-1.5 text-right text-xs text-slate-600">
              {description.length}/500
            </p>
          </div>


          {/* ERROR */}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}


          {/* ACTIONS */}

          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !name.trim()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default EditWorkspaceModal;