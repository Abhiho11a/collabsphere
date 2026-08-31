import {
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import { Link } from "react-router-dom";


const UpcomingDeadlines = ({
  deadlines = [],
}) => {

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <h2 className="text-sm font-semibold text-white">
            Upcoming deadlines
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Tasks that need your attention
          </p>

        </div>


        <CalendarDays
          size={17}
          className="text-slate-600"
        />

      </div>


      {/* ==========================================
          CONTENT
      ========================================== */}

      {deadlines.length === 0 ? (

        <div className="flex min-h-[230px] flex-col items-center justify-center px-6 text-center">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 text-slate-500">
            <CalendarDays size={21} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-300">
            No upcoming deadlines
          </p>

          <p className="mt-1 text-xs text-slate-500">
            You're all caught up.
          </p>

        </div>

      ) : (

        <div>

          {deadlines.map((task) => {

            const taskId =
              task._id ||
              task.id;

            const workspaceId =
              task.workspaceId ||
              task.workspace?._id ||
              task.workspace?.id;

            const projectId =
              task.projectId ||
              task.project?._id ||
              task.project?.id;


            return (
              <Link
                key={taskId}
                to={
                  workspaceId &&
                  projectId &&
                  taskId
                    ? `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
                    : "#"
                }
                className="group block border-b border-slate-800/80 p-5 transition hover:bg-slate-900/80 last:border-b-0"
              >

                <div className="flex items-start gap-3">

                  {/* ICON */}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                    <CalendarDays size={18} />

                  </div>


                  {/* TASK */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="truncate text-sm font-semibold text-white">
                        {task.title || "Untitled task"}
                      </h3>


                      <PriorityBadge
                        priority={task.priority}
                      />

                    </div>


                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                      <span>
                        {formatDate(task.dueDate)}
                      </span>

                      <span className="text-slate-700">
                        •
                      </span>

                      <span>
                        {getRemainingText(task.dueDate)}
                      </span>

                    </div>

                  </div>


                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-indigo-400"
                  />

                </div>

              </Link>
            );

          })}

        </div>

      )}

    </section>
  );
};


const PriorityBadge = ({
  priority,
}) => {

  if (!priority) {
    return null;
  }

  return (
    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
      {priority}
    </span>
  );
};


const formatDate = (date) => {

  if (!date) {
    return "No due date";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "Invalid date";
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};


const getRemainingText = (date) => {

  if (!date) {
    return "";
  }

  const target =
    new Date(date);

  const now =
    new Date();

  const difference =
    target.getTime() -
    now.getTime();

  const days =
    Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    );


  if (days < 0) {
    return "Overdue";
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "1 day remaining";
  }

  return `${days} days remaining`;
};


export default UpcomingDeadlines;