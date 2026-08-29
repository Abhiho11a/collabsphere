import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  FolderOpen,
  MessageSquare,
  Bell,
  BarChart3,
  Activity,
  Settings,
  Users,
  ChevronDown,
  Plus,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const Sidebar = ({
  onNavigate,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();


  // ==========================================
  // NAVIGATION
  // ==========================================

  const mainNavigation = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Workspaces",
      icon: Building2,
      path: "/workspaces",
    },
    {
      label: "Projects",
      icon: FolderKanban,
      path: "/projects",
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      path: "/tasks",
    },
    {
      label: "Documents",
      icon: FileText,
      path: "/documents",
    },
    {
      label: "Files",
      icon: FolderOpen,
      path: "/files",
    },
    {
      label: "Chat",
      icon: MessageSquare,
      path: "/chat",
    },
  ];


  const insightNavigation = [
    {
      label: "Notifications",
      icon: Bell,
      path: "/notifications",
      badge: 3,
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      label: "Activity",
      icon: Activity,
      path: "/activity",
    },
  ];


  const bottomNavigation = [
    {
      label: "Members",
      icon: Users,
      path: "/members",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];


  // ==========================================
  // ACTIVE ROUTE
  // ==========================================

  const isActive = (path) => {
    return location.pathname === path;
  };


  // ==========================================
  // NAVIGATE
  // ==========================================

  const handleNavigation = (item) => {
    navigate(item.path);

    if (onNavigate) {
      onNavigate();
    }
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    await logout();

    navigate("/login");

    if (onNavigate) {
      onNavigate();
    }
  };


  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };


  const userInitials =
    getInitials(user?.name) || "U";


  // ==========================================
  // NAVIGATION ITEM
  // ==========================================

  const renderNavigationItem = (item) => {
    const Icon = item.icon;

    const active = isActive(item.path);

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => handleNavigation(item)}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-indigo-500/10 text-indigo-400"
            : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
        }`}
      >

        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.8}
          className={`shrink-0 transition-colors ${
            active
              ? "text-indigo-400"
              : "text-slate-500 group-hover:text-slate-300"
          }`}
        />


        <span className="flex-1 text-left">
          {item.label}
        </span>


        {item.badge && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500/15 px-1.5 text-[11px] font-semibold text-indigo-400">
            {item.badge}
          </span>
        )}

      </button>
    );
  };


  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950">

      {/* ======================================
          LOGO
      ======================================= */}

      <div className="flex h-16 items-center border-b border-slate-800 px-5">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <span className="text-sm font-bold text-white">
              C
            </span>
          </div>

          <div>

            <h1 className="text-base font-bold tracking-tight text-white">
              COLLAB
              <span className="text-indigo-400">
                SPHERE
              </span>
            </h1>

            <p className="text-[10px] text-slate-500">
              Collaborative Workspace
            </p>

          </div>

        </div>

      </div>


      {/* ======================================
          CURRENT WORKSPACE
      ======================================= */}

      <div className="border-b border-slate-800 p-3">

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-left transition hover:border-slate-700 hover:bg-slate-900"
        >

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
            <Building2
              size={16}
              className="text-indigo-400"
            />
          </div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-[11px] text-slate-500">
              Current Workspace
            </p>

            <p className="truncate text-sm font-semibold text-slate-200">
              My Workspace
            </p>

          </div>

          <ChevronDown
            size={16}
            className="shrink-0 text-slate-500"
          />

        </button>

      </div>


      {/* ======================================
          NAVIGATION
      ======================================= */}

      <div className="flex-1 overflow-y-auto px-3 py-4">

        <div>

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Workspace
          </p>

          <nav className="space-y-1">
            {mainNavigation.map(
              renderNavigationItem
            )}
          </nav>

        </div>


        <div className="mt-7">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Insights
          </p>

          <nav className="space-y-1">
            {insightNavigation.map(
              renderNavigationItem
            )}
          </nav>

        </div>


        <div className="mt-7">

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-400"
          >
            <Plus size={15} />
            Create New
          </button>

        </div>

      </div>


      {/* ======================================
          BOTTOM NAVIGATION
      ======================================= */}

      <div className="border-t border-slate-800 px-3 py-3">

        <nav className="space-y-1">

          {bottomNavigation.map(
            renderNavigationItem
          )}

        </nav>

      </div>


      {/* ======================================
          USER
      ======================================= */}

      <div className="border-t border-slate-800 p-3">

        <div className="flex items-center gap-3 rounded-lg px-2 py-2">

          {/* Avatar */}

          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
              {userInitials}
            </div>
          )}


          {/* User information */}

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-slate-200">
              {user?.name || "User"}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.provider === "google"
                ? "Google account"
                : "Member"}
            </p>

          </div>


          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={16} />
          </button>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;