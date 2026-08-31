import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  LockKeyhole,
  MoreHorizontal,
  Users,
} from "lucide-react";

const ProjectCard = ({
  project,
  onOpen,
  hasAccess = true,
}) => {
  // ==========================================
  // PROJECT DATA
  // ==========================================

  const projectName =
    project?.name || "Untitled Project";

  const description =
    project?.description ||
    "No project description provided.";

  const status =
    project?.status || "Planning";

  const priority =
    project?.priority || "Medium";

  const memberCount =
    project?.memberCount ??
    project?.members?.length ??
    0;


  // ==========================================
  // PROGRESS
  // ==========================================

  const progress =
    status === "Completed"
      ? 100
      : status === "In Progress"
      ? 50
      : status === "Planning"
      ? 20
      : status === "On Hold"
      ? 10
      : 0;


  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const statusConfig = {
    Planning: {
      badge:
        "bg-slate-800 text-slate-400",
      icon:
        "bg-slate-700/60 text-slate-400",
      progress:
        "bg-indigo-500",
    },

    "In Progress": {
      badge:
        "bg-indigo-500/10 text-indigo-400",
      icon:
        "bg-indigo-500/10 text-indigo-400",
      progress:
        "bg-indigo-500",
    },

    Completed: {
      badge:
        "bg-emerald-500/10 text-emerald-400",
      icon:
        "bg-emerald-500/10 text-emerald-400",
      progress:
        "bg-emerald-500",
    },

    "On Hold": {
      badge:
        "bg-amber-500/10 text-amber-400",
      icon:
        "bg-amber-500/10 text-amber-400",
      progress:
        "bg-amber-500",
    },

    Archived: {
      badge:
        "bg-slate-800 text-slate-500",
      icon:
        "bg-slate-800 text-slate-500",
      progress:
        "bg-slate-600",
    },
  };

  const currentStatus =
    statusConfig[status] ||
    statusConfig.Planning;


  // ==========================================
  // PRIORITY CONFIG
  // ==========================================

  const priorityConfig = {
    Critical:
      "bg-red-500/10 text-red-400 border-red-500/10",

    High:
      "bg-orange-500/10 text-orange-400 border-orange-500/10",

    Medium:
      "bg-amber-500/10 text-amber-400 border-amber-500/10",

    Low:
      "bg-slate-800 text-slate-400 border-slate-700",
  };

  const currentPriority =
    priorityConfig[priority] ||
    priorityConfig.Medium;


  // ==========================================
  // DUE DATE
  // ==========================================

  const dueDate = project?.dueDate
    ? new Date(
        project.dueDate
      ).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      )
    : "No deadline";


  // ==========================================
  // OPEN PROJECT
  // ==========================================

  const handleOpen = () => {
    if (!hasAccess) {
      return;
    }

    if (onOpen) {
      onOpen();
    }
  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className={`
        group relative
        rounded-xl
        border
        p-5
        transition-all
        duration-200

        ${
          hasAccess
            ? `
              border-slate-800
              bg-slate-900/40
              hover:-translate-y-0.5
              hover:border-slate-700
              hover:bg-slate-900/70
              hover:shadow-lg
              hover:shadow-black/20
            `
            : `
              border-slate-800/80
              bg-slate-950/50
              opacity-90
            `
        }
      `}
    >

      {/* =====================================
          TOP ACCENT
      ====================================== */}

      {hasAccess && (
        <div
          className="
            pointer-events-none
            absolute
            left-5
            right-5
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-indigo-500/40
            to-transparent
            opacity-0
            transition
            group-hover:opacity-100
          "
        />
      )}


      {/* =====================================
          HEADER
      ====================================== */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >

        {/* PROJECT INFO */}

        <button
          type="button"
          onClick={handleOpen}
          disabled={!hasAccess}
          className="
            flex
            min-w-0
            items-center
            gap-3
            text-left
          "
        >

          {/* PROJECT ICON */}

          <div
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              transition

              ${currentStatus.icon}

              ${
                hasAccess
                  ? "group-hover:scale-105"
                  : ""
              }
            `}
          >

            {hasAccess ? (
              <FolderKanban size={18} />
            ) : (
              <LockKeyhole size={17} />
            )}

          </div>


          {/* NAME + STATUS */}

          <div className="min-w-0">

            <h2
              className={`
                truncate
                text-sm
                font-semibold
                transition

                ${
                  hasAccess
                    ? `
                      text-slate-100
                      group-hover:text-indigo-400
                    `
                    : `
                      text-slate-400
                    `
                }
              `}
            >
              {projectName}
            </h2>


            {/* STATUS */}

            <div className="mt-1.5 flex items-center gap-2">

              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-2
                  py-0.5
                  text-[10px]
                  font-medium

                  ${currentStatus.badge}
                `}
              >

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-current
                  "
                />

                {status}

              </span>


              {/* ACCESS */}

              {!hasAccess && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    text-[10px]
                    font-medium
                    text-slate-600
                  "
                >
                  <LockKeyhole size={10} />

                  No access
                </span>
              )}

            </div>

          </div>

        </button>


        {/* MORE BUTTON */}

        <button
          type="button"
          disabled={!hasAccess}
          className={`
            shrink-0
            rounded-md
            p-1.5
            transition

            ${
              hasAccess
                ? `
                  text-slate-600
                  hover:bg-slate-800
                  hover:text-slate-300
                `
                : `
                  cursor-default
                  text-slate-800
                `
            }
          `}
        >

          <MoreHorizontal size={17} />

        </button>

      </div>


      {/* =====================================
          DESCRIPTION
      ====================================== */}

      <p
        className={`
          mt-5
          min-h-10
          text-sm
          leading-5

          ${
            hasAccess
              ? "text-slate-400"
              : "text-slate-600"
          }
        `}
      >
        {description}
      </p>


      {/* =====================================
          PROGRESS
      ====================================== */}

      <div className="mt-5">

        <div
          className="
            mb-2
            flex
            items-center
            justify-between
          "
        >

          <span className="text-xs text-slate-500">
            Progress
          </span>

          <span
            className="
              text-xs
              font-medium
              text-slate-300
            "
          >
            {progress}%
          </span>

        </div>


        <div
          className="
            h-1.5
            overflow-hidden
            rounded-full
            bg-slate-800
          "
        >

          <div
            className={`
              h-full
              rounded-full
              transition-all
              duration-500

              ${
                hasAccess
                  ? currentStatus.progress
                  : "bg-slate-700"
              }
            `}
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>


      {/* =====================================
          METADATA
      ====================================== */}

      <div
        className="
          mt-5
          flex
          flex-wrap
          items-center
          gap-x-5
          gap-y-3
        "
      >

        {/* MEMBERS */}

        <div
          className="
            flex
            items-center
            gap-1.5
            text-xs
            text-slate-500
          "
        >

          <Users
            size={14}
            className="
              text-indigo-400/70
            "
          />

          <span>
            {memberCount}{" "}
            {memberCount === 1
              ? "member"
              : "members"}
          </span>

        </div>


        {/* DATE */}

        <div
          className="
            flex
            items-center
            gap-1.5
            text-xs
            text-slate-500
          "
        >

          <CalendarDays
            size={14}
            className="
              text-indigo-400/70
            "
          />

          <span>
            {dueDate}
          </span>

        </div>

      </div>


      {/* =====================================
          PRIORITY
      ====================================== */}

      <div className="mt-4">

        <span
          className={`
            inline-flex
            rounded-full
            border
            px-2
            py-1
            text-[10px]
            font-medium

            ${currentPriority}
          `}
        >
          {priority} priority
        </span>

      </div>


      {/* =====================================
          FOOTER
      ====================================== */}

      <div
        className="
          mt-5
          border-t
          border-slate-800
          pt-4
        "
      >

        {hasAccess ? (

          <button
            type="button"
            onClick={handleOpen}
            className="
              inline-flex
              items-center
              gap-1.5
              text-xs
              font-medium
              text-indigo-400
              transition

              hover:text-indigo-300
            "
          >

            Open project

            <ArrowRight
              size={14}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
            />

          </button>

        ) : (

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-600
            "
          >

            <LockKeyhole size={13} />

            <span>
              You are not a member of this project
            </span>

          </div>

        )}

      </div>

    </div>
  );
};

export default ProjectCard;