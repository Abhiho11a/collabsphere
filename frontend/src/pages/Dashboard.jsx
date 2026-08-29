import {
  Bell,
  CheckCircle2,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Dashboard = () => {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };


  // ==========================================
  // DUMMY DATA
  // ==========================================

  const projects = [
    {
      name: "Website Redesign",
      description:
        "Redesign the company website",
      progress: 72,
      status: "Active",
      members: 5,
    },
    {
      name: "Mobile Application",
      description:
        "Build the mobile application",
      progress: 45,
      status: "Active",
      members: 4,
    },
    {
      name: "Documentation",
      description:
        "Update project documentation",
      progress: 90,
      status: "Review",
      members: 3,
    },
  ];


  const activities = [
    {
      user: "Rahul",
      action:
        "completed the task",
      target:
        "API integration",
      time: "10 minutes ago",
    },
    {
      user: "Priya",
      action:
        "created a new project",
      target:
        "Mobile Application",
      time: "1 hour ago",
    },
    {
      user: "Abhishek",
      action:
        "updated the task",
      target:
        "Homepage design",
      time: "2 hours ago",
    },
  ];


  const upcomingTasks = [
    {
      title: "Design homepage",
      project: "Website Redesign",
      date: "Today",
    },
    {
      title: "Complete API integration",
      project: "Mobile Application",
      date: "Tomorrow",
    },
    {
      title: "Review documentation",
      project: "Documentation",
      date: "Sep 2",
    },
  ];


  // ==========================================
  // SIDEBAR
  // ==========================================

  const navigation = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: true,
    },
    {
      name: "Projects",
      icon: FolderKanban,
    },
    {
      name: "Tasks",
      icon: ListTodo,
    },
    {
      name: "Members",
      icon: Users,
    },
  ];


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">


      {/* ======================================
          MOBILE OVERLAY
      ====================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}


      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-64
          flex-col
          border-r
          border-slate-800
          bg-slate-950
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Logo */}

        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
              CS
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide">
                COLLAB
                <span className="text-indigo-400">
                  SPHERE
                </span>
              </h1>

              <p className="text-[10px] text-slate-500">
                Collaborative workspace
              </p>
            </div>

          </div>


          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>

        </div>


        {/* Navigation */}

        <nav className="flex-1 space-y-1 px-3 py-6">

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          {navigation.map((item) => {

            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-sm
                  transition
                  ${
                    item.active
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }
                `}
              >

                <Icon size={18} />

                <span>
                  {item.name}
                </span>

              </button>
            );
          })}


          <div className="my-6 border-t border-slate-800" />


          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Manage
          </p>


          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
          >
            <Settings size={18} />

            Settings
          </button>

        </nav>


        {/* User */}

        <div className="border-t border-slate-800 p-4">

          <div className="flex items-center gap-3">

            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-400">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase() || "U"}
              </div>
            )}


            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-medium text-slate-200">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>

            </div>

          </div>

        </div>

      </aside>


      {/* ======================================
          MAIN AREA
      ====================================== */}

      <div className="lg:pl-64">


        {/* ====================================
            TOPBAR
        ==================================== */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 backdrop-blur-xl sm:px-8">

          <button
            onClick={() =>
              setSidebarOpen(true)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          >
            <Menu size={22} />
          </button>


          {/* Search */}

          <div className="hidden w-full max-w-md md:block">

            <div className="relative">

              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                placeholder="Search projects, tasks, members..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

            </div>

          </div>


          <div className="ml-auto flex items-center gap-2">


            {/* Notification */}

            <button
              className="relative rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >

              <Bell size={19} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />

            </button>


            {/* Profile */}

            <div className="relative">

              <button
                onClick={() =>
                  setProfileOpen(
                    !profileOpen
                  )
                }
                className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-900"
              >

                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold">
                    {user?.name
                      ?.charAt(0)
                      .toUpperCase() ||
                      "U"}
                  </div>
                )}

                <ChevronDown
                  size={15}
                  className="hidden text-slate-500 sm:block"
                />

              </button>


              {profileOpen && (
                <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">

                  <div className="border-b border-slate-800 px-4 py-3">

                    <p className="truncate text-sm font-medium">
                      {user?.name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user?.email}
                    </p>

                  </div>


                  <div className="p-1">

                    <button
                      onClick={() =>
                        navigate(
                          "/settings"
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Settings size={16} />

                      Settings
                    </button>


                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={16} />

                      Logout
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </header>


        {/* ====================================
            CONTENT
        ==================================== */}

        <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">


          {/* ==================================
              WELCOME
          ================================== */}

          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>

              <p className="mb-1 text-sm text-slate-500">
                Dashboard
              </p>

              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Good morning,{" "}
                <span className="text-indigo-400">
                  {user?.name?.split(" ")[0] ||
                    "there"}
                </span>{" "}
                👋
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Here's what's happening across your workspace.
              </p>

            </div>


            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >

              <Plus size={17} />

              New Project

            </button>

          </div>


          {/* ==================================
              STATS
          ================================== */}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">


            {/* Projects */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="mb-4 flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FolderKanban size={19} />
                </div>

                <span className="text-xs text-emerald-400">
                  +12%
                </span>

              </div>

              <p className="text-sm text-slate-500">
                Total Projects
              </p>

              <p className="mt-1 text-2xl font-semibold">
                8
              </p>

            </div>


            {/* Tasks */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="mb-4 flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <ListTodo size={19} />
                </div>

                <span className="text-xs text-emerald-400">
                  +8%
                </span>

              </div>

              <p className="text-sm text-slate-500">
                Active Tasks
              </p>

              <p className="mt-1 text-2xl font-semibold">
                24
              </p>

            </div>


            {/* Members */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="mb-4 flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Users size={19} />
                </div>

                <span className="text-xs text-emerald-400">
                  +3
                </span>

              </div>

              <p className="text-sm text-slate-500">
                Team Members
              </p>

              <p className="mt-1 text-2xl font-semibold">
                12
              </p>

            </div>


            {/* Due */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="mb-4 flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <CheckCircle2 size={19} />
                </div>

                <span className="text-xs text-amber-400">
                  Attention
                </span>

              </div>

              <p className="text-sm text-slate-500">
                Tasks Due Soon
              </p>

              <p className="mt-1 text-2xl font-semibold">
                5
              </p>

            </div>

          </div>


          {/* ==================================
              PROJECTS
          ================================== */}

          <section className="mb-8">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-lg font-semibold">
                  Recent Projects
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Projects you're currently working on.
                </p>

              </div>

              <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                View all
              </button>

            </div>


            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">

              <div className="divide-y divide-slate-800">

                {projects.map(
                  (project) => (
                    <div
                      key={project.name}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                          <FolderKanban size={18} />
                        </div>


                        <div className="min-w-0">

                          <h4 className="truncate text-sm font-medium text-slate-200">
                            {project.name}
                          </h4>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {project.description}
                          </p>

                        </div>

                      </div>


                      <div className="flex items-center gap-6">

                        {/* Progress */}

                        <div className="w-32">

                          <div className="mb-1 flex justify-between text-[11px]">

                            <span className="text-slate-500">
                              Progress
                            </span>

                            <span className="text-slate-400">
                              {project.progress}%
                            </span>

                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{
                                width: `${project.progress}%`,
                              }}
                            />

                          </div>

                        </div>


                        {/* Status */}

                        <span
                          className={`
                            rounded-full
                            px-2.5
                            py-1
                            text-[11px]
                            font-medium
                            ${
                              project.status ===
                              "Active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }
                          `}
                        >
                          {project.status}
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

          </section>


          {/* ==================================
              BOTTOM GRID
          ================================== */}

          <div className="grid gap-6 xl:grid-cols-2">


            {/* =================================
                RECENT ACTIVITY
            ================================= */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/40">

              <div className="border-b border-slate-800 p-5">

                <h3 className="font-semibold">
                  Recent Activity
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Latest updates from your workspace.
                </p>

              </div>


              <div className="divide-y divide-slate-800">

                {activities.map(
                  (activity, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-5"
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
                        {activity.user.charAt(
                          0
                        )}
                      </div>


                      <div className="min-w-0">

                        <p className="text-sm text-slate-300">

                          <span className="font-medium text-white">
                            {activity.user}
                          </span>{" "}

                          {activity.action}{" "}

                          <span className="font-medium text-indigo-400">
                            {activity.target}
                          </span>

                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {activity.time}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>


            {/* =================================
                UPCOMING TASKS
            ================================= */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/40">

              <div className="flex items-center justify-between border-b border-slate-800 p-5">

                <div>

                  <h3 className="font-semibold">
                    Upcoming Tasks
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Keep track of what's coming next.
                  </p>

                </div>

                <ListTodo
                  size={19}
                  className="text-slate-600"
                />

              </div>


              <div className="divide-y divide-slate-800">

                {upcomingTasks.map(
                  (task) => (
                    <div
                      key={task.title}
                      className="flex items-center gap-4 p-5 transition hover:bg-slate-900/70"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-500">
                        <CheckCircle2
                          size={17}
                        />
                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-medium text-slate-300">
                          {task.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {task.project}
                        </p>

                      </div>


                      <span className="shrink-0 text-xs text-slate-500">
                        {task.date}
                      </span>

                    </div>
                  )
                )}

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  );
};

export default Dashboard;