import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock3,
  FolderKanban,
  ListTodo,
  MessageCircle,
  Users,
  Workflow,
  Eye,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import useDashboard from "../hooks/useDashboard";


const Dashboard = () => {

  const navigate =
    useNavigate();


  const {
    loading,
    error,
    refresh,
    stats,
    projects,
    myTasks,
    deadlines,
    taskDistribution,
    members,
  } = useDashboard();


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <DashboardLoading />;
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (
      <main className="flex h-[calc(100dvh-100px)] min-h-0 items-center justify-center px-5">

        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-950/70 px-8 py-10 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <Circle
              size={22}
              className="text-red-400"
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="mt-5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Try again
          </button>

        </div>

      </main>
    );
  }


  return (
    <main className="h-[calc(100dvh-100px)] min-h-0 overflow-hidden bg-slate-950">

      <div className="mx-auto flex h-full max-w-[1600px] min-h-0 flex-col px-5 py-4 sm:px-7 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-4 flex shrink-0 items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-400">
                Overview
              </span>

              <span className="h-1 w-1 rounded-full bg-slate-700" />

              <span className="text-[10px] text-slate-600">
                Organization workspace
              </span>

            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Dashboard
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              A quick overview of what's happening.
            </p>

          </div>


          <Link
            to="/workspaces"
            className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white sm:inline-flex"
          >
            <Building2 size={14} />

            View workspaces

            <ArrowRight size={13} />

          </Link>

        </header>


        {/* =================================================
            KPI ROW
        ================================================= */}

        <section className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">

          <DashboardMetric
            icon={Building2}
            label="Organizations"
            value={stats.organizations}
            subtitle="Your organizations"
          />

          <DashboardMetric
            icon={Workflow}
            label="Workspaces"
            value={stats.workspaces}
            subtitle="Accessible workspaces"
          />

          <DashboardMetric
            icon={FolderKanban}
            label="Projects"
            value={stats.projects}
            subtitle="Active projects"
          />

          <DashboardMetric
            icon={ListTodo}
            label="My Tasks"
            value={stats.myTasks}
            subtitle="Pending assignments"
          />

        </section>


        {/* =================================================
            ROW 2
        ================================================= */}

        <section className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.55fr_1fr]">

          {/* =========================
              MY TASKS
          ========================= */}

          <DashboardPanel
            title="My Tasks"
            subtitle={`${myTasks.length} pending assignments`}
            icon={CheckSquare}
            action={
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                View all
                <ArrowUpRight size={12} />
              </Link>
            }
          >

            <div className="h-full overflow-y-auto pr-1">

              {myTasks.length === 0 ? (

                <EmptyState
                  icon={CheckCircle2}
                  title="You're all caught up"
                  description="No pending tasks are assigned to you."
                />

              ) : (

                <div className="space-y-1">

                  {myTasks.map(
                    (task) => (
                      <TaskRow
                        key={
                          task._id ||
                          task.id
                        }
                        task={task}
                      />
                    )
                  )}

                </div>

              )}

            </div>

          </DashboardPanel>


          {/* =========================
              DEADLINES
          ========================= */}

          <DashboardPanel
            title="Upcoming Deadlines"
            subtitle="Tasks that need attention"
            icon={CalendarDays}
          >

            <div className="h-full overflow-y-auto pr-1">

              {deadlines.length === 0 ? (

                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming deadlines"
                  description="You're all caught up."
                />

              ) : (

                <div className="space-y-1">

                  {deadlines.map(
                    (task) => (
                      <DeadlineRow
                        key={
                          task._id ||
                          task.id
                        }
                        task={task}
                      />
                    )
                  )}

                </div>

              )}

            </div>

          </DashboardPanel>

        </section>


        {/* =================================================
            ROW 3
        ================================================= */}

        <section className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.55fr_1fr]">

          {/* =========================
              PROJECT PROGRESS
          ========================= */}

          <DashboardPanel
            title="Project Progress"
            subtitle="Current active projects"
            icon={FolderKanban}
            action={
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                View all
                <ArrowUpRight size={12} />
              </Link>
            }
          >

            <div className="h-full overflow-y-auto pr-1">

              {projects.length === 0 ? (

                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Projects created in your workspaces will appear here."
                />

              ) : (

                <div className="space-y-3">

                  {projects.map(
                    (project) => (
                      <ProjectProgressRow
                        key={
                          project._id ||
                          project.id
                        }
                        project={project}
                      />
                    )
                  )}

                </div>

              )}

            </div>

          </DashboardPanel>


          {/* =========================
              TASK DISTRIBUTION
          ========================= */}

          <DashboardPanel
            title="Task Distribution"
            subtitle="Tasks assigned to your team"
            icon={ListTodo}
          >

            <TaskDistribution
              distribution={
                taskDistribution
              }
            />

          </DashboardPanel>

        </section>


        {/* =================================================
            ROW 4 — ORGANIZATION MEMBERS
        ================================================= */}

        <section className="mt-3 min-h-0 flex-1">

          <DashboardPanel
            title="Organization Members"
            subtitle={`${members.length} members in this organization`}
            icon={Users}
            action={
              <Link
                to="/organization/members"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                View all
                <ArrowUpRight size={12} />
              </Link>
            }
          >

            <div className="h-full overflow-x-auto overflow-y-hidden pb-1">

              {members.length === 0 ? (

                <EmptyState
                  icon={Users}
                  title="No organization members"
                  description="Members will appear here."
                />

              ) : (

                <div className="flex gap-2.5 overflow-x-auto pb-1">

                  {members.map(
                    (member) => (
                      <OrganizationMemberCard
                        key={
                          member.id ||
                          member.userId
                        }
                        member={member}
                        onChat={() => {

                          const memberId =
                            member.userId ||
                            member.id;

                          navigate(
                            `/chat?userId=${encodeURIComponent(
                              memberId
                            )}`
                          );

                        }}
                      />
                    )
                  )}

                </div>

              )}

            </div>

          </DashboardPanel>

        </section>

      </div>

    </main>
  );
};


// =====================================================
// METRIC
// =====================================================

const DashboardMetric = ({
  icon: Icon,
  label,
  value,
  subtitle,
}) => {

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 transition hover:border-slate-700">

      <div className="flex items-center justify-between">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          <Icon size={15} />
        </div>

        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-700">
          Overview
        </span>

      </div>

      <div className="mt-2">

        <p className="text-xl font-semibold tracking-tight text-white">
          {value}
        </p>

        <p className="mt-0.5 text-xs font-medium text-slate-300">
          {label}
        </p>

        <p className="mt-0.5 text-[9px] text-slate-600">
          {subtitle}
        </p>

      </div>

    </div>
  );
};


// =====================================================
// PANEL
// =====================================================

const DashboardPanel = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}) => {

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">

      <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 px-4 py-3">

        <div className="flex min-w-0 items-center gap-2.5">

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400">
            <Icon size={14} />
          </div>

          <div className="min-w-0">

            <h2 className="truncate text-xs font-semibold text-white">
              {title}
            </h2>

            <p className="mt-0.5 truncate text-[9px] text-slate-600">
              {subtitle}
            </p>

          </div>

        </div>


        {action}

      </div>


      <div className="min-h-0 flex-1 p-3">
        {children}
      </div>

    </section>
  );
};


// =====================================================
// TASK ROW
// =====================================================

const TaskRow = ({
  task,
}) => {

  const workspaceId =
    task.workspaceId ||
    task.workspace?._id ||
    task.workspace?.id;

  const projectId =
    task.projectId ||
    task.project?._id ||
    task.project?.id;

  const taskId =
    task._id ||
    task.id;


  const href =
    workspaceId &&
    projectId &&
    taskId
      ? `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
      : "/tasks";


  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-slate-900/80"
    >

      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 text-slate-600 transition group-hover:border-indigo-500/40 group-hover:text-indigo-400">
        <Circle size={8} />
      </span>


      <div className="min-w-0 flex-1">

        <p className="truncate text-[11px] font-medium text-slate-300 group-hover:text-white">
          {task.title ||
            "Untitled task"}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-600">
          {task.project?.name ||
            "Project"}
        </p>

      </div>


      <div className="flex shrink-0 items-center gap-2">

        {task.priority && (
          <PriorityBadge
            priority={
              task.priority
            }
          />
        )}

        {task.dueDate && (
          <span className="text-[9px] text-slate-600">
            {formatShortDate(
              task.dueDate
            )}
          </span>
        )}

      </div>

    </Link>
  );
};


// =====================================================
// DEADLINE ROW
// =====================================================

const DeadlineRow = ({
  task,
}) => {

  const workspaceId =
    task.workspaceId ||
    task.workspace?._id ||
    task.workspace?.id;

  const projectId =
    task.projectId ||
    task.project?._id ||
    task.project?.id;

  const taskId =
    task._id ||
    task.id;


  const href =
    workspaceId &&
    projectId &&
    taskId
      ? `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
      : "/tasks";


  const urgency =
    getDeadlineUrgency(
      task.dueDate
    );


  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-slate-900/80"
    >

      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          urgency === "today"
            ? "bg-red-500/10 text-red-400"
            : urgency === "soon"
            ? "bg-amber-500/10 text-amber-400"
            : "bg-slate-900 text-slate-500"
        }`}
      >
        <CalendarDays size={13} />
      </div>


      <div className="min-w-0 flex-1">

        <p className="truncate text-[11px] font-medium text-slate-300 group-hover:text-white">
          {task.title ||
            "Untitled task"}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-600">
          {task.project?.name ||
            "Project"}
        </p>

      </div>


      <div className="shrink-0 text-right">

        <p
          className={`text-[9px] font-medium ${
            urgency === "today"
              ? "text-red-400"
              : urgency === "soon"
              ? "text-amber-400"
              : "text-slate-500"
          }`}
        >
          {getDeadlineText(
            task.dueDate
          )}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-700">
          {formatShortDate(
            task.dueDate
          )}
        </p>

      </div>

    </Link>
  );
};


// =====================================================
// PROJECT PROGRESS
// =====================================================

const ProjectProgressRow = ({
  project,
}) => {

  const projectId =
    project._id ||
    project.id;

  const workspaceId =
    project.workspaceId ||
    project.workspace?._id ||
    project.workspace?.id;


  const projectName =
    project.name ||
    project.title ||
    "Untitled project";


  const progress =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          project.progress ?? 0
        )
      )
    );


  return (
    <Link
      to={
        workspaceId &&
        projectId
          ? `/workspaces/${workspaceId}/projects/${projectId}`
          : "/projects"
      }
      className="group block rounded-lg px-2.5 py-2 transition hover:bg-slate-900/70"
    >

      <div className="flex items-center justify-between gap-4">

        <div className="min-w-0 flex items-center gap-2">

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-[9px] font-semibold text-indigo-400">
            {getInitials(
              projectName
            )}
          </div>

          <div className="min-w-0">

            <p className="truncate text-[11px] font-medium text-slate-300 group-hover:text-white">
              {projectName}
            </p>

            <p className="truncate text-[8px] text-slate-700">
              {project.workspace?.name ||
                "Workspace"}
            </p>

          </div>

        </div>


        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
          {progress}%
        </span>

      </div>


      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </Link>
  );
};


// =====================================================
// TASK DISTRIBUTION
// =====================================================

const TaskDistribution = ({
  tasks = [],
  members = [],
}) => {
  const getUserId = (user) => {
    if (!user) return null;

    return String(
      user?._id ||
        user?.id ||
        user?.userId ||
        user
    );
  };

  const getAssigneeId = (task) => {
    return getUserId(
      task?.assignee ||
        task?.assignedTo ||
        task?.assignedUser ||
        task?.user
    );
  };

  const getTaskDescription = (task) => {
    return (
      task?.description ||
      task?.desc ||
      task?.title ||
      "Untitled task"
    );
  };

  const memberTasks = members.map((member) => {
    const memberId = getUserId(
      member?.userId || member?.id
    );

    const assignedTasks = tasks.filter(
      (task) =>
        getAssigneeId(task) ===
        memberId
    );

    return {
      ...member,
      assignedTasks,
    };
  });

  return (
    <div className="h-full overflow-y-auto pr-1">

      {memberTasks.length === 0 ? (
        <div className="flex h-full items-center justify-center">

          <p className="text-xs text-slate-600">
            No members found
          </p>

        </div>
      ) : (
        <div className="space-y-2">

          {memberTasks.map((member) => (
            <div
              key={
                member.userId ||
                member.id
              }
              className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2.5"
            >

              {/* MEMBER */}

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-[10px] font-semibold text-indigo-400">
                  {(
                    member.name || "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">

                  <p className="truncate text-[10px] font-medium text-slate-300">
                    {member.name ||
                      "Unknown user"}
                  </p>

                  <p className="text-[8px] text-slate-600">
                    {member.assignedTasks.length ===
                    1
                      ? "1 task assigned"
                      : `${member.assignedTasks.length} tasks assigned`}
                  </p>

                </div>

              </div>


              {/* TASK DESCRIPTIONS */}

              {member.assignedTasks.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-slate-800/60 pt-2">

                  {member.assignedTasks.map(
                    (task) => (
                      <div
                        key={
                          task._id ||
                          task.id
                        }
                        className="flex items-start gap-2"
                      >

                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-600" />

                        <p className="line-clamp-2 text-[9px] leading-4 text-slate-500">
                          {getTaskDescription(
                            task
                          )}
                        </p>

                      </div>
                    )
                  )}

                </div>
              )}


              {member.assignedTasks.length ===
                0 && (
                <p className="mt-2 border-t border-slate-800/60 pt-2 text-[9px] text-slate-700">
                  No tasks assigned
                </p>
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  );
};

// =====================================================
// ORGANIZATION MEMBER
// =====================================================

const OrganizationMemberCard = ({
  member,
  onChat,
}) => {
  const name =
    member?.name ||
    "Unknown user";

  const email =
    member?.email ||
    "No email";

  const role =
    member?.role ===
    "organization_admin"
      ? "Organization Admin"
      : member?.role === "guest"
      ? "Organization Viewer"
      : "Organization Member";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");

  return (
    <div
      className="
        group
        relative
        h-[136px]
        w-[220px]
        shrink-0
        overflow-hidden
        rounded-xl
        border
        border-slate-800
        bg-slate-950/50
        p-3
        transition-all
        duration-200
        hover:border-indigo-500/30
        hover:bg-slate-900/70
      "
    >

      {/* =========================================
          TOP
      ========================================= */}

      <div className="flex items-start justify-between">

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            bg-indigo-500/15
            text-sm
            font-semibold
            text-indigo-400
          "
        >
          {initials || "U"}
        </div>

        {/* ONLINE STATUS */}

        <span
          className="
            flex
            h-5
            w-5
            items-center
            justify-center
            rounded-md
            bg-emerald-500/10
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-emerald-400
            "
          />
        </span>

      </div>


      {/* =========================================
          USER INFO
      ========================================= */}

      <div className="mt-3">

        <p className="truncate text-xs font-semibold text-slate-200">
          {name}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-600">
          {email}
        </p>

      </div>


      {/* =========================================
          ROLE
      ========================================= */}

      <span
        className="
          absolute
          bottom-3
          left-3
          inline-flex
          rounded-full
          border
          border-slate-800
          bg-slate-900/70
          px-2
          py-1
          text-[8px]
          font-medium
          text-slate-500
          transition-all
          duration-200
          group-hover:-translate-y-9
          group-hover:opacity-0
        "
      >
        {role}
      </span>


      {/* =========================================
          CHAT BUTTON
      ========================================= */}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();

          if (onChat) {
            onChat(member);
          }
        }}
        className="
          absolute
          bottom-3
          left-3
          right-3
          flex
          items-center
          justify-center
          gap-1.5
          rounded-lg
          border
          border-indigo-500/20
          bg-indigo-500/10
          px-2
          py-2
          text-[9px]
          font-medium
          text-indigo-400
          opacity-0
          translate-y-2
          transition-all
          duration-200
          group-hover:translate-y-0
          group-hover:opacity-100
          hover:bg-indigo-500/15
          hover:text-indigo-300
        "
      >
        <MessageCircle
          size={12}
        />

        Chat

      </button>

    </div>
  );
};


// =====================================================
// AVATAR
// =====================================================

const Avatar = ({
  member,
}) => {

  if (member.avatar) {

    return (
      <img
        src={member.avatar}
        alt={member.name || "Member"}
        className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-800"
      />
    );
  }


  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/10">
      {getInitials(
        member.name
      )}
    </div>
  );
};


// =====================================================
// ROLE BADGE
// =====================================================

const RoleBadge = ({
  role,
  label,
}) => {

  const Icon =
    role ===
    "organization_admin"
      ? ShieldCheck
      : role === "guest"
      ? Eye
      : Users;


  return (
    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/70 px-2 py-1 text-[8px] font-medium text-slate-500">

      <Icon size={9} />

      {label}

    </span>
  );
};


// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
  icon: Icon,
  title,
  description,
}) => {

  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-700">
        <Icon size={16} />
      </div>

      <p className="mt-2 text-[11px] font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-1 max-w-[240px] text-[9px] leading-4 text-slate-700">
        {description}
      </p>

    </div>
  );
};


// =====================================================
// LOADING
// =====================================================

const DashboardLoading = () => {

  return (
    <main className="h-[calc(100dvh-100px)] overflow-hidden bg-slate-950">

      <div className="mx-auto flex h-full max-w-[1600px] flex-col px-5 py-4 sm:px-7 lg:px-8">

        <div className="h-12 shrink-0 animate-pulse rounded-lg bg-slate-900/50" />

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-[105px] animate-pulse rounded-xl border border-slate-800 bg-slate-950/50"
              />
            )
          )}

        </div>


        <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.55fr_1fr]">

          <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50" />

          <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50" />

        </div>


        <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.55fr_1fr]">

          <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50" />

          <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50" />

        </div>


        <div className="mt-3 min-h-0 flex-1 animate-pulse rounded-xl border border-slate-800 bg-slate-950/50" />

      </div>

    </main>
  );
};


// =====================================================
// HELPERS
// =====================================================

const getInitials = (
  name = ""
) => {

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");


  return initials || "U";
};


const getOrganizationRoleLabel = (
  role
) => {

  if (
    role ===
    "organization_admin"
  ) {
    return "Organization Admin";
  }

  if (
    role === "guest"
  ) {
    return "Organization Viewer";
  }

  return "Organization Member";
};


const formatShortDate = (
  date
) => {

  if (!date) {
    return "";
  }


  const parsed =
    new Date(date);


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "";
  }


  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
};


const getDeadlineUrgency = (
  date
) => {

  if (!date) {
    return "normal";
  }


  const target =
    new Date(date);

  const now =
    new Date();


  const diff =
    target.getTime() -
    now.getTime();


  const days =
    Math.ceil(
      diff /
        (1000 * 60 * 60 * 24)
    );


  if (days <= 0) {
    return "today";
  }

  if (days <= 2) {
    return "soon";
  }

  return "normal";
};


const getDeadlineText = (
  date
) => {

  if (!date) {
    return "";
  }


  const target =
    new Date(date);

  const now =
    new Date();


  const days =
    Math.ceil(
      (
        target.getTime() -
        now.getTime()
      ) /
        (1000 * 60 * 60 * 24)
    );


  if (days <= 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  return `${days} days`;
};


const PriorityBadge = ({
  priority,
}) => {

  if (!priority) {
    return null;
  }


  return (
    <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-amber-400">
      {priority}
    </span>
  );
};


export default Dashboard;