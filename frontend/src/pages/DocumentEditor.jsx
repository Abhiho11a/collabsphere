import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  FileText,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

const API_BASE_URL =
  "http://localhost:5000/api";

const DocumentEditor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH DOCUMENT
  // ========================================

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to fetch document"
        );
      }

      setDocument(data.document);

      setTitle(
        data.document.title || ""
      );

      setContent(
        data.document.content || ""
      );
    } catch (error) {
      console.error(
        "Fetch document error:",
        error
      );

      setError(
        error.message ||
          "Unable to load document"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  // ========================================
  // SAVE
  // ========================================

  const handleSave = async () => {
    if (!title.trim()) {
      alert(
        "Document title cannot be empty"
      );

      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          method: "PATCH",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title: title.trim(),
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save document"
        );
      }

      setDocument(data.document);

      setTitle(
        data.document.title || ""
      );

      setContent(
        data.document.content || ""
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Save document error:",
        error
      );

      alert(
        error.message ||
          "Unable to save document"
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#020617]">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading document...
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#020617] px-6">
        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertCircle
              size={25}
              className="text-red-400"
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            Unable to open document
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/documents")
            }
            className="mt-5 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Back to Documents
          </button>

        </div>
      </div>
    );
  }

  // ========================================
  // EDITOR
  // ========================================

  return (
    <div className="flex min-h-full flex-col bg-[#020617]">

      {/* ==================================
          TOP BAR
      ================================== */}

      <div className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-800 bg-[#020617]/95 px-6 backdrop-blur">

        <div className="flex items-center gap-4">

          <button
            onClick={() =>
              navigate("/documents")
            }
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
              <FileText
                size={18}
                className="text-indigo-400"
              />
            </div>

            <div>

              <p className="text-sm font-medium text-white">
                {title ||
                  "Untitled Document"}
              </p>

              <p className="text-xs text-slate-600">
                {document?.workspace?.name
                  ? `Workspace · ${document.workspace.name}`
                  : document?.project?.name
                  ? `Project · ${document.project.name}`
                  : "Personal document"}
              </p>

            </div>

          </div>

        </div>

        <div className="flex items-center gap-3">

          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check size={15} />
              Saved
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />

                Saving...
              </>
            ) : (
              <>
                <Save size={15} />
                Save
              </>
            )}
          </button>

        </div>

      </div>

      {/* ==================================
          EDITOR
      ================================== */}

      <div className="flex flex-1 justify-center px-6 py-10">

        <div className="w-full max-w-4xl">

          {/* TITLE */}

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Untitled Document"
            className="w-full border-none bg-transparent text-4xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-700"
          />

          {/* META */}

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">

            <span>
              Created{" "}
              {document?.createdAt
                ? new Date(
                    document.createdAt
                  ).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )
                : ""}
            </span>

            <span>•</span>

            <span>
              Last updated{" "}
              {document?.updatedAt
                ? new Date(
                    document.updatedAt
                  ).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )
                : ""}
            </span>

          </div>

          {/* CONTENT */}

          <div className="mt-8 min-h-[600px] rounded-2xl border border-slate-800 bg-slate-950/40">

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              placeholder="Start writing your document..."
              className="min-h-[600px] w-full resize-none rounded-2xl bg-transparent px-7 py-7 text-[15px] leading-7 text-slate-300 outline-none placeholder:text-slate-700"
            />

          </div>

          {/* FOOTER */}

          <div className="mt-4 flex items-center justify-between text-xs text-slate-700">

            <span>
              {content.length} characters
            </span>

            <span>
              Changes are saved manually
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};

export default DocumentEditor;