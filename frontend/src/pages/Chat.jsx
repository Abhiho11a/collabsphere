import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AtSign,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "👍",
  "❤️",
  "🔥",
  "🎉",
  "👏",
  "😄",
  "😢",
  "😡",
  "🤔",
  "🚀",
  "✅",
  "🙏",
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value) => {
  if (!value) return null;

  if (
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        value.userId ||
        value.uid ||
        ""
    );
  }

  return String(value);
};

const sameId = (a, b) => {
  const first = normalizeId(a);
  const second = normalizeId(b);

  return (
    first &&
    second &&
    first === second
  );
};

const getMessageId = (message) =>
  normalizeId(
    message?._id ||
      message?.id
  );

const getSender = (message) =>
  message?.sender ||
  message?.user ||
  message?.createdBy ||
  null;

const getSenderId = (message) =>
  normalizeId(
    getSender(message)?._id ||
      getSender(message)?.id ||
      getSender(message)?.userId ||
      getSender(message)?.uid ||
      message?.senderId ||
      message?.userId
  );

const getSenderName = (
  message,
  currentUser
) => {
  const sender =
    getSender(message);

  if (sender?.name) {
    return sender.name;
  }

  if (sender?.email) {
    return sender.email;
  }

  if (
    sameId(
      getSenderId(message),
      normalizeId(currentUser)
    )
  ) {
    return (
      currentUser?.name ||
      currentUser?.email ||
      "You"
    );
  }

  return "Unknown user";
};

const getInitials = (name) => {
  if (!name) return "U";

  const parts =
    name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatFileSize = (size) => {
  if (!size) return "";

  if (size < 1024) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

const getReplyToId = (
  message
) =>
  normalizeId(
    message?.replyTo?._id ||
      message?.replyTo?.id ||
      message?.replyTo
  );

const isReplyTo = (
  message,
  parentId
) =>
  sameId(
    getReplyToId(message),
    parentId
  );

/* =========================================================
   FETCH HELPER
========================================================= */

const request = async (
  url,
  options = {}
) => {
  const response = await fetch(
    url,
    {
      credentials: "include",
      ...options,
    }
  );

  const raw =
    await response.text();

  let data = {};

  try {
    data = raw
      ? JSON.parse(raw)
      : {};
  } catch {
    throw new Error(
      `Server returned ${response.status} instead of JSON.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

/* =========================================================
   MESSAGE ITEM
========================================================= */

function MessageItem({
  message,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onOpenThread,
  isThreadReply = false,
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [
    reactionOpen,
    setReactionOpen,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    editText,
    setEditText,
  ] = useState(
    message?.content || ""
  );

  const messageId =
    getMessageId(message);

  const own =
    sameId(
      getSenderId(message),
      normalizeId(currentUser)
    );

  const senderName =
    getSenderName(
      message,
      currentUser
    );

  const reactions =
    Array.isArray(
      message?.reactions
    )
      ? message.reactions
      : [];

  const attachments =
    Array.isArray(
      message?.attachments
    )
      ? message.attachments
      : [];

  const replyTo =
    message?.replyTo &&
    typeof message.replyTo ===
      "object"
      ? message.replyTo
      : null;

  useEffect(() => {
    if (!editing) {
      setEditText(
        message?.content || ""
      );
    }
  }, [
    message?.content,
    editing,
  ]);

  const saveEdit = async () => {
    const value =
      editText.trim();

    if (!value) {
      return;
    }

    try {
      await onEdit(
        messageId,
        value
      );

      setEditing(false);
    } catch {
      // Parent displays error.
    }
  };

  return (
    <div
      className={`group flex w-full ${
        own
          ? "justify-end"
          : "justify-start"
      } ${
        isThreadReply
          ? "pl-5"
          : ""
      }`}
    >
      <div className="relative max-w-[75%] min-w-0">
        {!own &&
          !isThreadReply && (
            <div className="mb-1 px-1 text-[10px] font-medium text-slate-500">
              {senderName}
            </div>
          )}

        {/* =================================================
            REPLY PREVIEW
        ================================================= */}

        {replyTo &&
          !isThreadReply && (
            <button
              type="button"
              onClick={() =>
                onOpenThread?.(
                  replyTo
                )
              }
              className="mb-1 w-full rounded-lg border-l-2 border-indigo-500/60 bg-slate-900/80 px-3 py-2 text-left"
            >
              <div className="text-[9px] font-medium text-indigo-400">
                Replying to{" "}
                {getSenderName(
                  replyTo,
                  currentUser
                )}
              </div>

              <div className="mt-0.5 truncate text-[10px] text-slate-500">
                {replyTo?.isDeleted
                  ? "Message deleted"
                  : replyTo?.content ||
                    "Attachment"}
              </div>
            </button>
          )}

        {/* =================================================
            MESSAGE
        ================================================= */}

        {editing ? (
          <div className="rounded-xl border border-indigo-500/40 bg-slate-950 p-2">
            <textarea
              autoFocus
              value={editText}
              onChange={(e) =>
                setEditText(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Escape"
                ) {
                  setEditing(false);
                  setEditText(
                    message?.content ||
                      ""
                  );
                }

                if (
                  e.key ===
                    "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              className="min-h-[65px] w-full resize-none bg-transparent px-2 py-1 text-xs leading-5 text-slate-200 outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditText(
                    message?.content ||
                      ""
                  );
                }}
                className="rounded-lg px-2.5 py-1.5 text-[10px] text-slate-500 hover:bg-slate-900 hover:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveEdit
                }
                disabled={
                  !editText.trim()
                }
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl border px-3.5 py-2.5 ${
              message?.isDeleted
                ? "border-slate-800 bg-slate-900/70"
                : own
                ? "rounded-br-md border-indigo-500/30 bg-indigo-600 text-white"
                : "rounded-bl-md border-slate-800 bg-slate-900 text-slate-300"
            }`}
          >
            {message?.isDeleted ? (
              <div className="text-xs italic text-slate-500">
                {own
                  ? "You deleted this message"
                  : "This message was deleted"}
              </div>
            ) : (
              <>
                {message?.content && (
                  <div className="whitespace-pre-wrap break-words text-xs leading-5">
                    {message.content}
                  </div>
                )}

                {/* =================================================
                    ATTACHMENTS
                ================================================= */}

                {attachments.length >
                  0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map(
                      (
                        attachment,
                        index
                      ) => {
                        const url =
                          attachment?.url ||
                          attachment?.fileUrl;

                        const key =
                          attachment?.publicId ||
                          attachment?.url ||
                          `${attachment?.name}-${index}`;

                        const isImage =
                          String(
                            attachment?.mimeType ||
                              ""
                          ).startsWith(
                            "image/"
                          );

                        if (
                          isImage &&
                          url
                        ) {
                          return (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-xl border border-white/10 bg-black/10"
                            >
                              <img
                                src={url}
                                alt={
                                  attachment?.name ||
                                  "Attachment"
                                }
                                className="max-h-[280px] w-full object-contain"
                              />

                              <div className="flex items-center gap-2 px-2.5 py-2">
                                <ImageIcon
                                  size={
                                    13
                                  }
                                />

                                <span className="min-w-0 flex-1 truncate text-[9px]">
                                  {attachment?.name ||
                                    "Image"}
                                </span>

                                <Link2
                                  size={
                                    11
                                  }
                                />
                              </div>
                            </a>
                          );
                        }

                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-2.5 py-2"
                          >
                            <FileText
                              size={
                                15
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[10px]">
                                {attachment?.name ||
                                  "Attachment"}
                              </div>

                              {attachment?.size && (
                                <div className="text-[8px] opacity-50">
                                  {formatFileSize(
                                    attachment.size
                                  )}
                                </div>
                              )}
                            </div>

                            <Link2
                              size={
                                11
                              }
                            />
                          </a>
                        );
                      }
                    )}
                  </div>
                )}

                {message?.isEdited && (
                  <span className="ml-1 text-[9px] opacity-60">
                    (edited)
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        {!message?.isDeleted &&
          !editing && (
            <div
              className={`absolute top-full z-30 mt-1 hidden items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-950 p-1 shadow-xl group-hover:flex ${
                own
                  ? "right-0"
                  : "left-0"
              }`}
            >
              <button
                type="button"
                title="Reply"
                onClick={() =>
                  onReply?.(
                    message
                  )
                }
                className="rounded p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
              >
                <Reply size={13} />
              </button>

              <button
                type="button"
                title="React"
                onClick={() =>
                  setReactionOpen(
                    (v) => !v
                  )
                }
                className="rounded p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
              >
                <Smile size={13} />
              </button>

              <button
                type="button"
                title="Thread"
                onClick={() =>
                  onOpenThread?.(
                    message
                  )
                }
                className="rounded p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
              >
                <MessageCircle
                  size={13}
                />
              </button>

              {own && (
                <button
                  type="button"
                  title="Edit"
                  onClick={() => {
                    setEditing(
                      true
                    );
                    setMenuOpen(
                      false
                    );
                  }}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                >
                  <Pencil size={13} />
                </button>
              )}

              {own && (
                <button
                  type="button"
                  title="Delete"
                  onClick={() =>
                    onDelete?.(
                      messageId
                    )
                  }
                  className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2
                    size={13}
                  />
                </button>
              )}
            </div>
          )}

        {/* =================================================
            REACTION PICKER
        ================================================= */}

        {reactionOpen && (
          <div
            className={`absolute top-full z-40 mt-9 flex w-[230px] flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl ${
              own
                ? "right-0"
                : "left-0"
            }`}
          >
            {EMOJIS.map(
              (emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReaction?.(
                      messageId,
                      emoji
                    );

                    setReactionOpen(
                      false
                    );
                  }}
                  className="rounded-lg px-1.5 py-1 text-base hover:bg-slate-900"
                >
                  {emoji}
                </button>
              )
            )}
          </div>
        )}

        {/* =================================================
            REACTIONS
        ================================================= */}

        {reactions.length >
          0 && (
          <div
            className={`mt-1 flex flex-wrap gap-1 ${
              own
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {reactions.map(
              (reaction) => {
                const users =
                  Array.isArray(
                    reaction?.users
                  )
                    ? reaction.users
                    : [];

                const reacted =
                  users.some(
                    (id) =>
                      sameId(
                        id,
                        normalizeId(
                          currentUser
                        )
                      )
                  );

                return (
                  <button
                    key={
                      reaction.emoji
                    }
                    type="button"
                    onClick={() =>
                      onReaction?.(
                        messageId,
                        reaction.emoji
                      )
                    }
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      reacted
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    {reaction.emoji}{" "}
                    {users.length}
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* =================================================
            TIME / READ
        ================================================= */}

        <div
          className={`mt-1 flex items-center gap-1 px-1 text-[9px] text-slate-700 ${
            own
              ? "justify-end"
              : ""
          }`}
        >
          <span>
            {formatTime(
              message?.createdAt
            )}
          </span>

          {own &&
            (message?.isRead ? (
              <CheckCheck
                size={12}
                className="text-indigo-400"
              />
            ) : (
              <Check size={11} />
            ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   THREAD PANEL
========================================================= */

function ThreadPanel({
  original,
  messages,
  currentUser,
  onClose,
  onSendReply,
  onEdit,
  onDelete,
  onReaction,
}) {
  const [
    replyText,
    setReplyText,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);

  const originalId =
    getMessageId(original);

  const replies =
    useMemo(() => {
      if (!originalId) {
        return [];
      }

      return messages.filter(
        (message) =>
          isReplyTo(
            message,
            originalId
          )
      );
    }, [
      messages,
      originalId,
    ]);

  useEffect(() => {
    setReplyText("");
    setSending(false);
  }, [originalId]);

  if (!original) {
    return null;
  }

  const sendReply =
    async () => {
      const value =
        replyText.trim();

      if (
        !value ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        await onSendReply(
          original,
          value
        );

        setReplyText("");
      } catch {
        // Parent displays error.
      } finally {
        setSending(false);
      }
    };

  return (
    <aside className="flex h-full w-[330px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">
      {/* HEADER */}

      <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <div>
          <div className="text-xs font-semibold text-slate-200">
            Thread
          </div>

          <div className="mt-0.5 text-[9px] text-slate-600">
            {replies.length}{" "}
            {replies.length ===
            1
              ? "reply"
              : "replies"}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-900 hover:text-slate-200"
        >
          <X size={15} />
        </button>
      </div>

      {/* THREAD BODY */}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* ORIGINAL */}

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-[9px] font-semibold text-indigo-400">
              {getInitials(
                getSenderName(
                  original,
                  currentUser
                )
              )}
            </div>

            <div>
              <div className="text-[10px] font-medium text-indigo-400">
                {getSenderName(
                  original,
                  currentUser
                )}
              </div>

              <div className="text-[8px] text-slate-600">
                {formatTime(
                  original.createdAt
                )}
              </div>
            </div>
          </div>

          <div className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
            {original.isDeleted
              ? "Message deleted"
              : original.content ||
                "Attachment"}
          </div>

          {Array.isArray(
            original.attachments
          ) &&
            original.attachments
              .length > 0 && (
              <div className="mt-2 space-y-1">
                {original.attachments.map(
                  (
                    attachment,
                    index
                  ) => (
                    <a
                      key={
                        attachment?.publicId ||
                        index
                      }
                      href={
                        attachment?.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2 text-[9px] text-slate-400"
                    >
                      <Paperclip
                        size={11}
                      />

                      <span className="min-w-0 flex-1 truncate">
                        {attachment?.name ||
                          "Attachment"}
                      </span>

                      <Link2
                        size={10}
                      />
                    </a>
                  )
                )}
              </div>
            )}
        </div>

        {/* CONNECTION */}

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-900" />

          <span className="text-[8px] uppercase tracking-wider text-slate-700">
            Replies
          </span>

          <div className="h-px flex-1 bg-slate-900" />
        </div>

        {/* REPLIES */}

        <div className="space-y-3">
          {replies.map(
            (reply) => (
              <MessageItem
                key={getMessageId(
                  reply
                )}
                message={reply}
                currentUser={
                  currentUser
                }
                onReply={() => {}}
                onEdit={
                  onEdit
                }
                onDelete={
                  onDelete
                }
                onReaction={
                  onReaction
                }
                onOpenThread={() => {}}
                isThreadReply
              />
            )
          )}

          {replies.length ===
            0 && (
            <div className="py-8 text-center">
              <MessageCircle
                size={18}
                className="mx-auto mb-2 text-slate-800"
              />

              <div className="text-[10px] text-slate-600">
                No replies yet.
              </div>

              <div className="mt-1 text-[9px] text-slate-700">
                Be the first to
                reply.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* THREAD COMPOSER */}

      <div className="shrink-0 border-t border-slate-800 p-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2">
          <textarea
            value={replyText}
            onChange={(e) =>
              setReplyText(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key ===
                  "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                sendReply();
              }
            }}
            rows={2}
            placeholder="Reply in thread..."
            className="min-h-[45px] w-full resize-none bg-transparent px-1 py-1 text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-600"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={
                sendReply
              }
              disabled={
                sending ||
                !replyText.trim()
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   CHAT PAGE
========================================================= */

export default function Chat() {
  const { user } =
    useAuth();

  const [
    searchParams,
  ] = useSearchParams();

  const organizationId =
    localStorage.getItem(
      "currentOrganizationId"
    );

  const targetUserId =
    searchParams.get(
      "userId"
    );

  const currentUserId =
    normalizeId(user);

  /* =======================================================
     STATE
  ======================================================= */

  const [
    chatType,
    setChatType,
  ] = useState(
    "organization"
  );

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    activeConversation,
    setActiveConversation,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    messageText,
    setMessageText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    conversationSearch,
    setConversationSearch,
  ] = useState("");

  const [
    messageSearch,
    setMessageSearch,
  ] = useState("");

  const [
    typingUsers,
    setTypingUsers,
  ] = useState([]);

  const [
    replyingTo,
    setReplyingTo,
  ] = useState(null);

  const [
    threadMessage,
    setThreadMessage,
  ] = useState(null);

  const [
    emojiOpen,
    setEmojiOpen,
  ] = useState(false);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    newChatOpen,
    setNewChatOpen,
  ] = useState(false);

  const [
    newChatEmail,
    setNewChatEmail,
  ] = useState("");

  const [
    newChatError,
    setNewChatError,
  ] = useState("");

  const [
    clearOpen,
    setClearOpen,
  ] = useState(false);

  const [
    clearing,
    setClearing,
  ] = useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const messagesRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const typingTimeoutRef =
    useRef(null);

  /* =======================================================
     ACTIVE CHAT
  ======================================================= */

  const activeConversationId =
    normalizeId(
      activeConversation
    );

  const isOrganization =
    chatType ===
    "organization";

  /* =======================================================
     SCROLL
  ======================================================= */

  const scrollToBottom =
    useCallback(
      (behavior = "smooth") => {
        setTimeout(() => {
          const element =
            messagesRef.current;

          if (!element) {
            return;
          }

          element.scrollTo({
            top:
              element.scrollHeight,
            behavior,
          });
        }, 50);
      },
      []
    );

  /* =======================================================
     LOAD CONVERSATIONS
  ======================================================= */

  const loadConversations =
    useCallback(
      async () => {
        if (
          !organizationId
        ) {
          return;
        }

        try {
          const data =
            await request(
              `${API_BASE_URL}/conversations?organizationId=${organizationId}`
            );

          const list =
            Array.isArray(
              data?.conversations
            )
              ? data.conversations
              : [];

          setConversations(
            list
          );

          /* -----------------------------------------------
             Open conversation from Dashboard Chat button
          ------------------------------------------------ */

          if (
            targetUserId &&
            !sameId(
              targetUserId,
              currentUserId
            )
          ) {
            const conversationData =
              await request(
                `${API_BASE_URL}/conversations`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    organizationId,
                    userId:
                      targetUserId,
                  }),
                }
              );

            if (
              conversationData?.conversation
            ) {
              const conversation =
                conversationData.conversation;

              setConversations(
                (previous) => {
                  const exists =
                    previous.some(
                      (item) =>
                        sameId(
                          item,
                          conversation
                        )
                    );

                  return exists
                    ? previous
                    : [
                        conversation,
                        ...previous,
                      ];
                }
              );

              setActiveConversation(
                conversation
              );

              setChatType(
                "direct"
              );
            }
          }
        } catch (err) {
          console.error(
            "Load conversations:",
            err
          );

          setError(
            err.message ||
              "Unable to load conversations."
          );
        }
      },
      [
        organizationId,
        targetUserId,
        currentUserId,
      ]
    );

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [
    user,
    loadConversations,
  ]);

  /* =======================================================
     LOAD CURRENT CHAT MESSAGES
  ======================================================= */

  const loadMessages =
    useCallback(
      async () => {
        if (
          isOrganization &&
          !organizationId
        ) {
          return;
        }

        if (
          !isOrganization &&
          !activeConversationId
        ) {
          setMessages([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError("");

          let url;


if (isOrganization) {
  // Create/get organization chat first
  await request(
    `${API_BASE_URL}/organization-chat/${organizationId}`,
    {
      method: "GET",
    }
  );

  url =
    `${API_BASE_URL}/organization-chat/${organizationId}/messages?limit=200`;
} else {
  url =
    `${API_BASE_URL}/conversations/${activeConversationId}/messages?limit=200`;
}

const data =
  await request(url);

setMessages(
  Array.isArray(data?.messages)
    ? data.messages
    : []
);
        } catch (err) {
          console.error(
            "Load chat messages:",
            err
          );

          setError(
            err.message ||
              "Unable to load messages."
          );

          setMessages([]);
        } finally {
          setLoading(false);
        }
      },
      [
        isOrganization,
        organizationId,
        activeConversationId,
      ]
    );

  useEffect(() => {
    setReplyingTo(null);
    setThreadMessage(null);
    setSelectedFile(null);
    setTypingUsers([]);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }

    loadMessages();
  }, [
    loadMessages,
  ]);

  /* =======================================================
     SOCKET
  ======================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    if (
      isOrganization &&
      !organizationId
    ) {
      return;
    }

    if (
      !isOrganization &&
      !activeConversationId
    ) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const joinChat =
      () => {
        if (isOrganization) {
          socket.emit(
            "join-organization",
            {
              organizationId,
            }
          );
        } else {
          socket.emit(
            "join-conversation",
            {
              conversationId:
                activeConversationId,
            }
          );
        }
      };

    if (socket.connected) {
      joinChat();
    } else {
      socket.once(
        "connect",
        joinChat
      );
    }

    /* =====================================================
       NEW MESSAGE
    ===================================================== */

    const handleNewMessage =
      (incoming) => {
        if (!incoming) {
          return;
        }

        const belongs =
          isOrganization
            ? sameId(
                incoming.organization,
                organizationId
              )
            : sameId(
                incoming.conversation,
                activeConversationId
              );

        if (!belongs) {
          return;
        }

        setMessages(
          (previous) => {
            const incomingId =
              getMessageId(
                incoming
              );

            const exists =
              previous.some(
                (item) =>
                  sameId(
                    getMessageId(
                      item
                    ),
                    incomingId
                  )
              );

            if (exists) {
              return previous.map(
                (item) =>
                  sameId(
                    getMessageId(
                      item
                    ),
                    incomingId
                  )
                    ? {
                        ...item,
                        ...incoming,
                      }
                    : item
              );
            }

            return [
              ...previous,
              incoming,
            ];
          }
        );

        scrollToBottom();

        if (
          !sameId(
            getSenderId(
              incoming
            ),
            currentUserId
          )
        ) {
          markAsRead([
            getMessageId(
              incoming
            ),
          ]);
        }
      };

    /* =====================================================
       MESSAGE UPDATED
    ===================================================== */

    const handleMessageUpdated =
      (updated) => {
        if (!updated) {
          return;
        }

        const belongs =
          isOrganization
            ? sameId(
                updated.organization,
                organizationId
              )
            : sameId(
                updated.conversation,
                activeConversationId
              );

        if (!belongs) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                sameId(
                  getMessageId(
                    message
                  ),
                  getMessageId(
                    updated
                  )
                )
                  ? {
                      ...message,
                      ...updated,
                    }
                  : message
            )
        );

        setThreadMessage(
          (previous) => {
            if (
              previous &&
              sameId(
                getMessageId(
                  previous
                ),
                getMessageId(
                  updated
                )
              )
            ) {
              return {
                ...previous,
                ...updated,
              };
            }

            return previous;
          }
        );
      };

    /* =====================================================
       MESSAGE DELETED
    ===================================================== */

    const handleDeleted =
      (payload) => {
        const deletedId =
          payload?.messageId ||
          payload?._id ||
          payload?.id;

        if (!deletedId) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                sameId(
                  getMessageId(
                    message
                  ),
                  deletedId
                )
                  ? {
                      ...message,
                      isDeleted:
                        true,
                      content: "",
                      attachments: [],
                    }
                  : message
            )
        );

        setThreadMessage(
          (previous) => {
            if (
              previous &&
              sameId(
                getMessageId(
                  previous
                ),
                deletedId
              )
            ) {
              return {
                ...previous,
                isDeleted:
                  true,
                content: "",
                attachments: [],
              };
            }

            return previous;
          }
        );
      };

    /* =====================================================
       REACTION
    ===================================================== */

    const handleReaction =
      (updated) => {
        if (!updated) {
          return;
        }

        const belongs =
          isOrganization
            ? sameId(
                updated.organization,
                organizationId
              )
            : sameId(
                updated.conversation,
                activeConversationId
              );

        if (!belongs) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                sameId(
                  getMessageId(
                    message
                  ),
                  getMessageId(
                    updated
                  )
                )
                  ? {
                      ...message,
                      ...updated,
                    }
                  : message
            )
        );

        setThreadMessage(
          (previous) => {
            if (
              previous &&
              sameId(
                getMessageId(
                  previous
                ),
                getMessageId(
                  updated
                )
              )
            ) {
              return {
                ...previous,
                ...updated,
              };
            }

            return previous;
          }
        );
      };

    /* =====================================================
       READ RECEIPTS
    ===================================================== */

    const handleRead =
      (payload = {}) => {
        const ids =
          payload?.messageIds ||
          [];

        if (
          !Array.isArray(ids)
        ) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                ids.some(
                  (id) =>
                    sameId(
                      id,
                      getMessageId(
                        message
                      )
                    )
                )
                  ? {
                      ...message,
                      isRead:
                        true,
                    }
                  : message
            )
        );
      };

    /* =====================================================
       TYPING
    ===================================================== */

    const handleTyping =
      (payload = {}) => {
        const belongs =
          isOrganization
            ? sameId(
                payload.organizationId,
                organizationId
              )
            : sameId(
                payload.conversationId,
                activeConversationId
              );

        if (!belongs) {
          return;
        }

        if (
          sameId(
            payload.userId,
            currentUserId
          )
        ) {
          return;
        }

        if (
          !payload.userId
        ) {
          return;
        }

        setTypingUsers(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  sameId(
                    item.userId,
                    payload.userId
                  )
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              {
                userId:
                  payload.userId,
                userName:
                  payload.userName ||
                  "Someone",
              },
            ];
          }
        );
      };

    /* =====================================================
       STOP TYPING
    ===================================================== */

    const handleStopTyping =
      (payload = {}) => {
        if (
          !payload.userId
        ) {
          return;
        }

        setTypingUsers(
          (previous) =>
            previous.filter(
              (item) =>
                !sameId(
                  item.userId,
                  payload.userId
                )
            )
        );
      };

    /* =====================================================
       EVENT NAMES
    ===================================================== */

    socket.on(
      "chat-message",
      handleNewMessage
    );

    socket.on(
      "private-message",
      handleNewMessage
    );

    socket.on(
      "chat-message-updated",
      handleMessageUpdated
    );

    socket.on(
      "private-message-updated",
      handleMessageUpdated
    );

    socket.on(
      "chat-message-deleted",
      handleDeleted
    );

    socket.on(
      "private-message-deleted",
      handleDeleted
    );

    socket.on(
      "chat-reaction",
      handleReaction
    );

    socket.on(
      "message-read",
      handleRead
    );

    socket.on(
      "chat-typing",
      handleTyping
    );

    socket.on(
      "chat-stop-typing",
      handleStopTyping
    );

    return () => {
      clearTimeout(
        typingTimeoutRef.current
      );

      if (isOrganization) {
        socket.emit(
          "leave-organization",
          {
            organizationId,
          }
        );
      } else {
        socket.emit(
          "leave-conversation",
          {
            conversationId:
              activeConversationId,
          }
        );
      }

      socket.off(
        "connect",
        joinChat
      );

      socket.off(
        "chat-message",
        handleNewMessage
      );

      socket.off(
        "private-message",
        handleNewMessage
      );

      socket.off(
        "chat-message-updated",
        handleMessageUpdated
      );

      socket.off(
        "private-message-updated",
        handleMessageUpdated
      );

      socket.off(
        "chat-message-deleted",
        handleDeleted
      );

      socket.off(
        "private-message-deleted",
        handleDeleted
      );

      socket.off(
        "chat-reaction",
        handleReaction
      );

      socket.off(
        "message-read",
        handleRead
      );

      socket.off(
        "chat-typing",
        handleTyping
      );

      socket.off(
        "chat-stop-typing",
        handleStopTyping
      );
    };
  }, [
    user,
    isOrganization,
    organizationId,
    activeConversationId,
    currentUserId,
    scrollToBottom,
  ]);

  /* =======================================================
     READ
  ======================================================= */

  const markAsRead =
    useCallback(
      async (ids) => {
        if (
          !ids ||
          ids.length === 0
        ) {
          return;
        }

        try {
          

          if (isOrganization) {
            url =
              `${API_BASE_URL}/organization-chat/${organizationId}/read`;
          } else {
            if (
              !activeConversationId
            ) {
              return;
            }

            url =
              `${API_BASE_URL}/conversations/${activeConversationId}/read`;
          }

          await request(url, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              messageIds: ids,
            }),
          });
        } catch (err) {
          console.error(
            "Mark read error:",
            err
          );
        }
      },
      [
        isOrganization,
        organizationId,
        activeConversationId,
      ]
    );

  useEffect(() => {
    if (
      messages.length ===
      0
    ) {
      return;
    }

    const unread =
      messages
        .filter(
          (message) =>
            !sameId(
              getSenderId(
                message
              ),
              currentUserId
            ) &&
            !message?.isRead
        )
        .map(
          getMessageId
        )
        .filter(Boolean);

    if (unread.length) {
      markAsRead(unread);
    }
  }, [
    messages,
    currentUserId,
    markAsRead,
  ]);

  /* =======================================================
     TYPING
  ======================================================= */

  const handleTextChange =
    (event) => {
      const value =
        event.target.value;

      setMessageText(value);

      clearTimeout(
        typingTimeoutRef.current
      );

      if (!value.trim()) {
        const payload =
          isOrganization
            ? {
                organizationId,
                userId:
                  currentUserId,
              }
            : {
                conversationId:
                  activeConversationId,
                userId:
                  currentUserId,
              };

        socket.emit(
          "chat-stop-typing",
          payload
        );

        return;
      }

      const payload =
        isOrganization
          ? {
              organizationId,
              userId:
                currentUserId,
              userName:
                user?.name ||
                user?.email ||
                "Someone",
            }
          : {
              conversationId:
                activeConversationId,
              userId:
                currentUserId,
              userName:
                user?.name ||
                user?.email ||
                "Someone",
            };

      socket.emit(
        "chat-typing",
        payload
      );

      typingTimeoutRef.current =
        setTimeout(() => {
          socket.emit(
            "chat-stop-typing",
            payload
          );
        }, 1000);
    };

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage =
    async () => {
      const content =
        messageText.trim();

      if (
        sending ||
        (!content &&
          !selectedFile)
      ) {
        return;
      }

      if (
        isOrganization &&
        !organizationId
      ) {
        return;
      }

      if (
        !isOrganization &&
        !activeConversationId
      ) {
        return;
      }

      try {
        setSending(true);
        setError("");

        let url;

        if (isOrganization) {
          url =
            `${API_BASE_URL}/organization-chat/${organizationId}/messages`;
        } else {
          url =
            `${API_BASE_URL}/conversations/${activeConversationId}/messages`;
        }

        let data;

        /* =================================================
           IMPORTANT FIX

           NO FILE:
           Send JSON.

           FILE:
           Send FormData.

           This avoids the organization-message
           "Unable to send organization message"
           problem caused by unnecessarily using
           multipart for ordinary messages.
        ================================================= */

        if (!selectedFile) {
          const body = {
            content,
          };

          const parent =
            replyingTo;

          if (parent) {
            body.replyTo =
              getMessageId(
                parent
              );
          }

          data = await request(
            url,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                body
              ),
            }
          );
        } else {
          const formData =
            new FormData();

          if (content) {
            formData.append(
              "content",
              content
            );
          }

          if (replyingTo) {
            formData.append(
              "replyTo",
              getMessageId(
                replyingTo
              )
            );
          }

          formData.append(
            "file",
            selectedFile
          );

          data = await request(
            url,
            {
              method: "POST",
              body: formData,
            }
          );
        }

        const created =
          data?.data ||
          data?.message;

        if (created) {
          setMessages(
            (previous) => {
              const id =
                getMessageId(
                  created
                );

              const exists =
                previous.some(
                  (item) =>
                    sameId(
                      getMessageId(
                        item
                      ),
                      id
                    )
                );

              if (exists) {
                return previous.map(
                  (item) =>
                    sameId(
                      getMessageId(
                        item
                      ),
                      id
                    )
                      ? {
                          ...item,
                          ...created,
                        }
                      : item
                );
              }

              return [
                ...previous,
                created,
              ];
            }
          );
        }

        setMessageText("");
        setSelectedFile(
          null
        );
        setReplyingTo(
          null
        );
        setEmojiOpen(
          false
        );

        if (
          textareaRef.current
        ) {
          textareaRef.current.style.height =
            "auto";
        }

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        socket.emit(
          "chat-stop-typing",
          isOrganization
            ? {
                organizationId,
                userId:
                  currentUserId,
              }
            : {
                conversationId:
                  activeConversationId,
                userId:
                  currentUserId,
              }
        );

        scrollToBottom();
      } catch (err) {
        console.error(
          "Send message error:",
          err
        );

        setError(
          err.message ||
            "Unable to send message."
        );
      } finally {
        setSending(false);
      }
    };

  /* =======================================================
     EDIT
  ======================================================= */

  const editMessage =
    async (
      messageId,
      content
    ) => {
      if (
        !messageId ||
        !content?.trim()
      ) {
        return;
      }

      try {
        setError("");

        const data =
          await request(
            `${API_BASE_URL}/messages/${messageId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                content:
                  content.trim(),
              }),
            }
          );

        const updated =
          data?.data ||
          data?.message;

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                sameId(
                  getMessageId(
                    message
                  ),
                  messageId
                )
                  ? {
                      ...message,
                      ...(updated ||
                        {}),
                      content:
                        updated?.content ||
                        content.trim(),
                      isEdited:
                        true,
                    }
                  : message
            )
        );

        setThreadMessage(
          (previous) =>
            previous &&
            sameId(
              getMessageId(
                previous
              ),
              messageId
            )
              ? {
                  ...previous,
                  ...(updated ||
                    {}),
                  content:
                    updated?.content ||
                    content.trim(),
                  isEdited:
                    true,
                }
              : previous
        );
      } catch (err) {
        console.error(
          "Edit error:",
          err
        );

        setError(
          err.message ||
            "Unable to edit message."
        );

        throw err;
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteMessage =
    async (
      messageId
    ) => {
      if (!messageId) {
        return;
      }

      if (
        !window.confirm(
          "Delete this message?"
        )
      ) {
        return;
      }

      try {
        await request(
          `${API_BASE_URL}/messages/${messageId}`,
          {
            method: "DELETE",
          }
        );

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                sameId(
                  getMessageId(
                    message
                  ),
                  messageId
                )
                  ? {
                      ...message,
                      isDeleted:
                        true,
                      content: "",
                      attachments: [],
                    }
                  : message
            )
        );
      } catch (err) {
        console.error(
          "Delete error:",
          err
        );

        setError(
          err.message ||
            "Unable to delete message."
        );
      }
    };

  /* =======================================================
     REACTION
  ======================================================= */

  const reactToMessage =
    async (
      messageId,
      emoji
    ) => {
      if (
        !messageId ||
        !emoji
      ) {
        return;
      }

      try {
        const data =
          await request(
            `${API_BASE_URL}/messages/${messageId}/reaction`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                emoji,
              }),
            }
          );

        const updated =
          data?.data ||
          data?.message;

        if (!updated) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                sameId(
                  getMessageId(
                    message
                  ),
                  messageId
                )
                  ? {
                      ...message,
                      ...updated,
                    }
                  : message
            )
        );
      } catch (err) {
        console.error(
          "Reaction error:",
          err
        );

        setError(
          err.message ||
            "Unable to update reaction."
        );
      }
    };

  /* =======================================================
     REPLY
  ======================================================= */

  const startReply =
    (message) => {
      setReplyingTo(
        message
      );

      /*
       * IMPORTANT:
       * Open thread immediately.
       *
       * This means when user clicks Reply,
       * they can see the original message and
       * the replies immediately.
       */
      setThreadMessage(
        message
      );

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    };

  const sendThreadReply =
    async (
      original,
      content
    ) => {
      /*
       * Directly send with the ORIGINAL
       * message ID as replyTo.
       */
      const originalId =
        getMessageId(
          original
        );

      if (!originalId) {
        throw new Error(
          "Original message ID is missing."
        );
      }

      if (
        isOrganization &&
        !organizationId
      ) {
        throw new Error(
          "Organization ID is missing."
        );
      }

      if (
        !isOrganization &&
        !activeConversationId
      ) {
        throw new Error(
          "Conversation ID is missing."
        );
      }

      const url =
        isOrganization
          ? `${API_BASE_URL}/organization-chat/${organizationId}/messages`
          : `${API_BASE_URL}/conversations/${activeConversationId}/messages`;

      const data =
        await request(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              content:
                content.trim(),
              replyTo:
                originalId,
            }),
          }
        );

      const created =
        data?.data ||
        data?.message;

      if (created) {
        setMessages(
          (previous) => {
            const createdId =
              getMessageId(
                created
              );

            const exists =
              previous.some(
                (message) =>
                  sameId(
                    getMessageId(
                      message
                    ),
                    createdId
                  )
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              created,
            ];
          }
        );
      }

      scrollToBottom();
    };

  /* =======================================================
     FILE
  ======================================================= */

  const handleFileSelect =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setError(
          "File must be 10 MB or smaller."
        );

        event.target.value =
          "";

        return;
      }

      setError("");

      setSelectedFile(
        file
      );
    };

  const removeFile =
    () => {
      setSelectedFile(
        null
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* =======================================================
     NEW CHAT
  ======================================================= */

  const createNewChat =
    async () => {
      const email =
        newChatEmail
          .trim()
          .toLowerCase();

      if (!email) {
        return;
      }

      try {
        setNewChatError("");

        const data =
          await request(
            `${API_BASE_URL}/organizations/${organizationId}/members`
          );

        const members =
          data?.members || [];

        const found =
          members.find(
            (member) => {
              const memberEmail =
                member?.user
                  ?.email ||
                member?.email ||
                "";

              return (
                memberEmail
                  .toLowerCase()
                  .trim() ===
                email
              );
            }
          );

        const targetId =
          normalizeId(
            found?.user
          ) ||
          normalizeId(
            found?.userId
          );

        if (!targetId) {
          throw new Error(
            "No active organization member found with this email."
          );
        }

        if (
          sameId(
            targetId,
            currentUserId
          )
        ) {
          throw new Error(
            "You cannot chat with yourself."
          );
        }

        const result =
          await request(
            `${API_BASE_URL}/conversations`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                organizationId,
                userId:
                  targetId,
              }),
            }
          );

        const conversation =
          result?.conversation;

        if (!conversation) {
          throw new Error(
            "Unable to create conversation."
          );
        }

        setConversations(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  sameId(
                    item,
                    conversation
                  )
              );

            return exists
              ? previous
              : [
                  conversation,
                  ...previous,
                ];
          }
        );

        setActiveConversation(
          conversation
        );

        setChatType(
          "direct"
        );

        setNewChatOpen(
          false
        );

        setNewChatEmail("");
      } catch (err) {
        console.error(
          "New chat error:",
          err
        );

        setNewChatError(
          err.message ||
            "Unable to start conversation."
        );
      }
    };

  /* =======================================================
     CLEAR CHAT
  ======================================================= */

  const clearChat =
    async () => {
      if (
        !activeConversationId
      ) {
        return;
      }

      try {
        setClearing(true);

        await request(
          `${API_BASE_URL}/conversations/${activeConversationId}/messages`,
          {
            method: "DELETE",
          }
        );

        setMessages([]);
        setClearOpen(false);
      } catch (err) {
        setError(
          err.message ||
            "Unable to clear conversation."
        );
      } finally {
        setClearing(false);
      }
    };

  /* =======================================================
     FILTER DIRECT CHATS
  ======================================================= */

  const filteredConversations =
    useMemo(() => {
      const query =
        conversationSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {
          const person =
            conversation?.participants?.find(
              (item) =>
                !sameId(
                  item,
                  currentUserId
                )
            );

          const text = `${person?.name || ""} ${
            person?.email || ""
          }`.toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      conversations,
      conversationSearch,
      currentUserId,
    ]);

  /* =======================================================
     SEARCH MESSAGES
  ======================================================= */

  const filteredMessages =
    useMemo(() => {
      const query =
        messageSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return messages;
      }

      return messages.filter(
        (message) =>
          String(
            message?.content ||
              ""
          )
            .toLowerCase()
            .includes(query)
      );
    }, [
      messages,
      messageSearch,
    ]);

  /* =======================================================
     TOP LEVEL MESSAGES
  ======================================================= */

  const topLevelMessages =
    filteredMessages.filter(
      (message) =>
        !getReplyToId(message)
    );

  /* =======================================================
     ACTIVE PARTICIPANT
  ======================================================= */

  const activeParticipant =
    activeConversation?.participants?.find(
      (participant) =>
        !sameId(
          participant,
          currentUserId
        )
    );

  const chatTitle =
    isOrganization
      ? "Organization Chat"
      : activeParticipant?.name ||
        activeParticipant?.email ||
        "Direct Message";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-[calc(100vh-92px)] min-h-0 w-full overflow-hidden border border-slate-800 bg-slate-950">
      {/* =================================================
          LEFT CHAT LIST
      ================================================= */}

      <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-slate-800">
        {/* HEADER */}

        <div className="shrink-0 border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <MessageCircle
                  size={18}
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-100">
                  Chat
                </div>

                <div className="text-[9px] text-slate-600">
                  Stay connected with
                  your team
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setNewChatOpen(
                  true
                )
              }
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-2 text-[10px] font-medium text-white hover:bg-indigo-500"
            >
              <Plus size={12} />
              New
            </button>
          </div>

          <div className="relative mt-4">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={
                conversationSearch
              }
              onChange={(e) =>
                setConversationSearch(
                  e.target.value
                )
              }
              placeholder="Search people or chats..."
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-8 pr-2 text-[10px] text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
            />
          </div>
        </div>

        {/* LIST */}

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {/* ORGANIZATION */}

          <button
            type="button"
            onClick={() =>
              setChatType(
                "organization"
              )
            }
            className={`mb-3 flex w-full items-center gap-3 rounded-xl p-3 text-left ${
              isOrganization
                ? "bg-indigo-500/10"
                : "hover:bg-slate-900"
            }`}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users size={17} />

              <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-slate-950 bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200">
                Organization Chat
              </div>

              <div className="truncate text-[9px] text-slate-600">
                Everyone in your
                organization
              </div>
            </div>

            <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[7px] text-indigo-400">
              GROUP
            </span>
          </button>

          {/* DIRECT */}

          <div className="px-2 pb-2 text-[9px] uppercase tracking-[.15em] text-slate-600">
            Direct Messages
          </div>

          {filteredConversations.map(
            (conversation) => {
              const person =
                conversation?.participants?.find(
                  (participant) =>
                    !sameId(
                      participant,
                      currentUserId
                    )
                );

              const name =
                person?.name ||
                person?.email ||
                "Unknown user";

              const selected =
                !isOrganization &&
                sameId(
                  conversation,
                  activeConversation
                );

              return (
                <button
                  key={getMessageId(
                    conversation
                  )}
                  type="button"
                  onClick={() => {
                    setChatType(
                      "direct"
                    );

                    setActiveConversation(
                      conversation
                    );
                  }}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left ${
                    selected
                      ? "bg-indigo-500/10"
                      : "hover:bg-slate-900"
                  }`}
                >
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-xs font-semibold text-indigo-400">
                    {getInitials(
                      name
                    )}

                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-slate-950 bg-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-200">
                      {name}
                    </div>

                    <div className="truncate text-[9px] text-slate-600">
                      {conversation
                        ?.lastMessage
                        ?.isDeleted
                        ? "Message deleted"
                        : conversation
                            ?.lastMessage
                            ?.content ||
                          "Start a conversation"}
                    </div>
                  </div>
                </button>
              );
            }
          )}

          {filteredConversations.length ===
            0 && (
            <div className="px-3 py-5 text-center text-[10px] text-slate-700">
              No direct
              conversations.
            </div>
          )}

          {/* PROJECT CHAT */}

          <div className="mt-5 px-2 pb-2 text-[9px] uppercase tracking-[.15em] text-slate-600">
            Project Chats
          </div>

          <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center">
            <MessageCircle
              size={18}
              className="mx-auto mb-2 text-slate-800"
            />

            <div className="text-[10px] text-slate-600">
              Your project chats
            </div>

            <div className="mt-1 text-[9px] text-slate-700">
              Project conversations
              will appear here.
            </div>
          </div>
        </div>
      </aside>

      {/* =================================================
          CHAT CONTENT
      ================================================= */}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}

        <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              {isOrganization ? (
                <Users size={17} />
              ) : (
                <User size={16} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xs font-semibold text-slate-200">
                  {chatTitle}
                </h2>

                {isOrganization && (
                  <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[7px] text-indigo-400">
                    GROUP
                  </span>
                )}
              </div>

              <div className="mt-0.5 text-[9px] text-emerald-400">
                {isOrganization
                  ? "Everyone in your organization"
                  : "Private conversation"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                value={
                  messageSearch
                }
                onChange={(e) =>
                  setMessageSearch(
                    e.target.value
                  )
                }
                placeholder="Search messages..."
                className="h-8 w-40 rounded-lg border border-slate-800 bg-slate-900/50 pl-7 pr-2 text-[9px] text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
              />
            </div>

            {!isOrganization &&
              activeConversationId && (
                <button
                  type="button"
                  onClick={() =>
                    setClearOpen(
                      true
                    )
                  }
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-900 hover:text-slate-300"
                >
                  <MoreVertical
                    size={15}
                  />
                </button>
              )}
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="flex shrink-0 items-center justify-between border-b border-red-500/20 bg-red-500/5 px-5 py-2">
            <span className="text-[10px] text-red-400">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* MESSAGES */}

        <div
          ref={
            messagesRef
          }
          className="min-h-0 flex-1 overflow-y-auto px-5 py-6"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-[10px] text-slate-600">
                  Loading messages...
                </div>
              </div>
            ) : topLevelMessages.length ===
              0 ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-700">
                  <MessageCircle
                    size={20}
                  />
                </div>

                <div className="text-xs text-slate-600">
                  {messageSearch
                    ? "No matching messages"
                    : "No messages yet"}
                </div>
              </div>
            ) : (
              topLevelMessages.map(
                (message) => {
                  const id =
                    getMessageId(
                      message
                    );

                  const replies =
                    messages.filter(
                      (reply) =>
                        isReplyTo(
                          reply,
                          id
                        )
                    );

                  return (
                    <div
                      key={id}
                      className="w-full"
                    >
                      {/* ORIGINAL */}

                      <MessageItem
                        message={
                          message
                        }
                        currentUser={
                          user
                        }
                        onReply={
                          startReply
                        }
                        onEdit={
                          editMessage
                        }
                        onDelete={
                          deleteMessage
                        }
                        onReaction={
                          reactToMessage
                        }
                        onOpenThread={
                          setThreadMessage
                        }
                      />

                      {/* =================================================
                          INLINE THREAD

                          THIS IS THE IMPORTANT FIX.

                          Replies are displayed directly underneath
                          their parent message.
                      ================================================= */}

                      {replies.length >
                        0 && (
                        <div className="relative mt-2 ml-5 space-y-2 border-l border-slate-800 pl-4">
                          {replies.map(
                            (
                              reply
                            ) => (
                              <MessageItem
                                key={getMessageId(
                                  reply
                                )}
                                message={
                                  reply
                                }
                                currentUser={
                                  user
                                }
                                onReply={
                                  startReply
                                }
                                onEdit={
                                  editMessage
                                }
                                onDelete={
                                  deleteMessage
                                }
                                onReaction={
                                  reactToMessage
                                }
                                onOpenThread={
                                  setThreadMessage
                                }
                                isThreadReply
                              />
                            )
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setThreadMessage(
                                message
                              )
                            }
                            className="ml-1 text-[9px] font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            View thread
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
              )
            )}

            <div />
          </div>
        </div>

        {/* =================================================
            COMPOSER
        ================================================= */}

        <footer className="shrink-0 border-t border-slate-800 px-5 pb-4 pt-3">
          <div className="mx-auto max-w-4xl">
            {/* TYPING */}

            {typingUsers.length >
              0 && (
              <div className="mb-2 flex items-center gap-2 px-1 text-[9px] text-indigo-400">
                <span>
                  {typingUsers
                    .slice(0, 2)
                    .map(
                      (item) =>
                        item.userName
                    )
                    .join(", ")}

                  {typingUsers.length ===
                  1
                    ? " is typing"
                    : " are typing"}
                </span>

                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-400" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]" />
                </span>
              </div>
            )}

            {/* REPLY PREVIEW */}

            {replyingTo && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">
                <div className="h-7 w-0.5 bg-indigo-500" />

                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-medium text-indigo-400">
                    Replying to{" "}
                    {getSenderName(
                      replyingTo,
                      user
                    )}
                  </div>

                  <div className="truncate text-[9px] text-slate-600">
                    {replyingTo.isDeleted
                      ? "Message deleted"
                      : replyingTo.content ||
                        "Attachment"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(
                      null
                    )
                  }
                  className="rounded p-1 text-slate-600 hover:bg-slate-900 hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* FILE PREVIEW */}

            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                {selectedFile.type?.startsWith(
                  "image/"
                ) ? (
                  <ImageIcon
                    size={14}
                    className="text-indigo-400"
                  />
                ) : (
                  <FileText
                    size={14}
                    className="text-indigo-400"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] text-slate-300">
                    {
                      selectedFile.name
                    }
                  </div>

                  <div className="text-[8px] text-slate-600">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    removeFile
                  }
                  className="rounded p-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* COMPOSER */}

            <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 focus-within:border-indigo-500/40">
              <textarea
                ref={
                  textareaRef
                }
                data-chat-composer="true"
                value={
                  messageText
                }
                onChange={
                  handleTextChange
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                      "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                disabled={
                  sending
                }
                placeholder={
                  isOrganization
                    ? "Message everyone in your organization..."
                    : "Type a message..."
                }
                className="block min-h-[60px] max-h-[140px] w-full resize-none bg-transparent px-4 pb-11 pt-3 pr-14 text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-600"
              />

              {/* TOOLS */}

              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  className="hidden"
                  onChange={
                    handleFileSelect
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                  title="Attach file"
                >
                  <Paperclip
                    size={15}
                  />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setEmojiOpen(
                        (v) => !v
                      )
                    }
                    className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                    title="Emoji"
                  >
                    <Smile
                      size={15}
                    />
                  </button>

                  {emojiOpen && (
                    <div className="absolute bottom-9 left-0 z-50 flex w-[220px] flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                      {EMOJIS.map(
                        (emoji) => (
                          <button
                            key={
                              emoji
                            }
                            type="button"
                            onClick={() => {
                              handleTextChange(
                                {
                                  target: {
                                    value:
                                      `${messageText}${emoji}`,
                                  },
                                }
                              );

                              setEmojiOpen(
                                false
                              );
                            }}
                            className="rounded-lg p-1.5 text-lg hover:bg-slate-900"
                          >
                            {
                              emoji
                            }
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleTextChange(
                      {
                        target: {
                          value:
                            `${messageText}@`,
                        },
                      }
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                  title="Mention"
                >
                  <AtSign
                    size={15}
                  />
                </button>
              </div>

              {/* SEND */}

              <button
                type="button"
                onClick={
                  sendMessage
                }
                disabled={
                  sending ||
                  (!messageText.trim() &&
                    !selectedFile)
                }
                className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                <Send size={13} />
              </button>
            </div>

            <div className="mt-1 text-center text-[8px] text-slate-700">
              Enter to send • Shift +
              Enter for new line • Max
              file 10 MB
            </div>
          </div>
        </footer>
      </main>

      {/* =================================================
          THREAD PANEL
      ================================================= */}

      {threadMessage && (
        <ThreadPanel
          original={
            threadMessage
          }
          messages={messages}
          currentUser={user}
          onClose={() =>
            setThreadMessage(
              null
            )
          }
          onSendReply={
            sendThreadReply
          }
          onEdit={
            editMessage
          }
          onDelete={
            deleteMessage
          }
          onReaction={
            reactToMessage
          }
        />
      )}

      {/* =================================================
          NEW CHAT MODAL
      ================================================= */}

      {newChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setNewChatOpen(
                false
              );
            }
          }}
        >
          <div className="w-full max-w-[400px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  New conversation
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Enter the email of an
                  organization member.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNewChatOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-900"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5">
              <input
                autoFocus
                value={
                  newChatEmail
                }
                onChange={(e) =>
                  setNewChatEmail(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    createNewChat();
                  }
                }}
                placeholder="member@example.com"
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
              />

              {newChatError && (
                <div className="mt-2 text-[10px] text-red-400">
                  {newChatError}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setNewChatOpen(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-800 px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-900"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    createNewChat
                  }
                  disabled={
                    !newChatEmail.trim()
                  }
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-[10px] text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          CLEAR CHAT
      ================================================= */}

      {clearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Trash2 size={17} />
            </div>

            <h2 className="text-sm font-semibold text-slate-100">
              Clear conversation?
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              This will remove the
              conversation history.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setClearOpen(
                    false
                  )
                }
                className="rounded-lg border border-slate-800 px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  clearChat
                }
                disabled={
                  clearing
                }
                className="rounded-lg bg-red-500/10 px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/20 disabled:opacity-40"
              >
                {clearing
                  ? "Clearing..."
                  : "Clear chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}