import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  Edit3,
  Loader2,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Send,
  Smile,
  Trash2,
  Users,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";


// =====================================================
// API CONFIG
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// PROJECT CHAT
// =====================================================

const ProjectChat = () => {
  const navigate = useNavigate();

  const {
    workspaceId,
    projectId,
  } = useParams();

  const { user } = useAuth();


  // ===================================================
  // STATE
  // ===================================================

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [messageText, setMessageText] =
    useState("");

  const [openMenu, setOpenMenu] =
    useState(null);

  const [editingMessage, setEditingMessage] =
    useState(null);

  const [editText, setEditText] =
    useState("");

  const [savingEdit, setSavingEdit] =
    useState(false);


  // ===================================================
  // REFS
  // ===================================================

  const messagesContainerRef =
    useRef(null);

  const textareaRef =
    useRef(null);


  // SOCKET.IO
  // Connect, join project and listen for real-time events
  // =====================================================

  useEffect(() => {
    if (!projectId) {
      return;
    }

    // -------------------------------------------------
    // CONNECT TO SOCKET
    // -------------------------------------------------

    socket.connect();

    // -------------------------------------------------
    // JOIN PROJECT ROOM
    // -------------------------------------------------

    socket.emit("join-project", {
      projectId,
    });

    // =================================================
    // NEW MESSAGE
    // =================================================

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        const messageId =
          message._id ||
          message.id;

        const alreadyExists =
          prev.some(
            (item) =>
              String(
                item._id ||
                item.id
              ) ===
              String(messageId)
          );

        if (alreadyExists) {
          return prev;
        }

        return [
          ...prev,
          message,
        ];
      });

      // Scroll after React updates the messages
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);
    };

    // =================================================
    // MESSAGE UPDATED
    // =================================================

    const handleMessageUpdated = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((message) => {
          const messageId =
            message._id ||
            message.id;

          const updatedMessageId =
            updatedMessage?._id ||
            updatedMessage?.id;

          if (
            String(messageId) ===
            String(updatedMessageId)
          ) {
            // Keep the existing populated sender if the socket
            // payload contains only the sender ObjectId.
            return {
              ...message,
              ...updatedMessage,
              sender:
                updatedMessage?.sender &&
                typeof updatedMessage.sender === "object"
                  ? updatedMessage.sender
                  : message.sender,
              user:
                updatedMessage?.user &&
                typeof updatedMessage.user === "object"
                  ? updatedMessage.user
                  : message.user,
            };
          }

          return message;
        })
      );
    };

    // =================================================
    // MESSAGE DELETED
    // =================================================

    const handleMessageDeleted = (data) => {
      setMessages((prev) =>
        prev.map((message) => {
          const messageId =
            message._id ||
            message.id;

          if (
            String(messageId) ===
            String(data?.messageId)
          ) {
            // Soft-delete in the UI. Do NOT remove the message.
            // Keep sender/createdAt so both sides can see who
            // deleted the message after a real-time update.
            return {
              ...message,
              isDeleted: true,
              content: "",
            };
          }

          return message;
        })
      );
    };

    // =================================================
    // REGISTER SOCKET LISTENERS
    // =================================================

    socket.on(
      "new-message",
      handleNewMessage
    );

    socket.on(
      "message-updated",
      handleMessageUpdated
    );

    socket.on(
      "message-deleted",
      handleMessageDeleted
    );

    // =================================================
    // CLEANUP
    // =================================================

    return () => {
      // Leave project room
      socket.emit("leave-project", {
        projectId,
      });

      // Remove listeners
      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.off(
        "message-updated",
        handleMessageUpdated
      );

      socket.off(
        "message-deleted",
        handleMessageDeleted
      );

      // Disconnect socket
      socket.disconnect();
    };

  }, [projectId]);

  // ===================================================
  // CURRENT USER ID
  // ===================================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.uid ||
    null;


  // ===================================================
  // HELPERS
  // ===================================================

  const normalizeId = (value) => {
    if (!value) return null;

    if (
      typeof value === "object" &&
      value._id
    ) {
      return String(value._id);
    }

    return String(value);
  };


  // ===================================================
  // GET SENDER FROM MESSAGE
  // ===================================================

  const getSender = (message) => {
    if (!message) return null;

    return (
      message.sender ||
      message.user ||
      message.createdBy ||
      null
    );
  };


  // ===================================================
  // GET SENDER ID
  // ===================================================

  const getSenderId = (message) => {
    const sender =
      getSender(message);

    if (sender) {
      return normalizeId(
        sender._id ||
          sender.id ||
          sender.userId ||
          sender.uid
      );
    }

    return normalizeId(
      message?.senderId ||
        message?.userId ||
        message?.createdById
    );
  };


  // ===================================================
  // CHECK OWN MESSAGE
  // ===================================================

  const isOwnMessage = (message) => {
    const senderId =
      getSenderId(message);

    if (
      !senderId ||
      !currentUserId
    ) {
      return false;
    }

    return (
      senderId ===
      normalizeId(currentUserId)
    );
  };


  // ===================================================
  // GET SENDER NAME
  // ===================================================

  const getSenderName = (message) => {
    const sender =
      getSender(message);

    if (
      sender?.name &&
      sender.name.trim()
    ) {
      return sender.name;
    }

    // If this is a newly-created message
    // and backend hasn't populated sender yet,
    // use the logged-in user's name.

    if (
      isOwnMessage(message) &&
      user?.name
    ) {
      return user.name;
    }

    return "Unknown user";
  };


  // ===================================================
  // GET SENDER AVATAR
  // ===================================================

  const getSenderAvatar = (message) => {
    const sender =
      getSender(message);

    if (sender?.avatar) {
      return sender.avatar;
    }

    if (
      isOwnMessage(message) &&
      user?.avatar
    ) {
      return user.avatar;
    }

    return "";
  };


  // ===================================================
  // GET INITIALS
  // ===================================================

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
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };


  // ===================================================
  // FORMAT TIME
  // ===================================================

  const formatTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
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


  // ===================================================
  // SCROLL TO BOTTOM
  // ===================================================

  const scrollToBottom = (
    behavior = "smooth"
  ) => {
    const container =
      messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };


  // ===================================================
  // LOAD MESSAGES
  // ===================================================

  const loadMessages =
    useCallback(async () => {
      if (
        !workspaceId ||
        !projectId
      ) {
        setError(
          "Workspace or project information is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/messages`,
            {
              withCredentials: true,
            }
          );

        const fetchedMessages =
          response?.data?.messages ||
          [];

        // IMPORTANT:
        // The backend GET endpoint must return soft-deleted
        // messages too (with isDeleted: true). We intentionally
        // keep them in state so they remain visible after refresh.
        setMessages(
          Array.isArray(
            fetchedMessages
          )
            ? fetchedMessages
            : []
        );

      } catch (err) {
        console.error(
          "Load project messages error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load project messages"
        );

      } finally {
        setLoading(false);
      }
    }, [
      workspaceId,
      projectId,
    ]);


  // ===================================================
  // LOAD ON PAGE OPEN
  // ===================================================

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);


  // ===================================================
  // SCROLL WHEN MESSAGES CHANGE
  // ===================================================

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 50);
    }
  }, [
    messages.length,
    loading,
  ]);


  // ===================================================
  // SEND MESSAGE
  // ===================================================

  const sendMessage = async () => {
    const content = messageText.trim();

    if (
      !content ||
      sending ||
      !workspaceId ||
      !projectId
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/messages`,
        {
          content,
        },
        {
          withCredentials: true,
        }
      );

      // ==========================================
      // GET MESSAGE FROM BACKEND
      // ==========================================

      const backendMessage = response?.data?.data;

      // ==========================================
      // GET SENDER FROM BACKEND RESPONSE
      // ==========================================

      const backendSender =
        backendMessage
          ? getSender(backendMessage)
          : null;

      // ==========================================
      // BUILD MESSAGE FOR UI
      // ==========================================

      const newMessage = {
        // Backend ID if available
        _id:
          backendMessage?._id ||
          backendMessage?.id ||
          `temp-${Date.now()}`,

        // ========================================
        // VERY IMPORTANT
        // ALWAYS use typed content if backend
        // doesn't return content
        // ========================================

        content:
          backendMessage?.content ||
          content,

        // ========================================
        // SENDER
        // ========================================

        sender: {
          _id:
            backendSender?._id ||
            backendSender?.id ||
            backendSender?.userId ||
            currentUserId,

          name:
            backendSender?.name ||
            user?.name ||
            "You",

          email:
            backendSender?.email ||
            user?.email ||
            "",

          avatar:
            backendSender?.avatar ||
            user?.avatar ||
            "",
        },

        // ========================================
        // PRESERVE TIMESTAMP
        // ========================================

        createdAt:
          backendMessage?.createdAt ||
          new Date().toISOString(),

        updatedAt:
          backendMessage?.updatedAt ||
          backendMessage?.createdAt ||
          new Date().toISOString(),

        // ========================================
        // KEEP ANY OTHER BACKEND FIELDS
        // ========================================

        ...(backendMessage || {}),
        
        // ========================================
        // FORCE THESE VALUES AFTER SPREAD
        // ========================================
        
        content:
          backendMessage?.content ||
          content,

        sender: {
          _id:
            backendSender?._id ||
            backendSender?.id ||
            backendSender?.userId ||
            currentUserId,

          name:
            backendSender?.name ||
            user?.name ||
            "You",

          email:
            backendSender?.email ||
            user?.email ||
            "",

          avatar:
            backendSender?.avatar ||
            user?.avatar ||
            "",
        },
      };

      // ==========================================
      // RECONCILE MESSAGE IN LOCAL STATE
      // ==========================================
      //
      // Socket.IO normally delivers the new message. This
      // fallback makes the UI immediate even if the socket
      // event is delayed. It also prevents duplicates.
      //
      if (backendMessage) {
        setMessages((prev) => {
          const newMessageId =
            newMessage._id ||
            newMessage.id;

          const exists = prev.some(
            (message) =>
              String(
                message._id ||
                message.id
              ) === String(newMessageId)
          );

          if (exists) {
            return prev.map((message) => {
              const messageId =
                message._id ||
                message.id;

              if (
                String(messageId) !==
                String(newMessageId)
              ) {
                return message;
              }

              return {
                ...message,
                ...newMessage,
              };
            });
          }

          return [...prev, newMessage];
        });
      }

      // ==========================================
      // CLEAR INPUT
      // ==========================================

      setMessageText("");

      // ==========================================
      // RESET TEXTAREA HEIGHT
      // ==========================================

      if (textareaRef.current) {
        textareaRef.current.style.height =
          "auto";
      }

      // ==========================================
      // SCROLL TO NEW MESSAGE
      // ==========================================

      setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);

    } catch (err) {
      console.error(
        "Send project message error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to send message"
      );

    } finally {
      setSending(false);
    }
  };


  // ===================================================
  // KEYBOARD HANDLER
  // ===================================================

  const handleKeyDown = (event) => {

    // Enter = send
    // Shift + Enter = newline

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };


  // ===================================================
  // TEXTAREA AUTO RESIZE
  // ===================================================

  const handleTextChange =
    (event) => {

      setMessageText(
        event.target.value
      );

      const textarea =
        event.target;

      textarea.style.height =
        "auto";

      textarea.style.height =
        `${Math.min(
          textarea.scrollHeight,
          140
        )}px`;
    };


  // ===================================================
  // DELETE MESSAGE
  // ===================================================

  const deleteMessage =
    async (messageId) => {

      if (!messageId) return;

      try {

        await axios.delete(
          `${API_BASE_URL}/messages/${messageId}`,
          {
            withCredentials: true,
          }
        );

        setMessages((prev) =>
          prev.map((message) => {
            const currentMessageId =
              message._id ||
              message.id;

            if (
              String(currentMessageId) ===
              String(messageId)
            ) {
              return {
                ...message,
                isDeleted: true,
                content: "",
              };
            }

            return message;
          })
        );

        setOpenMenu(null);

      } catch (err) {

        console.error(
          "Delete message error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to delete message"
        );
      }
    };


  // ===================================================
  // START EDIT
  // ===================================================

  const startEdit =
    (message) => {

      if (!message || message.isDeleted) {
        return;
      }

      setEditingMessage(
        message
      );

      setEditText(
        message?.content || ""
      );

      setOpenMenu(null);
    };


  // ===================================================
  // CANCEL EDIT
  // ===================================================

  const cancelEdit = () => {

    setEditingMessage(null);

    setEditText("");
  };


  // ===================================================
  // SAVE EDIT
  // ===================================================

  const saveEdit = async () => {
    const content = editText.trim();

    if (
      !editingMessage ||
      !content ||
      savingEdit
    ) {
      return;
    }

    const messageId =
      editingMessage._id ||
      editingMessage.id;

    if (!messageId) {
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      const response = await axios.patch(
        `${API_BASE_URL}/messages/${messageId}`,
        {
          content,
        },
        {
          withCredentials: true,
        }
      );

      const updatedMessage =
        response?.data?.message;

      // ==========================================
      // UPDATE MESSAGE IN LOCAL STATE IMMEDIATELY
      // ==========================================

      setMessages((prevMessages) =>
        prevMessages.map((message) => {
          const currentMessageId =
            message._id || message.id;

          if (
            String(currentMessageId) !==
            String(messageId)
          ) {
            return message;
          }

          return {
            ...message,

            // ALWAYS use the newly edited content
            content,

            // Keep backend returned fields if available
            ...(updatedMessage || {}),

            // Make sure content cannot be lost
            content,

            // Preserve sender information if backend
            // doesn't return populated sender
            sender:
              updatedMessage?.sender ||
              message.sender,

            user:
              updatedMessage?.user ||
              message.user,

            createdAt:
              updatedMessage?.createdAt ||
              message.createdAt,

            updatedAt:
              updatedMessage?.updatedAt ||
              new Date().toISOString(),
          };
        })
      );

      // ==========================================
      // CLOSE EDIT MODE
      // ==========================================

      setEditingMessage(null);
      setEditText("");

      setOpenMenu(null);

    } catch (err) {
      console.error(
        "Edit message error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to edit message"
      );

    } finally {
      setSavingEdit(false);
    }
  };


  // ===================================================
  // MESSAGE COMPONENT
  // ===================================================

  const renderMessage =
    (message) => {

      const own =
        isOwnMessage(message);

      const senderName =
        getSenderName(message);

      const avatar =
        getSenderAvatar(message);

      const initials =
        getInitials(
          senderName
        );

      const messageId =
        message._id ||
        message.id;

      const isEditing =
        editingMessage &&
        String(
          editingMessage._id ||
            editingMessage.id
        ) ===
          String(messageId);


      return (
        <div
          key={messageId}
          className={`flex w-full ${
            own
              ? "justify-end"
              : "justify-start"
          }`}
        >

          <div
            className={`group flex max-w-[80%] items-end gap-3 ${
              own
                ? "flex-row-reverse"
                : "flex-row"
            }`}
          >

            {/* =====================================
                MESSAGE CONTENT
            ===================================== */}

            <div
              className={`min-w-0 ${
                own
                  ? "items-end"
                  : "items-start"
              } flex flex-col`}
            >

              {/* =================================
                  NAME + TIME
              ================================= */}

              <div
                className={`mb-1.5 flex items-center gap-2 ${
                  own
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <span
                  className={`text-sm font-semibold ${
                    own
                      ? "text-indigo-300"
                      : "text-slate-300"
                  }`}
                >
                  {senderName}
                </span>

                <span className="text-[10px] text-slate-600">
                  {formatTime(
                    message.createdAt
                  )}
                </span>

                {message.updatedAt &&
                  message.updatedAt !==
                    message.createdAt && (
                    <span className="text-[9px] text-slate-600">
                      edited
                    </span>
                  )}

              </div>


              {/* =================================
                  MESSAGE BUBBLE
              ================================= */}

              {isEditing ? (

                // =====================================================
                // EDIT MESSAGE
                // =====================================================

                <div className="w-full min-w-[260px] max-w-[600px]">

                  <textarea
                    value={editText}
                    onChange={(event) =>
                      setEditText(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        cancelEdit();
                      }

                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        saveEdit();
                      }
                    }}
                    autoFocus
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-indigo-500/40 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-indigo-400/60"
                  />

                  <div className="mt-2 flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={
                        savingEdit ||
                        !editText.trim()
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      {savingEdit ? (
                        <Loader2
                          size={13}
                          className="animate-spin"
                        />
                      ) : (
                        <Check size={13} />
                      )}

                      Save

                    </button>

                  </div>

                </div>

              ) : (

                // =====================================================
                    // NORMAL / DELETED MESSAGE
                // ===================================================== 

                <div
                  className={`relative rounded-2xl border px-4 py-3 ${
                    message.isDeleted
                      ? own
                        ? "rounded-tr-md border-slate-700/70 bg-slate-900/70"
                        : "rounded-tl-md border-slate-800/70 bg-slate-900/50"
                      : own
                        ? "rounded-tr-md border-indigo-500/30 bg-indigo-500/15"
                        : "rounded-tl-md border-slate-800 bg-slate-900"
                  }`}
                >
                  {message.isDeleted ? (
                    <div className="text-sm italic text-slate-500">
                      {own
                        ? "You deleted this message"
                        : "This message was deleted"}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-sm text-slate-200">
                      {message.content}
                    </div>
                  )}
                </div>

              )}

              {/* =================================
                  MESSAGE ACTIONS
              ================================= */}

              {own &&
                !message.isDeleted &&
                !isEditing && (
                  <div
                    className={`relative mt-1 opacity-0 transition group-hover:opacity-100 ${
                      own
                        ? "self-end"
                        : "self-start"
                    }`}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu(
                          openMenu ===
                            messageId
                            ? null
                            : messageId
                        )
                      }
                      className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                    >
                      <MoreVertical
                        size={14}
                      />
                    </button>


                    {openMenu ===
                      messageId && (

                      <div
                        className={`absolute bottom-full z-30 mb-1 w-32 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl ${
                          own
                            ? "right-0"
                            : "left-0"
                        }`}
                      >

                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              message
                            )
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-900"
                        >
                          <Edit3
                            size={13}
                          />

                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteMessage(
                              messageId
                            )
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                        >
                          <Trash2
                            size={13}
                          />

                          Delete
                        </button>

                      </div>

                    )}

                  </div>
                )}

            </div>

          </div>

        </div>
      );
    };


  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-slate-950">

        <div className="flex flex-1 items-center justify-center">

          <div className="flex flex-col items-center gap-3">

            <Loader2
              size={28}
              className="animate-spin text-indigo-400"
            />

            <p className="text-sm text-slate-500">
              Loading project chat...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="flex h-[calc(100dvh-100px)] min-h-0 flex-col overflow-hidden bg-slate-950">


      {/* =================================================
          CHAT HEADER
      ================================================= */}

      <header className="flex h-[82px] shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950 px-6">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200"
          >
            <ArrowLeft
              size={18}
            />
          </button>


          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <MessageCircle
                size={22}
                className="text-indigo-400"
              />
            </div>


            <div>

              <h1 className="text-base font-semibold text-white">
                Project Chat
              </h1>

              <p className="text-xs text-slate-500">
                Project conversation
              </p>

            </div>

          </div>

        </div>


        {/* MEMBERS BUTTON */}

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 transition hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200"
        >
          <Users
            size={16}
          />

          Members
        </button>

      </header>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="shrink-0 border-b border-red-500/20 bg-red-500/5 px-6 py-3">

          <div className="mx-auto flex max-w-5xl items-center justify-between">

            <p className="text-xs text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Dismiss
            </button>

          </div>

        </div>
      )}


      {/* =================================================
          MESSAGE AREA
          ONLY THIS AREA SCROLLS
      ================================================= */}

      <main
        ref={
          messagesContainerRef
        }
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar overscroll-contain px-4 py-6 sm:px-6"

      >

        <div className="mx-auto w-full max-w-5xl">

          {/* Conversation divider */}

          <div className="mb-8 flex items-center gap-4">

            <div className="h-px flex-1 bg-slate-800" />

            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
              Conversation
            </span>

            <div className="h-px flex-1 bg-slate-800" />

          </div>


          {/* =========================================
              EMPTY CHAT
          ========================================= */}

          {messages.length === 0 ? (

            <div className="flex min-h-[400px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">

                  <MessageCircle
                    size={25}
                    className="text-indigo-400"
                  />

                </div>

                <h2 className="text-sm font-semibold text-slate-300">
                  Start the conversation
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Send a message to your project team.
                </p>

              </div>

            </div>

          ) : (

            /* =========================================
               MESSAGES
            ========================================= */

            <div className="space-y-5">

              {messages.map(
                renderMessage
              )}

            </div>

          )}

        </div>

      </main>


      {/* =================================================
          FIXED MESSAGE COMPOSER
      ================================================= */}

      <footer className="shrink-0 border-t border-slate-800/80 bg-slate-950 px-4 pb-4 pt-3 sm:px-6">

        <div className="mx-auto w-full max-w-5xl">

          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 transition focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/10">

            {/* TEXTAREA */}

            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={
                handleTextChange
              }
              onKeyDown={
                handleKeyDown
              }
              rows={1}
              placeholder="Message your project team..."
              disabled={sending}
              className="block max-h-[140px] min-h-[76px] w-full resize-none bg-transparent px-4 pb-12 pt-4 pr-16 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            />


            {/* =========================================
                ATTACHMENT / EMOJI
            ========================================= */}

            <div className="absolute bottom-3 left-3 flex items-center gap-1">

              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                title="Attach file"
              >
                <Paperclip
                  size={17}
                />
              </button>

              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                title="Add emoji"
              >
                <Smile
                  size={17}
                />
              </button>

            </div>


            {/* =========================================
                SEND BUTTON
            ========================================= */}

            <button
              type="button"
              onClick={
                sendMessage
              }
              disabled={
                sending ||
                !messageText.trim()
              }
              className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >

              {sending ? (

                <Loader2
                  size={14}
                  className="animate-spin"
                />

              ) : (

                <Send
                  size={14}
                />

              )}

              <span className="hidden sm:inline">
                Send
              </span>

            </button>

          </div>


          {/* Keyboard hint */}

          <p className="mt-2 text-center text-[10px] text-slate-700">
            Press Enter to send · Shift + Enter for a new line
          </p>

        </div>

      </footer>

    </div>
  );
};


export default ProjectChat;