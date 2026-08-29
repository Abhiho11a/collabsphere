import {
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Menu,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const Topbar = ({
  onMenuClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  // ==========================================
  // PAGE TITLES
  // ==========================================

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/workspaces": "Workspaces",
    "/projects": "Projects",
    "/tasks": "Tasks",
    "/documents": "Documents",
    "/files": "Files",
    "/chat": "Chat",
    "/notifications": "Notifications",
    "/analytics": "Analytics",
    "/activity": "Activity",
    "/members": "Members",
    "/settings": "Settings",
  };


  const title =
    pageTitles[location.pathname] ||
    "COLLABSPHERE";


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


  const initials =
    getInitials(user?.name) || "U";


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-xl sm:px-6">

      {/* ======================================
          LEFT
      ======================================= */}

      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile menu */}

        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>


        {/* Page title */}

        <div className="min-w-0">

          <h1 className="truncate text-lg font-semibold text-slate-100">
            {title}
          </h1>

          <p className="hidden text-[11px] text-slate-500 sm:block">
            COLLABSPHERE Workspace
          </p>

        </div>

      </div>


      {/* ======================================
          RIGHT
      ======================================= */}

      <div className="flex items-center gap-1 sm:gap-2">

        {/* Search */}

        <button
          type="button"
          className="group flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-slate-400 transition hover:border-slate-800 hover:bg-slate-900 hover:text-slate-200 sm:border-slate-800 sm:bg-slate-900/50 sm:px-3"
        >

          <Search
            size={18}
            className="shrink-0"
          />

          <span className="hidden text-sm text-slate-500 md:block">
            Search
          </span>

          <kbd className="hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 lg:block">
            Ctrl K
          </kbd>

        </button>


        {/* Help */}

        <button
          type="button"
          className="hidden rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 sm:block"
          title="Help"
        >
          <HelpCircle size={18} />
        </button>


        {/* Notification */}

        <button
          type="button"
          onClick={() =>
            navigate("/notifications")
          }
          className="relative rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          title="Notifications"
        >

          <Bell size={18} />

          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />

        </button>


        {/* Divider */}

        <div className="mx-1 h-6 w-px bg-slate-800" />


        {/* User */}

        <button
          type="button"
          onClick={() =>
            navigate("/settings")
          }
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/70"
        >

          {/* Avatar */}

          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
              {initials}
            </div>
          )}


          {/* User */}

          <div className="hidden min-w-0 text-left md:block">

            <p className="max-w-28 truncate text-sm font-medium text-slate-200">
              {user?.name || "User"}
            </p>

            <p className="text-[11px] text-slate-500">
              {user?.provider === "google"
                ? "Google"
                : "Member"}
            </p>

          </div>


          <ChevronDown
            size={15}
            className="hidden text-slate-500 md:block"
          />

        </button>

      </div>

    </header>
  );
};

export default Topbar;