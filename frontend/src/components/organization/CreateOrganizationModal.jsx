import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building2,
  Loader2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const CreateOrganizationModal = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        "Organization name is required."
      );
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        "Organization name must contain at least 2 characters."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Organization name cannot exceed 100 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create organization"
        );
      }

      if (data.organization) {
        onCreated(data.organization);
      }

      setName("");
      setError("");

      onClose();
    } catch (error) {
      console.error(
        "Create organization error:",
        error
      );

      setError(
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (!loading) {
            onClose();
          }
        }
      }}
    >
      {/* MODAL */}

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#080d1d] shadow-2xl">
        
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
              <Building2
                size={20}
                className="text-indigo-400"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Create organization
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Create a new organization for your
                workspaces and teams.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          {/* ORGANIZATION NAME */}

          <div>
            <label
              htmlFor="organization-name"
              className="mb-2 block text-xs font-medium text-slate-300"
            >
              Organization name
              <span className="ml-1 text-indigo-400">
                *
              </span>
            </label>

            <input
              id="organization-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Nayoda Technologies"
              maxLength={100}
              autoFocus
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-slate-600">
                This will be your top-level
                organization.
              </p>

              <p className="text-[10px] text-slate-600">
                {name.length}/100
              </p>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <p className="text-xs text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* ACTIONS */}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !name.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Creating..."
                : "Create organization"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateOrganizationModal;