import {
  Activity,
  CheckCircle2,
  CirclePlus,
  FileText,
  FolderKanban,
  MessageSquare,
  UserPlus,
} from "lucide-react";


// =====================================================
// HELPERS
// =====================================================

const getActivityIcon = (type) => {
  switch (type) {
    case "task_created":
      return CirclePlus;

    case "task_completed":
      return CheckCircle2;

    case "project_created":
      return FolderKanban;

    case "document_created":
      return FileText;

    case "comment_added":
      return MessageSquare;

    case "member_added":
      return UserPlus;

    default:
      return Activity;
  }
};


const getActivityText = (activity) => {
  /*
    Supports common backend activity formats.

    Example:

    {
      type: "task_created",
      user: {
        name: "Abhishek"
      },
      task: {
        title: "Create login page"
      }
    }
  */

  const userName =
    activity.user?.name ||
    activity.createdBy?.name ||
    "Someone";

  const targetName =
    activity.task?.title ||
    activity.project?.name ||
    activity.document?.title ||
    activity.targetName ||
    "";


  switch (activity.type) {
    case "task_created":
      return (
        <>
          <span className="font-medium text-slate-300">
            {userName}
          </span>{" "}
          created task{" "}
          <span className="font-medium text-slate-200">
            {targetName}
          </span>
        </>
      );


    case "task_completed":
      return (
        <>
          <span className="font-medium text-slate-300">
            {userName}
          </span>{" "}
          completed task{" "}
          <span className="font-medium text-slate-200">
            {targetName}
          </span>
        </>
      );


    case "project_created":
      return (
        <>
          <span className="font-medium text-slate-300">
            {userName}
          </span>{" "}
          created project{" "}
          <span className="font-medium text-slate-200">
            {targetName}
          </span>
        </>
      );


    case "document_created":
      return (
        <>
          <span className="font-medium text-slate-300">
            {userName}
          </span>{" "}
          created document{" "}
          <span className="font-medium text-slate-200">
            {targetName}
          </span>
        </>
      );


    case "comment_added":
      return (
        <>
          <span className="font-medium text-slate-300">
            {userName}
          </span>{" "}
          added a comment
        </>
      );


    case "member_added":
      return (
        <>
          <span className="font-medium text-slate-300">
            {userName}
          </span>{" "}
          added a new member
        </>
      );


    default:
      return (
        <span className="font-medium text-slate-300">
          {activity.message || "Activity occurred"}
        </span>
      );
  }
};


const formatActivityTime = (date) => {
  if (!date) {
    return "";
  }

  const activityDate = new Date(date);

  if (Number.isNaN(activityDate.getTime())) {
    return "";
  }

  const now = new Date();

  const difference =
    now.getTime() - activityDate.getTime();

  const seconds =
    Math.floor(difference / 1000);

  const minutes =
    Math.floor(seconds / 60);

  const hours =
    Math.floor(minutes / 60);

  const days =
    Math.floor(hours / 24);


  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }


  return activityDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};


// =====================================================
// COMPONENT
// =====================================================

const RecentActivity = ({
  activities = [],
}) => {

  // ---------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------

  if (!activities.length) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/40">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

          <div>

            <h2 className="text-sm font-semibold text-slate-100">
              Recent activity
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest activity across your workspace
            </p>

          </div>


          <Activity
            size={18}
            className="text-slate-600"
          />

        </div>


        {/* EMPTY */}

        <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">

            <Activity
              size={18}
              className="text-slate-600"
            />

          </div>


          <p className="mt-3 text-sm font-medium text-slate-300">
            No recent activity
          </p>


          <p className="mt-1 text-xs text-slate-500">
            Activity will appear here as your team works.
          </p>

        </div>

      </section>
    );
  }


  // ---------------------------------------------------
  // ACTIVITY LIST
  // ---------------------------------------------------

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <h2 className="text-sm font-semibold text-slate-100">
            Recent activity
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Latest activity across your workspace
          </p>

        </div>


        <Activity
          size={18}
          className="text-slate-600"
        />

      </div>


      {/* LIST */}

      <div className="divide-y divide-slate-800">

        {activities.map((activity, index) => {

          const Icon =
            getActivityIcon(activity.type);

          const activityId =
            activity._id ||
            activity.id ||
            `${activity.type}-${index}`;

          const activityDate =
            activity.createdAt ||
            activity.updatedAt ||
            activity.date;


          return (
            <div
              key={activityId}
              className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-900/70"
            >

              {/* ICON */}

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">

                <Icon
                  size={15}
                  className="text-indigo-400"
                />

              </div>


              {/* CONTENT */}

              <div className="min-w-0 flex-1">

                <p className="text-sm leading-5 text-slate-400">
                  {getActivityText(activity)}
                </p>


                <p className="mt-1 text-xs text-slate-600">
                  {formatActivityTime(activityDate)}
                </p>

              </div>

            </div>
          );

        })}

      </div>

    </section>
  );
};


export default RecentActivity;