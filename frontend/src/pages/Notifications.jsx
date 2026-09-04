import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  FileEdit,
  FileUp,
  FolderKanban,
  MessageSquare,
  MoreHorizontal,
  Search,
  UserPlus,
  Users,
  X,
  AtSign,
  CalendarClock,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { socket } from "../services/socket";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const Notifications = () => {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [error, setError] =
    useState("");

  const [unreadCount, setUnreadCount] =
    useState(0);


  // =====================================================
  // CURRENT USER
  // =====================================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.uid;


  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials = (
    name = ""
  ) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("") || "?";
  };


  // =====================================================
  // TIME FORMAT
  // =====================================================

  const formatTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const value =
      new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    const now =
      new Date();

    const diff =
      now.getTime() -
      value.getTime();

    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;

    if (diff < minute) {
      return "Just now";
    }

    if (diff < hour) {
      return `${Math.floor(
        diff / minute
      )}m ago`;
    }

    if (diff < day) {
      return `${Math.floor(
        diff / hour
      )}h ago`;
    }

    if (
      diff <
      7 * day
    ) {
      return `${Math.floor(
        diff / day
      )}d ago`;
    }

    return value.toLocaleDateString(
      [],
      {
        day: "numeric",
        month: "short",
        year:
          value.getFullYear() !==
          now.getFullYear()
            ? "numeric"
            : undefined,
      }
    );
  };


  // =====================================================
  // NOTIFICATION ICON
  // =====================================================

  const getNotificationIcon =
    (type) => {
      switch (type) {
        case "workspace_invitation":
          return (
            <Users
              size={18}
            />
          );

        case "project_invitation":
          return (
            <FolderKanban
              size={18}
            />
          );

        case "task_assigned":
          return (
            <ClipboardCheck
              size={18}
            />
          );

        case "task_updated":
          return (
            <RefreshCw
              size={18}
            />
          );

        case "mention":
          return (
            <AtSign
              size={18}
            />
          );

        case "document_edited":
          return (
            <FileEdit
              size={18}
            />
          );

        case "file_uploaded":
          return (
            <FileUp
              size={18}
            />
          );

        case "chat_message":
          return (
            <MessageSquare
              size={18}
            />
          );

        case "due_date_reminder":
          return (
            <CalendarClock
              size={18}
            />
          );

        default:
          return (
            <Bell
              size={18}
            />
          );
      }
    };


  // =====================================================
  // ICON BACKGROUND
  // =====================================================

  const getIconStyle =
    (type) => {
      switch (type) {
        case "workspace_invitation":
          return "bg-indigo-500/10 text-indigo-400";

        case "project_invitation":
          return "bg-violet-500/10 text-violet-400";

        case "task_assigned":
          return "bg-blue-500/10 text-blue-400";

        case "task_updated":
          return "bg-cyan-500/10 text-cyan-400";

        case "mention":
          return "bg-amber-500/10 text-amber-400";

        case "document_edited":
          return "bg-emerald-500/10 text-emerald-400";

        case "file_uploaded":
          return "bg-purple-500/10 text-purple-400";

        case "chat_message":
          return "bg-pink-500/10 text-pink-400";

        case "due_date_reminder":
          return "bg-orange-500/10 text-orange-400";

        default:
          return "bg-slate-500/10 text-slate-400";
      }
    };


  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications =
    useCallback(
      async (
        showRefreshing = false
      ) => {
        try {
          if (
            showRefreshing
          ) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await fetch(
              `${API_BASE_URL}/notifications`,
              {
                method: "GET",

                credentials:
                  "include",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load notifications"
            );
          }

          setNotifications(
            Array.isArray(
              data.notifications
            )
              ? data.notifications
              : []
          );

          setUnreadCount(
            Number(
              data.unreadCount || 0
            )
          );
        } catch (err) {
          console.error(
            "Notification fetch error:",
            err
          );

          setError(
            err.message ||
              "Unable to load notifications"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchNotifications();
  }, [
    fetchNotifications,
  ]);


  // =====================================================
  // SOCKET.IO
  // =====================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    socket.connect();

    socket.emit(
      "join-user",
      currentUserId
    );

    const handleNewNotification =
      (notification) => {
        setNotifications(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    notification._id
                  )
              );

            if (exists) {
              return previous;
            }

            return [
              notification,
              ...previous,
            ];
          }
        );

        setUnreadCount(
          (previous) =>
            previous + 1
        );
      };

    socket.on(
      "notification:new",
      handleNewNotification
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification
      );
    };
  }, [
    currentUserId,
  ]);


  // =====================================================
  // MARK AS READ
  // =====================================================

  const markAsRead =
    async (
      notificationId
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/notifications/${notificationId}/read`,
            {
              method: "PATCH",

              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to mark notification as read"
          );
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                String(
                  notification._id
                ) ===
                String(
                  notificationId
                )
                  ? {
                      ...notification,

                      isRead: true,

                      readAt:
                        new Date().toISOString(),
                    }
                  : notification
            )
        );

        setUnreadCount(
          (previous) =>
            Math.max(
              0,
              previous - 1
            )
        );
      } catch (err) {
        console.error(
          "Mark notification read error:",
          err
        );
      }
    };


  // =====================================================
  // MARK ALL READ
  // =====================================================

  const markAllAsRead =
    async () => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/notifications/read-all`,
            {
              method: "PATCH",

              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to mark notifications as read"
          );
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,

                isRead: true,

                readAt:
                  new Date().toISOString(),
              })
            )
        );

        setUnreadCount(0);
      } catch (err) {
        console.error(
          "Mark all notifications error:",
          err
        );
      }
    };


  // =====================================================
  // DELETE
  // =====================================================

  const deleteNotification =
    async (
      notificationId
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/notifications/${notificationId}`,
            {
              method: "DELETE",

              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to delete notification"
          );
        }

        setNotifications(
          (previous) => {
            const deleted =
              previous.find(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    notificationId
                  )
              );

            if (
              deleted &&
              !deleted.isRead
            ) {
              setUnreadCount(
                (count) =>
                  Math.max(
                    0,
                    count - 1
                  )
              );
            }

            return previous.filter(
              (item) =>
                String(
                  item._id
                ) !==
                String(
                  notificationId
                )
            );
          }
        );
      } catch (err) {
        console.error(
          "Delete notification error:",
          err
        );
      }
    };


  // =====================================================
  // OPEN NOTIFICATION
  // =====================================================

  const openNotification =
    async (
      notification
    ) => {
      if (
        !notification.isRead
      ) {
        await markAsRead(
          notification._id
        );
      }

      if (
        notification.actionUrl
      ) {
        navigate(
          notification.actionUrl
        );
        return;
      }

      if (
        notification.entityType ===
          "workspace" &&
        notification.entityId
      ) {
        navigate(
          `/workspaces/${notification.entityId}`
        );

        return;
      }

      if (
        notification.entityType ===
          "project" &&
        notification.entityId
      ) {
        navigate(
          `/projects/${notification.entityId}`
        );
      }
    };


  // =====================================================
  // FILTER
  // =====================================================

  const filteredNotifications =
    useMemo(() => {
      let result =
        notifications;

      if (
        activeFilter ===
        "unread"
      ) {
        result =
          result.filter(
            (item) =>
              !item.isRead
          );
      }

      if (
        activeFilter ===
        "read"
      ) {
        result =
          result.filter(
            (item) =>
              item.isRead
          );
      }

      const search =
        searchQuery
          .trim()
          .toLowerCase();

      if (search) {
        result =
          result.filter(
            (item) =>
              item.title
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.message
                ?.toLowerCase()
                .includes(
                  search
                ) ||
              item.actor?.name
                ?.toLowerCase()
                .includes(
                  search
                )
          );
      }

      return result;
    }, [
      notifications,
      activeFilter,
      searchQuery,
    ]);


  // =====================================================
  // GROUP BY DATE
  // =====================================================

  const groupedNotifications =
    useMemo(() => {
      const groups = {};

      filteredNotifications.forEach(
        (notification) => {
          const date =
            new Date(
              notification.createdAt
            );

          const today =
            new Date();

          const yesterday =
            new Date();

          yesterday.setDate(
            yesterday.getDate() -
              1
          );

          let label =
            date.toLocaleDateString();

          if (
            date.toDateString() ===
            today.toDateString()
          ) {
            label =
              "Today";
          } else if (
            date.toDateString() ===
            yesterday.toDateString()
          ) {
            label =
              "Yesterday";
          }

          if (!groups[label]) {
            groups[label] = [];
          }

          groups[label].push(
            notification
          );
        }
      );

      return groups;
    }, [
      filteredNotifications,
    ]);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-slate-800" />

          <div className="mt-3 h-4 w-80 rounded bg-slate-900" />

          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 rounded-xl border border-slate-800 bg-slate-900/30"
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <Bell
                size={20}
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">
                Notification Center
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Stay updated with everything happening around your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              fetchNotifications(
                true
              )
            }
            disabled={
              refreshing
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-slate-200 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          {unreadCount >
            0 && (
            <button
              type="button"
              onClick={
                markAllAsRead
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white transition hover:bg-indigo-500"
            >
              <CheckCheck
                size={14}
              />

              Mark all read
            </button>
          )}
        </div>
      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

        <SummaryCard
          label="All"
          value={
            notifications.length
          }
          active={
            activeFilter ===
            "all"
          }
          onClick={() =>
            setActiveFilter(
              "all"
            )
          }
        />

        <SummaryCard
          label="Unread"
          value={
            unreadCount
          }
          active={
            activeFilter ===
            "unread"
          }
          onClick={() =>
            setActiveFilter(
              "unread"
            )
          }
        />

        <SummaryCard
          label="Read"
          value={
            notifications.length -
            unreadCount
          }
          active={
            activeFilter ===
            "read"
          }
          onClick={() =>
            setActiveFilter(
              "read"
            )
          }
        />

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <p className="text-xs text-slate-500">
            Status
          </p>

          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            Live
          </p>
        </div>
      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:flex-row">

        <div className="relative flex-1">

          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            value={
              searchQuery
            }
            onChange={(event) =>
              setSearchQuery(
                event.target
                  .value
              )
            }
            placeholder="Search notifications..."
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex rounded-lg border border-slate-800 bg-slate-900/40 p-1">

          {[
            ["all", "All"],
            [
              "unread",
              "Unread",
            ],
            ["read", "Read"],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setActiveFilter(
                    value
                  )
                }
                className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                  activeFilter ===
                  value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              fetchNotifications()
            }
            className="text-xs font-medium underline"
          >
            Retry
          </button>
        </div>
      )}


      {/* =================================================
          NOTIFICATIONS
      ================================================= */}

      {filteredNotifications.length ===
      0 ? (
        <EmptyState
          hasSearch={
            Boolean(
              searchQuery.trim()
            )
          }
          filter={
            activeFilter
          }
        />
      ) : (
        <div className="space-y-7">

          {Object.entries(
            groupedNotifications
          ).map(
            ([
              group,
              items,
            ]) => (
              <section
                key={group}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {group}
                  </span>

                  <div className="h-px flex-1 bg-slate-900" />
                </div>

                <div className="space-y-2">

                  {items.map(
                    (
                      notification
                    ) => (
                      <NotificationCard
                        key={
                          notification._id
                        }
                        notification={
                          notification
                        }
                        onOpen={
                          openNotification
                        }
                        onRead={
                          markAsRead
                        }
                        onDelete={
                          deleteNotification
                        }
                        getInitials={
                          getInitials
                        }
                        formatTime={
                          formatTime
                        }
                        getIcon={
                          getNotificationIcon
                        }
                        getIconStyle={
                          getIconStyle
                        }
                      />
                    )
                  )}

                </div>
              </section>
            )
          )}

        </div>
      )}
    </div>
  );
};


// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  label,
  value,
  active,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-indigo-500/30 bg-indigo-500/5"
          : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
      }`}
    >
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-white">
        {value}
      </p>
    </button>
  );
};


// =====================================================
// NOTIFICATION CARD
// =====================================================

const NotificationCard = ({
  notification,
  onOpen,
  onRead,
  onDelete,
  getInitials,
  formatTime,
  getIcon,
  getIconStyle,
}) => {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const actorName =
    notification.actor?.name ||
    "COLLABSPHERE";


  return (
    <div
      className={`group relative flex gap-4 rounded-xl border p-4 transition ${
        notification.isRead
          ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
          : "border-indigo-500/20 bg-indigo-500/[0.035] hover:border-indigo-500/30"
      }`}
    >

      {/* UNREAD DOT */}

      {!notification.isRead && (
        <span className="absolute left-1.5 top-7 h-2 w-2 rounded-full bg-indigo-400" />
      )}


      {/* ICON */}

      <div
        className={`ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconStyle(
          notification.type
        )}`}
      >
        {getIcon(
          notification.type
        )}
      </div>


      {/* CONTENT */}

      <button
        type="button"
        onClick={() =>
          onOpen(
            notification
          )
        }
        className="min-w-0 flex-1 text-left"
      >

        <div className="flex flex-wrap items-center gap-2">

          <h3 className="text-sm font-semibold text-slate-200">
            {notification.title}
          </h3>

          {!notification.isRead && (
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
              New
            </span>
          )}

        </div>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          {notification.message}
        </p>


        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">

          {notification.actor && (
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-slate-400">
                {getInitials(
                  actorName
                )}
              </span>

              {actorName}
            </span>
          )}

          <span>
            {formatTime(
              notification.createdAt
            )}
          </span>

          {notification.metadata
            ?.role && (
            <span className="rounded-md border border-slate-800 px-2 py-0.5 text-slate-500">
              {notification.metadata.role}
            </span>
          )}

        </div>
      </button>


      {/* ACTIONS */}

      <div className="relative shrink-0">

        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (previous) =>
                !previous
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 opacity-0 transition hover:bg-slate-800 hover:text-slate-300 group-hover:opacity-100"
        >
          <MoreHorizontal
            size={16}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-1 shadow-2xl">

            {!notification.isRead && (
              <button
                type="button"
                onClick={() => {
                  onRead(
                    notification._id
                  );

                  setMenuOpen(
                    false
                  );
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              >
                <Check
                  size={14}
                />

                Mark as read
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onDelete(
                  notification._id
                );

                setMenuOpen(
                  false
                );
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
            >
              <Trash2
                size={14}
              />

              Delete
            </button>

          </div>
        )}

      </div>

    </div>
  );
};


// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
  hasSearch,
  filter,
}) => {
  let title =
    "You're all caught up";

  let description =
    "Important updates from your workspace will appear here.";

  if (hasSearch) {
    title =
      "No notifications found";

    description =
      "Try a different search term.";
  } else if (
    filter === "unread"
  ) {
    title =
      "No unread notifications";

    description =
      "You have no pending notifications.";
  } else if (
    filter === "read"
  ) {
    title =
      "No read notifications";

    description =
      "Notifications you read will appear here.";
  }

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 px-6 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-600">
        <Bell
          size={24}
        />
      </div>

      <h3 className="mt-5 text-sm font-semibold text-slate-300">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">
        {description}
      </p>

    </div>
  );
};


export default Notifications;