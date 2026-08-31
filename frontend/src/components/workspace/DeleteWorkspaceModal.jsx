import {
  X,
  Trash2,
  Loader2,
} from "lucide-react";

import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const DeleteWorkspaceModal = ({
  isOpen,
  onClose,
  workspace,
  onDeleted,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  if (!isOpen || !workspace) {
    return null;
  }

  const handleDelete = async () => {
    const workspaceId =
      workspace._id || workspace.id;

    if (!workspaceId) {
      setError(
        "Workspace ID is missing."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete workspace."
        );
      }

      // Tell parent to remove it
      if (onDeleted) {
        onDeleted(workspaceId);
      }

      onClose();

    } catch (error) {
      console.error(
        "Delete workspace error:",
        error
      );

      setError(
        error.message ||
          "Unable to delete workspace."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#080d1f] shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2
                size={18}
                className="text-red-400"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Delete Workspace
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                This action cannot be undone
              </p>
            </div>

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


        {/* CONTENT */}

        <div className="p-6">

          <p className="text-sm leading-6 text-slate-400">
            Are you sure you want to delete
            the workspace{" "}
            <span className="font-semibold text-slate-200">
              "{workspace.name}"
            </span>
            ?
          </p>

          <p className="mt-3 text-sm leading-6 text-red-400/80">
            All projects, members and
            workspace data associated with
            this workspace may become
            inaccessible.
          </p>


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
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Deleting..."
                : "Delete Workspace"}

            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default DeleteWorkspaceModal;