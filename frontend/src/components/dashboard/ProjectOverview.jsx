import {
  ArrowUpRight,
  Users,
  ListChecks,
  FolderKanban,
} from "lucide-react";

import { Link } from "react-router-dom";


const ProjectOverview = ({
  projects = [],
}) => {

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <h2 className="text-sm font-semibold text-white">
            Projects
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Current workspace projects
          </p>

        </div>


        <Link
          to="/projects"
          className="hidden items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-white sm:flex"
        >
          View all projects

          <ArrowUpRight size={14} />

        </Link>

      </div>


      {/* ==========================================
          PROJECT LIST
      ========================================== */}

      <div>

        {projects.length === 0 ? (

          <div className="flex min-h-[230px] flex-col items-center justify-center px-6 text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 text-slate-500">
              <FolderKanban size={21} />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-300">
              No projects yet
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Projects created in your workspaces will appear here.
            </p>

          </div>

        ) : (

          <div>

            {projects.map((project) => {

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

              const description =
                project.description ||
                "No description";

              const taskCount =
                project.taskCount ??
                project.tasks?.length ??
                0;

              const memberCount =
                project.memberCount ??
                project.members?.length ??
                0;

              const progress =
                project.progress ??
                calculateProgress(project);


              return (
                <Link
                  key={projectId}
                  to={
                    workspaceId && projectId
                      ? `/workspaces/${workspaceId}/projects/${projectId}`
                      : "/projects"
                  }
                  className="group block border-b border-slate-800/80 p-5 transition hover:bg-slate-900/80 last:border-b-0"
                >

                  {/* PROJECT TOP */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-400">
                        {getInitials(projectName)}
                      </div>


                      <div className="min-w-0">

                        <h3 className="truncate text-sm font-semibold text-white">
                          {projectName}
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {description}
                        </p>

                      </div>

                    </div>


                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-slate-600 transition group-hover:text-indigo-400"
                    />

                  </div>


                  {/* PROGRESS */}

                  <div className="mt-5">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-xs text-slate-500">
                        Progress
                      </span>

                      <span className="text-xs font-medium text-slate-300">
                        {progress}%
                      </span>

                    </div>


                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* FOOTER */}

                  <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">

                    <span className="flex items-center gap-1.5">

                      <ListChecks size={14} />

                      {taskCount} tasks

                    </span>


                    <span className="flex items-center gap-1.5">

                      <Users size={14} />

                      {memberCount} members

                    </span>

                  </div>

                </Link>
              );

            })}

          </div>

        )}

      </div>

    </section>
  );
};


const calculateProgress = (project) => {

  const tasks =
    project.tasks || [];

  if (!tasks.length) {
    return 0;
  }

  const completed =
    tasks.filter(
      (task) =>
        ["done", "completed"].includes(
          String(task.status).toLowerCase()
        )
    ).length;

  return Math.round(
    (completed / tasks.length) * 100
  );
};


const getInitials = (name) => {

  if (!name) {
    return "P";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");
};


export default ProjectOverview;