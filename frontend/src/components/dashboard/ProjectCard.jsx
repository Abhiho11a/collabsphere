import {
  ArrowUpRight,
  Users,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";


const ProjectCard = ({
  project,
}) => {

  const navigate =
    useNavigate();


  const projectId =
    project._id ||
    project.id;


  const tasks =
    project.tasks || [];


  const completed =
    tasks.filter(
      (task) =>
        task.status === "done" ||
        task.status === "completed"
    ).length;


  const progress =
    tasks.length
      ? Math.round(
          (completed / tasks.length) *
          100
        )
      : Number(
          project.progress || 0
        );


  return (

    <div
      onClick={() =>
        navigate(
          `/workspaces/${project.workspaceId}/projects/${projectId}`
        )
      }
      className="cursor-pointer p-5 transition hover:bg-slate-50"
    >

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <h3 className="font-medium text-slate-900">
            {project.name}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {project.description ||
              "No description"}
          </p>

        </div>


        <ArrowUpRight
          size={17}
          className="shrink-0 text-slate-400"
        />

      </div>


      <div className="mt-5">

        <div className="mb-2 flex justify-between text-xs">

          <span className="text-slate-500">
            Progress
          </span>

          <span className="font-medium text-slate-700">
            {progress}%
          </span>

        </div>


        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

          <div
            className="h-full rounded-full bg-indigo-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>


      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">

        <span>
          {tasks.length} tasks
        </span>

        <span className="flex items-center gap-1">

          <Users size={13} />

          {project.memberCount ||
            project.members?.length ||
            0}

        </span>

      </div>

    </div>

  );

};


export default ProjectCard;