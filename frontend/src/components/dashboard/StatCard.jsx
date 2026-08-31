import {
  FolderKanban,
  ListTodo,
  Users,
  CircleCheck,
  ArrowUpRight,
} from "lucide-react";

const ICONS = {
  projects: FolderKanban,
  tasks: ListTodo,
  members: Users,
  completed: CircleCheck,
};

const COLOR_CONFIG = {
  projects: {
    icon: "text-blue-400",
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/20",
    glow: "group-hover:shadow-blue-500/10",
    accent: "text-blue-400",
  },

  tasks: {
    icon: "text-orange-400",
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/20",
    glow: "group-hover:shadow-orange-500/10",
    accent: "text-orange-400",
  },

  members: {
    icon: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    iconBorder: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
    accent: "text-emerald-400",
  },

  completed: {
    icon: "text-purple-400",
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/20",
    glow: "group-hover:shadow-purple-500/10",
    accent: "text-purple-400",
  },
};

const StatCard = ({
  title,
  value,
  icon,
}) => {
  const Icon = ICONS[icon] || FolderKanban;

  const colors =
    COLOR_CONFIG[icon] ||
    COLOR_CONFIG.projects;

  const subtitles = {
    projects: "Live projects",
    tasks: "Awaiting completion",
    members: "Across workspaces",
    completed: "Finished tasks",
  };

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-xl
        border border-slate-800
        bg-slate-900/50
        p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:border-slate-700
        hover:bg-slate-900/80
        hover:shadow-xl
        ${colors.glow}
      `}
    >
      {/* Subtle background glow */}

      <div
        className={`
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-24
          w-24
          rounded-full
          blur-3xl
          opacity-10
          transition-opacity
          group-hover:opacity-20
          ${colors.iconBg}
        `}
      />


      {/* Top section */}

      <div className="relative flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>

        </div>


        {/* Icon */}

        <div
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            ${colors.iconBg}
            ${colors.iconBorder}
            transition-transform
            duration-300
            group-hover:scale-105
          `}
        >

          <Icon
            size={23}
            strokeWidth={1.8}
            className={colors.icon}
          />

        </div>

      </div>


      {/* Bottom */}

      <div className="mt-5 flex items-center justify-between">

        <p className="text-xs text-slate-500">
          {subtitles[icon]}
        </p>

        <div
          className={`
            flex
            items-center
            gap-1
            text-[11px]
            font-medium
            ${colors.accent}
            opacity-0
            transition-opacity
            duration-300
            group-hover:opacity-100
          `}
        >

          <span>
            View
          </span>

          <ArrowUpRight
            size={12}
          />

        </div>

      </div>

    </div>
  );
};

export default StatCard;