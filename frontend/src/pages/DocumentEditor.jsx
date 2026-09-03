import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  Share2,
  X,
  Search,
  Check,
  Loader2,
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import {
  TableKit,
} from "@tiptap/extension-table";

import Image from "@tiptap/extension-image";

import Placeholder from "@tiptap/extension-placeholder";

import TextAlign from "@tiptap/extension-text-align";

import Highlight from "@tiptap/extension-highlight";

import Collaboration from "@tiptap/extension-collaboration";

import CollaborationCaret from
  "@tiptap/extension-collaboration-caret";

import * as Y from "yjs";

import {
  HocuspocusProvider,
} from "@hocuspocus/provider";

import "./DocumentEditor.css";

import MentionExtension from
  "../editor/extensions/MentionExtension";

import DocumentComments from
  "../components/documents/DocumentComments";

import DocumentSuggestions from
  "../editor/extensions/DocumentSuggestions";

import {
  createDocumentSuggestion,
} from "../services/documentSevice";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const COLLABORATION_URL =
  import.meta.env.VITE_COLLABORATION_URL ||
  "ws://localhost:1234";

/* =========================================================
   HELPERS
========================================================= */

const normalizeContent = (content) => {
  if (!content) {
    return "<p></p>";
  }

  if (
    typeof content === "string" &&
    /<[^>]+>/.test(content)
  ) {
    return content;
  }

  return String(content)
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p>${line}</p>`
        : "<p></p>"
    )
    .join("");
};

const getUserId = (user) => {
  if (!user) {
    return "";
  }

  return String(
    user._id ||
      user.id ||
      user.userId ||
      ""
  );
};

/* =========================================================
   API REQUEST
========================================================= */

const request = async (
  url,
  options = {}
) => {
  const response = await fetch(
    url,
    {
      credentials: "include",

      headers: {
        Accept:
          "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },

      ...options,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Something went wrong"
    );
  }

  return data;
};

/* =========================================================
   TOOLBAR BUTTON
========================================================= */

const ToolbarButton = ({
  children,
  onClick,
  onMouseDown,
  active = false,
  disabled = false,
  title,
}) => {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className={`
        editor-toolbar-button
        ${active ? "active" : ""}
      `}
    >
      {children}
    </button>
  );
};

/* =========================================================
   ACCESS MODAL
========================================================= */

const AccessModal = ({
  document,
  members,
  onClose,
  onSave,
}) => {
  const [
    inheritViewAccess,
    setInheritViewAccess,
  ] = useState(
    document?.access
      ?.inheritViewAccess !== false
  );

  const [
    inheritEditAccess,
    setInheritEditAccess,
  ] = useState(
    document?.access
      ?.inheritEditAccess === true
  );

  const [
    viewers,
    setViewers,
  ] = useState(
    (document?.access?.viewers || [])
      .map((user) =>
        String(
          user?._id ||
            user?.id ||
            user
        )
      )
  );

  const [
    editors,
    setEditors,
  ] = useState(
    (document?.access?.editors || [])
      .map((user) =>
        String(
          user?._id ||
            user?.id ||
            user
        )
      )
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const filteredMembers =
    members.filter((member) => {
      const text =
        `${member.name || ""} ${
          member.email || ""
        }`.toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  const toggleViewer = (userId) => {
    setViewers((current) => {
      if (current.includes(userId)) {
        return current.filter(
          (id) => id !== userId
        );
      }

      return [
        ...current,
        userId,
      ];
    });
  };

  const toggleEditor = (userId) => {
    setEditors((current) => {
      if (current.includes(userId)) {
        return current.filter(
          (id) => id !== userId
        );
      }

      return [
        ...current,
        userId,
      ];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await onSave({
        inheritViewAccess,
        inheritEditAccess,
        viewers,
        editors,
      });

      onClose();
    } catch (error) {
      console.error(
        "Access save error:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="access-modal-overlay">
      <div className="access-modal">

        <div className="access-modal-header">
          <div>
            <h2>
              Share document
            </h2>

            <p>
              Manage who can view and edit
              this document.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="access-close-button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="access-modal-body">

          {/* VIEW */}

          <div className="access-section">
            <div className="access-section-title">
              <div>
                <h3>
                  Who can view?
                </h3>

                <p>
                  Control document visibility.
                </p>
              </div>
            </div>

            <label className="access-option">
              <input
                type="checkbox"
                checked={inheritViewAccess}
                onChange={(event) =>
                  setInheritViewAccess(
                    event.target.checked
                  )
                }
              />

              <div>
                <strong>
                  Everyone in this scope
                </strong>

                <span>
                  All valid members can view
                  the document.
                </span>
              </div>
            </label>
          </div>

          {/* EDIT */}

          <div className="access-section">
            <div className="access-section-title">
              <div>
                <h3>
                  Who can edit?
                </h3>

                <p>
                  Allow scope members to edit.
                </p>
              </div>
            </div>

            <label className="access-option">
              <input
                type="checkbox"
                checked={inheritEditAccess}
                onChange={(event) =>
                  setInheritEditAccess(
                    event.target.checked
                  )
                }
              />

              <div>
                <strong>
                  Everyone in this scope
                </strong>

                <span>
                  All valid members can edit.
                </span>
              </div>
            </label>
          </div>

          {/* INDIVIDUAL MEMBERS */}

          <div className="access-section">
            <div className="access-section-title">
              <div>
                <h3>
                  People
                </h3>

                <p>
                  Give individual users access.
                </p>
              </div>
            </div>

            <div className="access-search">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="access-member-list">
              {filteredMembers.length === 0 ? (
                <div className="access-empty">
                  No members found.
                </div>
              ) : (
                filteredMembers.map(
                  (member) => {
                    const memberId =
                      String(
                        member.id ||
                          member._id
                      );

                    const isViewer =
                      viewers.includes(
                        memberId
                      );

                    const isEditor =
                      editors.includes(
                        memberId
                      );

                    return (
                      <div
                        key={memberId}
                        className="access-member-row"
                      >
                        <div className="access-member-info">

                          <div className="access-avatar">
                            {member.avatar ? (
                              <img
                                src={
                                  member.avatar
                                }
                                alt=""
                              />
                            ) : (
                              (
                                member.name ||
                                member.email ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>

                          <div>
                            <strong>
                              {member.name ||
                                "Unknown user"}
                            </strong>

                            <span>
                              {member.email}
                            </span>
                          </div>

                        </div>

                        <div className="access-member-actions">

                          <button
                            type="button"
                            className={
                              isViewer
                                ? "permission-button active"
                                : "permission-button"
                            }
                            onClick={() =>
                              toggleViewer(
                                memberId
                              )
                            }
                          >
                            {isViewer && (
                              <Check size={14} />
                            )}

                            View
                          </button>

                          <button
                            type="button"
                            className={
                              isEditor
                                ? "permission-button active"
                                : "permission-button"
                            }
                            onClick={() =>
                              toggleEditor(
                                memberId
                              )
                            }
                          >
                            {isEditor && (
                              <Check size={14} />
                            )}

                            Edit
                          </button>

                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>

        </div>

        <div className="access-modal-footer">

          <button
            type="button"
            className="access-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="access-save-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2
                  size={16}
                  className="spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save access
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};

/* =========================================================
   SUGGESTION COMPOSER
========================================================= */

const SuggestionComposer = ({
  originalText,
  onCancel,
  onSubmit,
}) => {
  const [
    suggestedText,
    setSuggestedText,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const handleSubmit = async () => {
    if (!suggestedText.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit(
        suggestedText.trim()
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="suggestion-composer-overlay">

      <div className="suggestion-composer">

        <div className="suggestion-composer-header">

          <div>
            <h3>
              Suggest a change
            </h3>

            <p>
              Propose an alternative
              without changing the
              document directly.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
          >
            <X size={17} />
          </button>

        </div>

        <div className="suggestion-composer-body">

          <label>
            Original text
          </label>

          <div className="suggestion-composer-original">
            {originalText}
          </div>

          <label>
            Suggested text
          </label>

          <textarea
            value={suggestedText}
            onChange={(event) =>
              setSuggestedText(
                event.target.value
              )
            }
            placeholder="Enter your suggested replacement..."
            autoFocus
          />

        </div>

        <div className="suggestion-composer-footer">

          <button
            type="button"
            className="suggestion-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="suggestion-submit"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !suggestedText.trim()
            }
          >
            {submitting ? (
              <>
                <Loader2
                  size={14}
                  className="spin"
                />

                Sending...
              </>
            ) : (
              <>
                <Sparkles
                  size={14}
                />

                Suggest
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   COLLABORATIVE TIPTAP EDITOR
========================================================= */

const CollaborativeEditor = ({
  ydoc,
  provider,
  membersRef,
  currentUser,
  permissions,
  initialContent,
  onEditorReady,
  onCommentClick,
  onSuggestionClick,
}) => {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),

      Collaboration.configure({
        document: ydoc,
      }),

      CollaborationCaret.configure({
        provider,

        user: {
          name:
            currentUser?.name ||
            currentUser?.email ||
            "User",

          color: "#6366f1",
        },
      }),

      TableKit,

      Image,

      Placeholder.configure({
        placeholder:
          "Start writing your document...",
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),

      Highlight,

      MentionExtension({
        membersRef,
      }),
    ],

    editable:
      permissions.canEdit === true,

    onUpdate: () => {
      // Parent handles autosave.
    },
  });

  /* =======================================================
     GIVE EDITOR INSTANCE TO PARENT
  ======================================================= */

  useEffect(() => {
    if (!editor) {
      return;
    }

    onEditorReady(editor);

    return () => {
      onEditorReady(null);
    };
  }, [
    editor,
    onEditorReady,
  ]);

  /* =======================================================
     UPDATE EDITABLE STATE
  ======================================================= */

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(
      permissions.canEdit === true
    );
  }, [
    editor,
    permissions.canEdit,
  ]);

  /* =======================================================
     SEED LEGACY MONGODB CONTENT
     
     IMPORTANT:
     Only seed when the synchronized Y.Doc is empty.
     
     We DO NOT continuously call setContent().
  ======================================================= */

  const seededRef = useRef(false);

  useEffect(() => {
    if (
      !editor ||
      seededRef.current
    ) {
      return;
    }

    if (!initialContent) {
      seededRef.current = true;
      return;
    }

    const normalized =
      normalizeContent(
        initialContent
      );

    /*
      If Hocuspocus already contains
      collaborative content, don't touch it.
    */

    if (!editor.isEmpty) {
      seededRef.current = true;
      return;
    }

    /*
      Only migrate old MongoDB content
      into the collaborative document once.
    */

    if (
      normalized &&
      normalized !== "<p></p>"
    ) {
      editor.commands.setContent(
        normalized,
        {
          emitUpdate: false,
        }
      );
    }

    seededRef.current = true;
  }, [
    editor,
    initialContent,
  ]);

  /* =======================================================
     LINK
  ======================================================= */

  const addLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl =
      editor.getAttributes(
        "link"
      ).href;

    const url =
      window.prompt(
        "Enter URL",
        previousUrl ||
          "https://"
      );

    if (url === null) {
      return;
    }

    if (!url) {
      editor
        .chain()
        .focus()
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: url,
      })
      .run();
  };

  /* =======================================================
     IMAGE
  ======================================================= */

  const addImage = () => {
    if (!editor) {
      return;
    }

    const url =
      window.prompt(
        "Enter image URL"
      );

    if (!url) {
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: url,
      })
      .run();
  };

  /* =======================================================
     TABLE
  ======================================================= */

  const insertTable = () => {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertTable({
        rows: 3,
        cols: 3,
        withHeaderRow: true,
      })
      .run();
  };

  /* =======================================================
     UNDO / REDO
  ======================================================= */

  const canUndo =
    editor &&
    permissions.canEdit &&
    editor.can()
      .chain()
      .undo()
      .run();

  const canRedo =
    editor &&
    permissions.canEdit &&
    editor.can()
      .chain()
      .redo()
      .run();

  return (
    <div className="tiptap-editor-container">

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="editor-toolbar">

        {/* HISTORY */}

        <ToolbarButton
          title="Undo"
          disabled={
            !editor ||
            !permissions.canEdit ||
            !canUndo
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .undo()
              .run()
          }
        >
          <Undo2 size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          disabled={
            !editor ||
            !permissions.canEdit ||
            !canRedo
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .redo()
              .run()
          }
        >
          <Redo2 size={16} />
        </ToolbarButton>

        <div className="toolbar-divider" />

        {/* HEADINGS */}

        <ToolbarButton
          title="Heading 1"
          active={editor?.isActive(
            "heading",
            { level: 1 }
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleHeading({
                level: 1,
              })
              .run()
          }
        >
          H1
        </ToolbarButton>

        <ToolbarButton
          title="Heading 2"
          active={editor?.isActive(
            "heading",
            { level: 2 }
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          title="Heading 3"
          active={editor?.isActive(
            "heading",
            { level: 3 }
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run()
          }
        >
          H3
        </ToolbarButton>

        <div className="toolbar-divider" />

        {/* FORMATTING */}

        <ToolbarButton
          title="Bold"
          active={editor?.isActive(
            "bold"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBold()
              .run()
          }
        >
          <Bold size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          active={editor?.isActive(
            "italic"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          <Italic size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Underline"
          active={editor?.isActive(
            "underline"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleUnderline()
              .run()
          }
        >
          <Underline size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Strike"
          active={editor?.isActive(
            "strike"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleStrike()
              .run()
          }
        >
          <Strikethrough
            size={16}
          />
        </ToolbarButton>

        <ToolbarButton
          title="Highlight"
          active={editor?.isActive(
            "highlight"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleHighlight()
              .run()
          }
        >
          <Highlighter
            size={16}
          />
        </ToolbarButton>

        <div className="toolbar-divider" />

        {/* LISTS */}

        <ToolbarButton
          title="Bullet list"
          active={editor?.isActive(
            "bulletList"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        >
          <List size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Numbered list"
          active={editor?.isActive(
            "orderedList"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        >
          <ListOrdered
            size={16}
          />
        </ToolbarButton>

        <ToolbarButton
          title="Blockquote"
          active={editor?.isActive(
            "blockquote"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
        >
          <Quote size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Code block"
          active={editor?.isActive(
            "codeBlock"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleCodeBlock()
              .run()
          }
        >
          <Code size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Horizontal rule"
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setHorizontalRule()
              .run()
          }
        >
          <Minus size={16} />
        </ToolbarButton>

        <div className="toolbar-divider" />

        {/* ALIGNMENT */}

        <ToolbarButton
          title="Align left"
          active={editor?.isActive({
            textAlign: "left",
          })}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
        >
          <AlignLeft size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Center"
          active={editor?.isActive({
            textAlign: "center",
          })}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setTextAlign("center")
              .run()
          }
        >
          <AlignCenter
            size={16}
          />
        </ToolbarButton>

        <ToolbarButton
          title="Align right"
          active={editor?.isActive({
            textAlign: "right",
          })}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setTextAlign("right")
              .run()
          }
        >
          <AlignRight size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Justify"
          active={editor?.isActive({
            textAlign: "justify",
          })}
          disabled={
            !permissions.canEdit
          }
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .setTextAlign("justify")
              .run()
          }
        >
          <AlignJustify
            size={16}
          />
        </ToolbarButton>

        <div className="toolbar-divider" />

        {/* LINK */}

        <ToolbarButton
          title="Link"
          active={editor?.isActive(
            "link"
          )}
          disabled={
            !permissions.canEdit
          }
          onClick={addLink}
        >
          <LinkIcon size={16} />
        </ToolbarButton>

        {/* IMAGE */}

        <ToolbarButton
          title="Image"
          disabled={
            !permissions.canEdit
          }
          onClick={addImage}
        >
          <ImageIcon size={16} />
        </ToolbarButton>

        {/* TABLE */}

        <ToolbarButton
          title="Insert table"
          disabled={
            !permissions.canEdit
          }
          onClick={insertTable}
        >
          <TableIcon size={16} />
        </ToolbarButton>

        <div className="toolbar-divider" />

        {/* COMMENT */}

        <ToolbarButton
          title="Comment"
          onClick={onCommentClick}
        >
          <MessageSquare
            size={16}
          />
        </ToolbarButton>

        {/* SUGGESTION */}

        <ToolbarButton
          title="Suggest a change"
          disabled={
            !permissions.canEdit
          }
          onMouseDown={(event) => {
            event.preventDefault();
            onSuggestionClick();
          }}
        >
          <Sparkles size={16} />
        </ToolbarButton>

      </div>

      {/* =================================================
          EDITOR
      ================================================= */}

      <EditorContent
        editor={editor}
      />

    </div>
  );
};

/* =========================================================
   MAIN DOCUMENT EDITOR
========================================================= */

const DocumentEditor = () => {
  const {
    user: currentUser,
  } = useAuth();

  const {
    documentId,
  } = useParams();

  const navigate =
    useNavigate();

  /* =======================================================
     DOCUMENT STATE
  ======================================================= */

  const [
    document,
    setDocument,
  ] = useState(null);

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    permissions,
    setPermissions,
  ] = useState({
    canView: false,
    canEdit: false,
    canShare: false,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("saved");

  /* =======================================================
     ACCESS
  ======================================================= */

  const [
    showAccessModal,
    setShowAccessModal,
  ] = useState(false);

  /* =======================================================
     COMMENTS
  ======================================================= */

  const [
    showComments,
    setShowComments,
  ] = useState(false);

  const [
    selectedRange,
    setSelectedRange,
  ] = useState(null);

  /* =======================================================
     SUGGESTIONS
  ======================================================= */

  const [
    showSuggestions,
    setShowSuggestions,
  ] = useState(true);

  const [
    suggestionRefreshKey,
    setSuggestionRefreshKey,
  ] = useState(0);

  const [
    suggestionRange,
    setSuggestionRange,
  ] = useState(null);

  const [
    showSuggestionComposer,
    setShowSuggestionComposer,
  ] = useState(false);

  /* =======================================================
     EDITOR
  ======================================================= */

  const [
    editorInstance,
    setEditorInstance,
  ] = useState(null);

  const autosaveTimer =
    useRef(null);

  /* =======================================================
     MEMBERS REF
  ======================================================= */

  const membersRef =
    useRef([]);

  /* =======================================================
     YJS / HOCUSPOCUS
     
     IMPORTANT:
     Y.Doc is created ONCE for this document.
     
     The same ydoc is passed to:
       1. HocuspocusProvider
       2. Tiptap Collaboration
  ======================================================= */

  const providerRef = useRef(null);

  const [collaborationReady, setCollaborationReady] =
    useState(false);

  const [provider, setProvider] =
    useState(null);

  // One Y.Doc for this document.
  // Both Hocuspocus and Tiptap will use this exact instance.
  const ydoc = useMemo(
    () => new Y.Doc(),
    [documentId]
  );

  const [
    collaborationStatus,
    setCollaborationStatus,
  ] = useState("connecting");


  /* =======================================================
     LOAD DOCUMENT FROM REST API
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadDocument =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await request(
              `${API_BASE_URL}/documents/${documentId}`
            );

          if (cancelled) {
            return;
          }

          const loadedDocument =
            data?.document;

          if (!loadedDocument) {
            throw new Error(
              "Document was not found"
            );
          }

          setDocument(
            loadedDocument
          );

          setTitle(
            loadedDocument.title ||
              ""
          );

          const loadedMembers =
            data?.members || [];

          setMembers(
            loadedMembers
          );

          membersRef.current =
            loadedMembers;

          setPermissions(
            data?.permissions || {
              canView: true,
              canEdit: false,
              canShare: false,
            }
          );
        } catch (error) {
          console.error(
            "Load document error:",
            error
          );

          if (!cancelled) {
            setError(
              error.message ||
                "Unable to load document"
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    if (documentId) {
      loadDocument();
    }

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  /* =======================================================
     HOCUSPOCUS PROVIDER
  ======================================================= */

  useEffect(() => {
    if (
      !documentId ||
      !ydoc
    ) {
      return;
    }

    let cancelled = false;

    const provider =
  new HocuspocusProvider({
    url:
      COLLABORATION_URL,

    name:
      `document:${documentId}`,

    document: ydoc,

    onAuthenticated() {
      console.log(
        "🔐 Collaboration authenticated"
      );
    },

    onSynced() {
      console.log(
        "🔄 Collaboration document synced"
      );

      if (!cancelled) {
        setCollaborationReady(true);
      }
    },

    onAwarenessChange: ({
      states,
    }) => {
      console.log(
        `👥 [${documentId}] Awareness states:`,
        states
      );
    },

    onAuthenticationFailed: ({
      reason,
    }) => {
      console.error(
        "❌ Collaboration authentication failed:",
        reason
      );

      if (!cancelled) {
        setCollaborationStatus(
          "error"
        );

        setError(
          reason ||
            "Unable to connect to collaboration server"
        );
      }
    },

    onStatus: ({
      status,
    }) => {
      console.log(
        "Collaboration status:",
        status
      );

      if (!cancelled) {
        setCollaborationStatus(
          status
        );
      }
    },

    onDisconnect() {
      if (!cancelled) {
        setCollaborationStatus(
          "disconnected"
        );
      }
    },
  });

    providerRef.current =
      provider;

      setProvider(provider);
    return () => {
      cancelled = true;

      provider.destroy();

      providerRef.current = null;
      setProvider(null);

      setCollaborationReady(false);

      setCollaborationStatus(
        "disconnected"
      );

      setEditorInstance(
        null
      );
    };
  }, [
    documentId,
    ydoc,
  ]);

  /* =======================================================
     PROVIDER CLEANUP WHEN DOCUMENT CHANGES
  ======================================================= */

  useEffect(() => {
    return () => {
      if (
        autosaveTimer.current
      ) {
        clearTimeout(
          autosaveTimer.current
        );
      }

      if (
        providerRef.current
      ) {
        providerRef.current.destroy();

        providerRef.current =
          null;
      }

    };
  }, [documentId]);

  /* =======================================================
     SAVE DOCUMENT
  ======================================================= */

  const saveDocument =
    async () => {
      if (
        !editorInstance ||
        !documentId ||
        !permissions.canEdit
      ) {
        return;
      }

      try {
        setSaveStatus(
          "saving"
        );

        const htmlContent =
          editorInstance.getHTML();

        const data =
          await request(
            `${API_BASE_URL}/documents/${documentId}`,
            {
              method: "PATCH",

              body: JSON.stringify({
                title:
                  title.trim(),

                content:
                  htmlContent,
              }),
            }
          );

        if (data?.document) {
          setDocument(
            data.document
          );
        }

        setSaveStatus(
          "saved"
        );
      } catch (error) {
        console.error(
          "Save document error:",
          error
        );

        setSaveStatus(
          "error"
        );
      }
    };

  /* =======================================================
     AUTOSAVE
     
     MongoDB receives snapshots.
     
     Yjs/Hocuspocus handles real-time editing.
  ======================================================= */

  useEffect(() => {
    if (
      !editorInstance ||
      !document ||
      !permissions.canEdit
    ) {
      return;
    }

    const handleUpdate =
      () => {
        setSaveStatus(
          "unsaved"
        );

        clearTimeout(
          autosaveTimer.current
        );

        autosaveTimer.current =
          setTimeout(
            async () => {
              await saveDocument();
            },
            1500
          );
      };

    editorInstance.on(
      "update",
      handleUpdate
    );

    return () => {
      editorInstance.off(
        "update",
        handleUpdate
      );

      clearTimeout(
        autosaveTimer.current
      );
    };
  }, [
    editorInstance,
    document,
    permissions.canEdit,
    title,
  ]);

  /* =======================================================
     TITLE
  ======================================================= */

  const handleTitleChange =
    (event) => {
      setTitle(
        event.target.value
      );

      setSaveStatus(
        "unsaved"
      );

      clearTimeout(
        autosaveTimer.current
      );

      autosaveTimer.current =
        setTimeout(
          async () => {
            await saveDocument();
          },
          1500
        );
    };

  /* =======================================================
     ACCESS UPDATE
  ======================================================= */

  const updateAccess =
    async (access) => {
      const data =
        await request(
          `${API_BASE_URL}/documents/${documentId}/access`,
          {
            method: "PATCH",

            body: JSON.stringify({
              access,
            }),
          }
        );

      if (data?.document) {
        setDocument(
          data.document
        );
      }

      const refreshed =
        await request(
          `${API_BASE_URL}/documents/${documentId}`
        );

      setPermissions(
        refreshed?.permissions || {}
      );

      setMembers(
        refreshed?.members ||
          members
      );

      membersRef.current =
        refreshed?.members ||
        members;
    };

  /* =======================================================
     COMMENT
  ======================================================= */

  const handleCommentClick =
    () => {
      if (!editorInstance) {
        return;
      }

      const {
        from,
        to,
      } =
        editorInstance.state.selection;

      if (from === to) {
        setShowComments(true);
        return;
      }

      setSelectedRange({
        from,
        to,
      });

      setShowComments(true);
    };

  /* =======================================================
     SUGGESTION
  ======================================================= */

  const handleSuggestionClick =
    () => {
      if (
        !editorInstance ||
        !permissions.canEdit
      ) {
        return;
      }

      const {
        from,
        to,
      } =
        editorInstance.state.selection;

      if (from === to) {
        window.alert(
          "Select some text before creating a suggestion."
        );

        return;
      }

      const originalText =
        editorInstance.state.doc.textBetween(
          from,
          to,
          " "
        );

      if (
        !originalText.trim()
      ) {
        return;
      }

      setSuggestionRange({
        from,
        to,
        originalText,
      });

      setShowSuggestions(
        true
      );

      setShowSuggestionComposer(
        true
      );
    };

  const submitSuggestion =
    async (suggestedText) => {
      if (!suggestionRange) {
        return;
      }

      try {
        await createDocumentSuggestion(
          documentId,
          {
            from:
              suggestionRange.from,

            to:
              suggestionRange.to,

            originalText:
              suggestionRange.originalText,

            suggestedText,
          }
        );

        setShowSuggestionComposer(
          false
        );

        setSuggestionRange(
          null
        );

        setSuggestionRefreshKey(
          (current) =>
            current + 1
        );

        setShowSuggestions(
          true
        );
      } catch (error) {
        console.error(
          "Create suggestion error:",
          error
        );

        window.alert(
          error.message ||
            "Unable to create suggestion"
        );

        throw error;
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="document-editor-loading">
        <Loader2
          size={24}
          className="spin"
        />

        <span>
          Loading document...
        </span>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="document-editor-error">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/documents"
            )
          }
        >
          <ArrowLeft
            size={18}
          />

          Back to Documents
        </button>

        <h2>
          Unable to open document
        </h2>

        <p>
          {error}
        </p>

      </div>
    );
  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="document-editor-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="document-editor-header">

        <div className="document-editor-header-left">

          <button
            type="button"
            className="editor-back-button"
            onClick={() =>
              navigate(
                "/documents"
              )
            }
            title="Back"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <div className="document-icon">
            <span>
              ▤
            </span>
          </div>

          <div className="document-header-info">

            <strong>
              {title ||
                "Untitled document"}
            </strong>

            <span>
              Document Editor
            </span>

          </div>

        </div>

        <div className="document-editor-header-right">

          {/* COLLABORATION STATUS */}

          {collaborationReady ? (
            <div className="collaboration-status connected">
              <span className="status-dot" />
              Live
            </div>
          ) : (
            <div className="collaboration-status connecting">
              <Loader2
                size={13}
                className="spin"
              />
              Connecting...
            </div>
          )}

          {/* READ ONLY */}

          {!permissions.canEdit && (
            <div className="read-only-indicator">
              <Lock size={14} />
              Read only
            </div>
          )}

          {/* COMMENTS */}

          <button
            type="button"
            className="comments-toggle-button"
            onClick={() =>
              setShowComments(
                (current) =>
                  !current
              )
            }
          >
            <MessageSquare
              size={16}
            />

            Comments
          </button>

          {/* SHARE */}

          {permissions.canShare && (
            <button
              type="button"
              className="share-button"
              onClick={() =>
                setShowAccessModal(
                  true
                )
              }
            >
              <Share2
                size={16}
              />

              Share
            </button>
          )}

          {/* SAVE */}

          <button
            type="button"
            className="save-button"
            onClick={
              saveDocument
            }
            disabled={
              !permissions.canEdit ||
              saveStatus ===
                "saving"
            }
          >
            {saveStatus ===
            "saving" ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <Save size={16} />
            )}

            {saveStatus ===
            "saving"
              ? "Saving..."
              : "Save"}
          </button>

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="document-editor-content">

        <div className="document-editor-workspace">

          <div className="document-editor-inner">

            {/* TITLE */}

            <input
              type="text"
              value={title}
              onChange={
                handleTitleChange
              }
              disabled={
                !permissions.canEdit
              }
              className="document-title-input"
              placeholder="Untitled document"
            />

            {/* =================================================
                COLLABORATIVE EDITOR
            ================================================= */}

            {collaborationReady &&
            provider &&
            ydoc ? (
              <CollaborativeEditor
                ydoc={ydoc}
                provider={provider}
                membersRef={
                  membersRef
                }
                currentUser={
                  currentUser
                }
                permissions={
                  permissions
                }
                initialContent={
                  document?.content
                }
                onEditorReady={
                  setEditorInstance
                }
                onCommentClick={
                  handleCommentClick
                }
                onSuggestionClick={
                  handleSuggestionClick
                }
              />
            ) : (
              <div className="document-collaboration-loading">
                <Loader2
                  size={20}
                  className="spin"
                />

                <span>
                  Connecting to collaborative editor...
                </span>
              </div>
            )}

            {/* FOOTER */}

            <div className="document-editor-footer">

              <div>

                {saveStatus ===
                  "saved" && (
                  <span>
                    Saved
                  </span>
                )}

                {saveStatus ===
                  "unsaved" && (
                  <span>
                    Unsaved changes
                  </span>
                )}

                {saveStatus ===
                  "saving" && (
                  <span>
                    Saving...
                  </span>
                )}

                {saveStatus ===
                  "error" && (
                  <span>
                    Failed to save
                  </span>
                )}

              </div>

              {!permissions.canEdit && (
                <div className="read-only-footer">

                  <Lock
                    size={13}
                  />

                  You have read-only
                  access to this document.

                </div>
              )}

            </div>

          </div>

          {/* COMMENTS */}

          {showComments && (
            <DocumentComments
              documentId={
                documentId
              }
              selectedRange={
                selectedRange
              }
              onClearSelection={() =>
                setSelectedRange(
                  null
                )
              }
            />
          )}

          {/* SUGGESTIONS */}

          {showSuggestions && (
            <DocumentSuggestions
              key={`${documentId}-${suggestionRefreshKey}`}
              documentId={
                documentId
              }
              editor={
                editorInstance
              }
              canEdit={
                permissions.canEdit
              }
              onDocumentChanged={
                saveDocument
              }
            />
          )}

        </div>

      </div>

      {/* =================================================
          ACCESS MODAL
      ================================================= */}

      {showAccessModal &&
        permissions.canShare && (
          <AccessModal
            document={
              document
            }
            members={
              members
            }
            onClose={() =>
              setShowAccessModal(
                false
              )
            }
            onSave={
              updateAccess
            }
          />
        )}

      {/* =================================================
          SUGGESTION COMPOSER
      ================================================= */}

      {showSuggestionComposer &&
        suggestionRange && (
          <SuggestionComposer
            originalText={
              suggestionRange.originalText
            }
            onCancel={() => {
              setShowSuggestionComposer(
                false
              );

              setSuggestionRange(
                null
              );
            }}
            onSubmit={
              submitSuggestion
            }
          />
        )}

    </div>
  );
};

export default DocumentEditor;