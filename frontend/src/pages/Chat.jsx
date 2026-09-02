import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MessageCircle,
  Search,
  Send,
  MoreVertical,
  User,
  Plus,
  X,
  Trash2,
  Check,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const Chat = () => {

  const { user } = useAuth();

  const [searchParams] =
    useSearchParams();

  const targetUserId =
    searchParams.get("userId");


  // ==========================================
  // STATE
  // ==========================================

  const [conversations, setConversations] =
    useState([]);

  const [activeConversation, setActiveConversation] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [messageInput, setMessageInput] =
    useState("");

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const messagesEndRef =
    useRef(null);

    const [newChatOpen, setNewChatOpen] =
    useState(false);

    const [newChatEmail, setNewChatEmail] =
    useState("");

    const [newChatLoading, setNewChatLoading] =
    useState(false);

    const [newChatError, setNewChatError] =
    useState("");

    const [openMessageMenu, setOpenMessageMenu] =
    useState(null);

    const [chatMenuOpen, setChatMenuOpen] =
    useState(false);

    const [clearChatOpen, setClearChatOpen] =
    useState(false);

    const [clearingChat, setClearingChat] =
    useState(false);


  // ==========================================
  // CURRENT ORGANIZATION
  // ==========================================

  const organizationId =
    localStorage.getItem(
      "currentOrganizationId"
    );


  // ==========================================
  // CURRENT USER ID
  // ==========================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.uid;


  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  };


  useEffect(() => {

    scrollToBottom();

  }, [messages]);


  // ==========================================
  // LOAD CONVERSATIONS
  // ==========================================

  const loadConversations = async () => {

    if (!organizationId) {
      setLoadingConversations(false);
      return;
    }

    try {

      setLoadingConversations(true);

      const response =
        await fetch(
          `${API_BASE_URL}/conversations?organizationId=${organizationId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to load conversations"
        );
      }

      setConversations(
        data.conversations || []
      );

    } catch (error) {

      console.error(
        "Load conversations error:",
        error
      );

    } finally {

      setLoadingConversations(false);

    }

  };


  // ==========================================
  // CREATE / OPEN CONVERSATION
  // ==========================================

  const openConversationWithUser = async (
    userId
  ) => {

    if (!organizationId || !userId) {
      return;
    }

    if (
      currentUserId &&
      String(userId) === String(currentUserId)
    ) {
      return;
    }

    try {

      const response =
        await fetch(
          `${API_BASE_URL}/conversations`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              organizationId,
              userId,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to open conversation"
        );
      }

      const conversation =
        data.conversation;

      setActiveConversation(
        conversation
      );

      await loadMessages(
        conversation._id
      );

      await loadConversations();

    } catch (error) {

      console.error(
        "Open conversation error:",
        error
      );

    }

  };


  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  const loadMessages = async (
    conversationId
  ) => {

    if (!conversationId) {
      return;
    }

    try {

      setLoadingMessages(true);

      const response =
        await fetch(
          `${API_BASE_URL}/conversations/${conversationId}/messages`,
          {
            method: "GET",
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to load messages"
        );
      }

      setMessages(
        data.messages || []
      );

    } catch (error) {

      console.error(
        "Load messages error:",
        error
      );

      setMessages([]);

    } finally {

      setLoadingMessages(false);

    }

  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    if (!user || !organizationId) {
        return;
    }

    let cancelled = false;

    const initializeChat = async () => {

        try {

        // ==========================================
        // OPEN CHAT FROM DASHBOARD
        // /chat?userId=...
        // ==========================================

        if (targetUserId) {

            await openConversationWithUser(
            targetUserId
            );

            return;
        }


        // ==========================================
        // NORMAL /chat PAGE
        // ==========================================

        const response =
            await fetch(
            `${API_BASE_URL}/conversations?organizationId=${organizationId}`,
            {
                method: "GET",
                credentials: "include",
            }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
            data.message ||
            "Failed to load conversations"
            );
        }

        if (cancelled) {
            return;
        }

        const loadedConversations =
            data.conversations || [];

        setConversations(
            loadedConversations
        );


        // ==========================================
        // AUTOMATICALLY OPEN LATEST CONVERSATION
        // ==========================================

        if (
            loadedConversations.length > 0
        ) {

            const firstConversation =
            loadedConversations[0];

            setActiveConversation(
            firstConversation
            );

            await loadMessages(
            firstConversation._id
            );

        }

        } catch (error) {

        if (!cancelled) {

            console.error(
            "Chat initialization error:",
            error
            );

        }

        } finally {

        if (!cancelled) {
            setLoadingConversations(false);
        }

        }

    };

    initializeChat();

    return () => {
        cancelled = true;
    };

    }, [
    user,
    organizationId,
    targetUserId,
    ]);


  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {

    if (!user) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    return () => {

      if (socket.connected) {
        socket.disconnect();
      }

    };

  }, [user]);


  // ==========================================
  // JOIN ACTIVE CONVERSATION
  // ==========================================

  useEffect(() => {

    if (!activeConversation?._id) {
        return;
    }

    const conversationId =
        activeConversation._id;

    const joinRoom = () => {

        socket.emit(
        "join-conversation",
        {
            conversationId,
        }
        );

    };

    if (socket.connected) {

        joinRoom();

    } else {

        socket.once(
        "connect",
        joinRoom
        );

    }

    return () => {

        socket.emit(
        "leave-conversation",
        {
            conversationId,
        }
        );

        socket.off(
        "connect",
        joinRoom
        );

    };

    }, [
    activeConversation?._id,
    ]);


  // ==========================================
  // RECEIVE PRIVATE MESSAGE
  // ==========================================

  useEffect(() => {

    const handlePrivateMessage = (
      message
    ) => {

      if (!message?.conversation) {
        return;
      }

      const messageConversationId =
        typeof message.conversation ===
        "object"
          ? message.conversation._id
          : message.conversation;

      if (
        String(messageConversationId) ===
        String(activeConversation?._id)
      ) {

        setMessages((previous) => {

          const alreadyExists =
            previous.some(
              (item) =>
                String(item._id) ===
                String(message._id)
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            ...previous,
            message,
          ];

        });

      }

      loadConversations();

    };

    socket.on(
      "private-message",
      handlePrivateMessage
    );

    const handlePrivateMessageDeleted = ({
        messageId,
        }) => {

        if (!messageId) {
            return;
        }

        setMessages((previous) =>
            previous.map((message) => {

            if (
                String(message._id) ===
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

        loadConversations();

        };

        socket.on(
            "private-message-deleted",
            handlePrivateMessageDeleted
            );
        
        const handleConversationCleared = ({
            conversationId,
            }) => {

            if (
                String(conversationId) ===
                String(activeConversation?._id)
            ) {

                setMessages([]);

            }

            loadConversations();

            };

        socket.on(
            "conversation-cleared",
            handleConversationCleared
            );

    return () => {

      socket.off(
        "private-message",
        handlePrivateMessage
      );
      socket.off(
        "private-message-deleted",
        handlePrivateMessageDeleted
        );
      socket.off(
        "conversation-cleared",
        handleConversationCleared
        );

    };

  }, [
    activeConversation?._id,
  ]);


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = async () => {

    const content =
      messageInput.trim();

    if (
      !content ||
      !activeConversation?._id ||
      sending
    ) {
      return;
    }

    try {

      setSending(true);

      const response =
        await fetch(
          `${API_BASE_URL}/conversations/${activeConversation._id}/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              content,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to send message"
        );
      }

      setMessageInput("");

      /*
       * The backend emits private-message
       * through Socket.IO.
       *
       * Therefore we don't manually append
       * the message here.
       */

    } catch (error) {

      console.error(
        "Send message error:",
        error
      );

    } finally {

      setSending(false);

    }

  };

  // ==========================================
// DELETE OWN PRIVATE MESSAGE
// ==========================================

const deletePrivateMessage = async (
    messageId
    ) => {

    if (!messageId) {
        return;
    }

    try {

        const response =
        await fetch(
            `${API_BASE_URL}/messages/${messageId}`,
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
            "Unable to delete message"
        );
        }

        // ----------------------------------------
        // Update sender UI immediately
        // ----------------------------------------

        setMessages((previous) =>
        previous.map((message) => {

            if (
            String(message._id) ===
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

        setOpenMessageMenu(null);

        // Update conversation preview
        await loadConversations();

    } catch (error) {

        console.error(
        "Delete private message error:",
        error
        );

    }

    };


  // ==========================================
  // ENTER TO SEND
  // ==========================================

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  };


  // ==========================================
  // GET OTHER PARTICIPANT
  // ==========================================

  const getOtherParticipant = (
    conversation
  ) => {

    if (
      !conversation?.participants ||
      !currentUserId
    ) {
      return null;
    }

    return conversation.participants.find(
      (participant) =>
        String(
          participant._id ||
          participant.id
        ) !==
        String(currentUserId)
    );

  };


  // ==========================================
  // FILTER CONVERSATIONS
  // ==========================================

  const filteredConversations =
    useMemo(() => {

      const value =
        search.trim().toLowerCase();

      if (!value) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {

          const participant =
            getOtherParticipant(
              conversation
            );

          const name =
            participant?.name || "";

          const email =
            participant?.email || "";

          return (
            name
              .toLowerCase()
              .includes(value) ||
            email
              .toLowerCase()
              .includes(value)
          );

        }
      );

    }, [
      conversations,
      search,
      currentUserId,
    ]);


  // ==========================================
  // OPEN EXISTING CONVERSATION
  // ==========================================

  const handleSelectConversation = async (
    conversation
  ) => {

    setActiveConversation(
      conversation
    );

    await loadMessages(
      conversation._id
    );

  };


  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {

    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  };


  // ==========================================
  // ACTIVE PARTICIPANT
  // ==========================================

  const activeParticipant =
    getOtherParticipant(
      activeConversation
    );

    // ==========================================
    // START NEW CHAT BY EMAIL
    // ==========================================

    const handleStartNewChat = async () => {

    const email =
        newChatEmail.trim().toLowerCase();

    if (!email) {
        setNewChatError(
        "Please enter an email address."
        );
        return;
    }

    if (!organizationId) {
        setNewChatError(
        "No organization selected."
        );
        return;
    }

    try {

        setNewChatLoading(true);
        setNewChatError("");

        // ----------------------------------------
        // FIND MEMBER IN CURRENT ORGANIZATION
        // ----------------------------------------

        const response =
        await fetch(
            `${API_BASE_URL}/organizations/${organizationId}/members`,
            {
            method: "GET",
            credentials: "include",
            }
        );

        const data =
        await response.json();

        if (!response.ok) {
        throw new Error(
            data.message ||
            "Unable to load organization members."
        );
        }

        const members =
        data.members || [];

        // ----------------------------------------
        // FIND USER BY EMAIL
        // ----------------------------------------

        const matchedMember =
        members.find((member) => {

            const memberEmail =
            (
                member.user?.email ||
                member.email ||
                ""
            )
                .trim()
                .toLowerCase();

            return memberEmail === email;

        });

        if (!matchedMember) {

        setNewChatError(
            "No organization member found with this email."
        );

        return;
        }

        // ----------------------------------------
        // GET USER ID
        // ----------------------------------------

        const memberUserId =
        matchedMember.user?._id ||
        matchedMember.user?.id ||
        matchedMember.userId ||
        matchedMember._id;

        if (!memberUserId) {

        setNewChatError(
            "Unable to identify this member."
        );

        return;
        }

        // ----------------------------------------
        // PREVENT SELF CHAT
        // ----------------------------------------

        if (
        currentUserId &&
        String(memberUserId) ===
            String(currentUserId)
        ) {

        setNewChatError(
            "You cannot start a conversation with yourself."
        );

        return;
        }

        // ----------------------------------------
        // CREATE / FIND CONVERSATION
        // ----------------------------------------

        const conversationResponse =
        await fetch(
            `${API_BASE_URL}/conversations`,
            {
            method: "POST",

            headers: {
                "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
                organizationId,
                userId: memberUserId,
            }),
            }
        );

        const conversationData =
        await conversationResponse.json();

        if (!conversationResponse.ok) {
        throw new Error(
            conversationData.message ||
            "Unable to start conversation."
        );
        }

        const conversation =
        conversationData.conversation;

        // ----------------------------------------
        // OPEN CONVERSATION
        // ----------------------------------------

        setActiveConversation(
        conversation
        );

        await loadMessages(
        conversation._id
        );

        await loadConversations();

        // ----------------------------------------
        // CLOSE MODAL
        // ----------------------------------------

        setNewChatOpen(false);
        setNewChatEmail("");
        setNewChatError("");

    } catch (error) {

        console.error(
        "Start new chat error:",
        error
        );

        setNewChatError(
        error.message ||
        "Unable to start conversation."
        );

    } finally {

        setNewChatLoading(false);

    }

    };


    // CLEAR CHAT FUNC
    const handleClearChat = async () => {

        if (
            !activeConversation?._id ||
            clearingChat
        ) {
            return;
        }

        try {

            setClearingChat(true);

            const response =
            await fetch(
                `${API_BASE_URL}/conversations/${activeConversation._id}/messages`,
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
                "Unable to clear chat"
            );
            }

            setMessages([]);

            setClearChatOpen(false);

            await loadConversations();

        } catch (error) {

            console.error(
            "Clear chat error:",
            error
            );

        } finally {

            setClearingChat(false);

        }

        };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="flex h-[calc(100vh-92px)] min-h-0 w-full overflow-hidden border border-slate-800 bg-slate-950">

      {/* ======================================
          LEFT — CONVERSATIONS
      ======================================= */}

      <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-slate-800">

        {/* Header */}

        <div className="border-b border-slate-800 p-5">

            <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                    <MessageCircle size={20} />

                </div>

                <div>

                    <h1 className="text-sm font-semibold text-slate-100">
                    Chat
                    </h1>

                    <p className="text-[11px] text-slate-500">
                    Private conversations
                    </p>

                </div>

                </div>


                {/* NEW CHAT BUTTON */}

                <button
                type="button"
                onClick={() => {
                    setNewChatOpen(true);
                    setNewChatError("");
                    setNewChatEmail("");
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 text-[10px] font-medium text-indigo-400 transition hover:border-indigo-500/30 hover:bg-indigo-500/15 hover:text-indigo-300"
                >

                <Plus size={13} />

                New Chat

                </button>

            </div>


          {/* Search */}

          <div className="relative mt-4">

            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search conversations..."
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
            />

          </div>

        </div>


        {/* Conversation list */}

        <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto p-2">

          {loadingConversations ? (

            <div className="space-y-2 p-2">

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                    className="h-[68px] animate-pulse rounded-xl bg-slate-900"
                  />

                )
              )}

            </div>

          ) : filteredConversations.length === 0 ? (

            <div className="flex h-full flex-col items-center justify-center px-6 text-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-600">

                <MessageCircle
                  size={22}
                />

              </div>

              <p className="mt-3 text-xs font-medium text-slate-400">
                No conversations
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-600">
                Start a conversation from
                an organization member's
                Chat button.
              </p>

            </div>

          ) : (

            filteredConversations.map(
              (conversation) => {

                const participant =
                  getOtherParticipant(
                    conversation
                  );

                const participantName =
                  participant?.name ||
                  participant?.email ||
                  "Unknown user";

                const initials =
                  participantName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(
                      (part) =>
                        part
                          .charAt(0)
                          .toUpperCase()
                    )
                    .join("");


                const isActive =
                  String(
                    activeConversation?._id
                  ) ===
                  String(
                    conversation._id
                  );


                return (
                  <button
                    key={
                      conversation._id
                    }
                    type="button"
                    onClick={() =>
                      handleSelectConversation(
                        conversation
                      )
                    }
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      isActive
                        ? "bg-indigo-500/10"
                        : "hover:bg-slate-900"
                    }`}
                  >

                    {/* Avatar */}

                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-xs font-semibold text-indigo-400">

                      {initials || (
                        <User
                          size={16}
                        />
                      )}

                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />

                    </div>


                    {/* Details */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-2">

                        <p className="truncate text-xs font-medium text-slate-200">
                          {participantName}
                        </p>

                        {conversation.lastMessageAt && (
                          <span className="shrink-0 text-[9px] text-slate-600">
                            {formatTime(
                              conversation.lastMessageAt
                            )}
                          </span>
                        )}

                      </div>

                      <p className="mt-1 truncate text-[10px] text-slate-600">

                        {conversation.lastMessage?.content ||
                          "Start a conversation"}

                      </p>

                    </div>

                  </button>
                );

              }
            )

          )}

        </div>

      </aside>


      {/* ======================================
          RIGHT — CHAT WINDOW
      ======================================= */}

      <main className="flex h-full min-w-0 flex-1 flex-col">

        {!activeConversation ? (

          /* Empty state */

          <div className="flex flex-1 flex-col items-center justify-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">

              <MessageCircle
                size={28}
              />

            </div>

            <h2 className="mt-5 text-sm font-semibold text-slate-300">
              Your conversations
            </h2>

            <p className="mt-2 max-w-xs text-center text-xs leading-5 text-slate-600">
              Select a conversation from
              the left or start chatting with
              an organization member.
            </p>

          </div>

        ) : (

          <>

            {/* Chat Header */}

            <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-800 px-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                  {activeParticipant?.name
                    ?.charAt(0)
                    ?.toUpperCase() || (
                    <User size={17} />
                  )}

                </div>

                <div>

                  <h2 className="text-xs font-semibold text-slate-200">

                    {activeParticipant?.name ||
                      activeParticipant?.email ||
                      "Unknown user"}

                  </h2>

                  <p className="mt-0.5 text-[10px] text-emerald-400">
                    Active member
                  </p>

                </div>

              </div>


              {/* CLEAR CHAT BTN */}
              <div className="relative">

                <button
                    type="button"
                    onClick={() =>
                    setChatMenuOpen(
                        (previous) => !previous
                    )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
                >

                    <MoreVertical size={16} />

                </button>


                {chatMenuOpen && (

                    <div className="absolute right-0 top-10 z-40 w-36 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl">

                    <button
                        type="button"
                        onClick={() => {

                        setChatMenuOpen(false);
                        setClearChatOpen(true);

                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                    >

                        <Trash2 size={13} />

                        Clear chat

                    </button>

                    </div>

                )}

                </div>

            </header>


            {/* Messages */}

            <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6">

              {loadingMessages ? (

                <div className="flex h-full items-center justify-center">

                  <div className="text-xs text-slate-600">
                    Loading messages...
                  </div>

                </div>

              ) : messages.length === 0 ? (

                <div className="flex h-full flex-col items-center justify-center text-center">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-600">

                    <MessageCircle
                      size={21}
                    />

                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-400">
                    No messages yet
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    Send the first message.
                  </p>

                </div>

              ) : (

                <div className="mx-auto flex max-w-3xl flex-col gap-3">

                  {messages.map(
                    (message) => {

                      const senderId =
                        typeof message.sender ===
                        "object"
                          ? message.sender._id
                          : message.sender;

                      const isMine =
                        String(senderId) ===
                        String(currentUserId);


                      return (
                        <div
                          key={
                            message._id
                          }
                          className={`flex ${
                            isMine
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >

                          <div
                            className={`max-w-[70%] ${
                              isMine
                                ? "items-end"
                                : "items-start"
                            } flex flex-col`}
                          >

                            <div className="group relative flex items-center gap-1">

                            {/* ======================================
                                MESSAGE BUBBLE
                            ======================================= */}

                            <div
                                className={`rounded-2xl px-4 py-2.5 text-xs leading-5 ${
                                message.isDeleted
                                    ? "border border-slate-800 bg-slate-900/60 italic text-slate-500"
                                    : isMine
                                    ? "rounded-br-md bg-indigo-600 text-white"
                                    : "rounded-bl-md bg-slate-900 text-slate-300"
                                }`}
                            >

                                {message.isDeleted ? (
                                <span>
                                    {isMine
                                    ? "You deleted this message"
                                    : "This message was deleted"}
                                </span>
                                ) : (
                                <>
                                    {message.content}

                                    {message.isEdited && (
                                    <span className="ml-1 text-[8px] opacity-50">
                                        edited
                                    </span>
                                    )}
                                </>
                                )}

                            </div>


                            {/* ======================================
                                MESSAGE MENU
                                ONLY FOR OWN MESSAGES
                            ======================================= */}

                            {isMine &&
                                !message.isDeleted && (

                                <div className="relative opacity-0 transition group-hover:opacity-100">

                                    <button
                                    type="button"
                                    onClick={(event) => {

                                        event.stopPropagation();

                                        setOpenMessageMenu(
                                        openMessageMenu ===
                                            message._id
                                            ? null
                                            : message._id
                                        );

                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-900 hover:text-slate-300"
                                    >

                                    <MoreVertical size={14} />

                                    </button>


                                    {openMessageMenu ===
                                    message._id && (

                                    <div
                                        className={`absolute bottom-full z-40 mb-1 w-32 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl ${
                                        isMine
                                            ? "right-0"
                                            : "left-0"
                                        }`}
                                    >

                                        <button
                                        type="button"
                                        onClick={() =>
                                            deletePrivateMessage(
                                            message._id
                                            )
                                        }
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                                        >

                                        <Trash2 size={13} />

                                        Delete

                                        </button>

                                    </div>

                                    )}

                                </div>

                                )}

                            </div>

                            <span className="mt-1 px-1 text-[9px] text-slate-700">
                              {formatTime(
                                message.createdAt
                              )}
                            </span>

                          </div>

                        </div>
                      );

                    }
                  )}

                  <div
                    ref={
                      messagesEndRef
                    }
                  />

                </div>

              )}

            </div>


            {/* Composer */}

            <div className="border-t border-slate-800 p-4">

              <div className="mx-auto flex max-w-3xl items-end gap-2">

                <textarea
                  value={messageInput}
                  onChange={(event) =>
                    setMessageInput(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  rows={1}
                  placeholder="Type a message..."
                  className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
                />

                <button
                  type="button"
                  onClick={
                    sendMessage
                  }
                  disabled={
                    !messageInput.trim() ||
                    sending
                  }
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <Send
                    size={15}
                  />

                </button>

              </div>

              <p className="mx-auto mt-2 max-w-3xl text-[9px] text-slate-700">
                Press Enter to send • Shift + Enter for a new line
              </p>

            </div>

          </>

        )}

      </main>


      {/* ======================================
        NEW CHAT MODAL
    ======================================= */}

    {newChatOpen && (

    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        onMouseDown={(event) => {

        if (
            event.target === event.currentTarget
        ) {
            setNewChatOpen(false);
            setNewChatError("");
        }

        }}
    >

        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

        {/* Modal Header */}

        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

            <div>

            <h2 className="text-sm font-semibold text-slate-100">
                New conversation
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
                Start a private conversation with an organization member.
            </p>

            </div>

            <button
            type="button"
            onClick={() => {
                setNewChatOpen(false);
                setNewChatError("");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
            >
            <X size={16} />
            </button>

        </div>


        {/* Modal Body */}

        <div className="p-5">

            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Member email
            </label>

            <input
            type="email"
            autoFocus
            value={newChatEmail}
            onChange={(event) => {

                setNewChatEmail(
                event.target.value
                );

                if (newChatError) {
                setNewChatError("");
                }

            }}
            onKeyDown={(event) => {

                if (
                event.key === "Enter"
                ) {
                handleStartNewChat();
                }

            }}
            placeholder="member@example.com"
            className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10"
            />


            {/* Error */}

            {newChatError && (

            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">

                <p className="text-[10px] leading-4 text-red-400">
                {newChatError}
                </p>

            </div>

            )}


            {/* Actions */}

            <div className="mt-5 flex justify-end gap-2">

            <button
                type="button"
                onClick={() => {
                setNewChatOpen(false);
                setNewChatError("");
                }}
                className="rounded-lg border border-slate-800 px-3.5 py-2 text-[10px] font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-300"
            >
                Cancel
            </button>


            <button
                type="button"
                onClick={
                handleStartNewChat
                }
                disabled={
                !newChatEmail.trim() ||
                newChatLoading
                }
                className="flex min-w-[100px] items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-[10px] font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >

                {newChatLoading
                ? "Starting..."
                : "Start Chat"}

            </button>

            </div>

        </div>

        </div>

    </div>

    )}

    {/* CLEAR CHAT MODAL */}
    {clearChatOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">

            <div className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

            <div className="p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">

                <Trash2 size={18} />

                </div>

                <h2 className="mt-4 text-sm font-semibold text-slate-100">
                Clear conversation?
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                This will permanently clear the message history for both members. This action cannot be undone.
                </p>

                <div className="mt-5 flex justify-end gap-2">

                <button
                    type="button"
                    onClick={() =>
                    setClearChatOpen(false)
                    }
                    className="rounded-lg border border-slate-800 px-3.5 py-2 text-[10px] font-medium text-slate-400 transition hover:bg-slate-900"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={
                    handleClearChat
                    }
                    disabled={clearingChat}
                    className="rounded-lg bg-red-500/10 px-3.5 py-2 text-[10px] font-medium text-red-400 transition hover:bg-red-500/15 disabled:opacity-40"
                >
                    {clearingChat
                    ? "Clearing..."
                    : "Clear chat"}
                </button>

                </div>

            </div>

            </div>

        </div>

        )}

    </div>
  );
};


export default Chat;