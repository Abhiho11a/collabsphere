import {
  Building2,
  Users,
  FolderKanban,
  FileText,
  FolderOpen,
  MessageSquare,
  Activity,
  ArrowRight,
  Plus,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  FilePlus2,
  FolderPlus,
  MessageCircle,
  Settings2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const WorkspaceDetails = () => {

  const navigate = useNavigate();

  const { workspaceId } = useParams();


  // =====================================================
  // STATE
  // =====================================================

  const [workspace, setWorkspace] =
    useState(null);

  const [projects, setProjects] =
    useState([]);

  const [members, setMembers] =
    useState([]);

  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [summary, setSummary] =
  useState({
    projectCount: 0,
    memberCount: 0,
    taskCount: 0,
    completedTaskCount: 0,
    remainingTaskCount: 0,
    progress: 0,
  });


  // =====================================================
  // FETCH WORKSPACE
  // =====================================================

  const fetchWorkspace = async () => {

    const response =
      await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      );


    let data;


    if (
      contentType?.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      throw new Error(
        "Server returned an unexpected response."
      );

    }


    if (!response.ok) {

      throw new Error(
        data?.message ||
        "Unable to fetch workspace."
      );

    }


    return data?.workspace || data?.data;

  };

  // =====================================================
// FETCH WORKSPACE SUMMARY
// =====================================================

const fetchSummary = async () => {
  const response =
    await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/summary`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );

  const contentType =
    response.headers.get("content-type");

  let data;

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    data = await response.json();
  } else {
    throw new Error(
      "Server returned an unexpected summary response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to fetch workspace summary."
    );
  }

  return (
    data?.summary || {
      projectCount: 0,
      memberCount: 0,
      taskCount: 0,
      completedTaskCount: 0,
      remainingTaskCount: 0,
      progress: 0,
    }
  );
};


  // =====================================================
  // FETCH PROJECTS
  // =====================================================

  const fetchProjects = async () => {

    const response =
      await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      );


    let data;


    if (
      contentType?.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      throw new Error(
        "Server returned an unexpected response."
      );

    }


    if (!response.ok) {

      throw new Error(
        data?.message ||
        "Unable to fetch projects."
      );

    }


    return (
      data?.projects ||
      data?.data ||
      []
    );

  };


  // =====================================================
  // FETCH MEMBERS
  // =====================================================

  const fetchMembers = async () => {

    const response =
      await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/members`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      );


    let data;


    if (
      contentType?.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      throw new Error(
        "Server returned an unexpected response."
      );

    }


    if (!response.ok) {

      throw new Error(
        data?.message ||
        "Unable to fetch workspace members."
      );

    }


    return (
      data?.members ||
      data?.data ||
      []
    );

  };


  // =====================================================
  // FETCH ACTIVITY
  // =====================================================

  const fetchActivity = async () => {

    try {

      const response =
        await fetch(
          `${API_BASE_URL}/workspaces/${workspaceId}/activity`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );


      const contentType =
        response.headers.get(
          "content-type"
        );


      if (
        !contentType?.includes(
          "application/json"
        )
      ) {

        return [];

      }


      const data =
        await response.json();


      if (!response.ok) {

        console.warn(
          "Activity request failed:",
          data?.message
        );

        return [];

      }


      return (
        data?.activities ||
        data?.data ||
        []
      );

    } catch (error) {

      console.warn(
        "Unable to fetch workspace activity:",
        error
      );

      return [];

    }

  };


  // =====================================================
  // LOAD ALL WORKSPACE DATA
  // =====================================================

  const loadWorkspaceData = async () => {

    try {

      setLoading(true);
      setError("");


      const [
        workspaceData,
        projectsData,
        membersData,
        activityData,
        summaryData
      ] = await Promise.all([

        fetchWorkspace(),

        fetchProjects(),

        fetchMembers(),

        fetchActivity(),

        fetchSummary()

      ]);


      setWorkspace(
        workspaceData
      );

      setProjects(
        projectsData
      );

      setMembers(
        membersData
      );

      setActivities(
        activityData
      );

      setSummary(summaryData)


    } catch (error) {

      console.error(
        "Workspace details error:",
        error
      );


      setError(
        error.message ||
        "Unable to load workspace."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // LOAD ON PAGE OPEN
  // =====================================================

  useEffect(() => {

    if (!workspaceId) {
      return;
    }

    loadWorkspaceData();

  }, [workspaceId]);


  // =====================================================
  // QUICK ACCESS
  // =====================================================

  const quickLinks = [

    {
      label: "Projects",
      description:
        "Manage workspace projects",
      icon: FolderKanban,
      path:
        `/workspaces/${workspaceId}/projects`,
    },

    {
      label: "Documents",
      description:
        "Collaborate on documents",
      icon: FileText,
      path:
        `/workspaces/${workspaceId}/documents`,
    },

    {
      label: "Files",
      description:
        "Shared workspace files",
      icon: FolderOpen,
      path:
        `/workspaces/${workspaceId}/files`,
    },

    {
      label: "Chat",
      description:
        "Communicate with your team",
      icon: MessageSquare,
      path:
        `/workspaces/${workspaceId}/chat`,
    },

  ];


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="animate-pulse">

          <div className="flex items-center gap-4">

            <div className="h-14 w-14 rounded-xl bg-slate-800" />

            <div>

              <div className="h-7 w-56 rounded bg-slate-800" />

              <div className="mt-3 h-4 w-80 rounded bg-slate-800" />

            </div>

          </div>


          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="
                    h-32
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900/40
                  "
                />

              )
            )}

          </div>


          <div className="mt-6 h-96 rounded-xl border border-slate-800 bg-slate-900/40" />

        </div>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error || !workspace) {

    return (

      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-center">

            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-red-500/10
              "
            >

              <AlertCircle
                size={25}
                className="text-red-400"
              />

            </div>


            <h2 className="mt-5 text-lg font-semibold text-white">
              Unable to load workspace
            </h2>


            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "Workspace could not be found."}
            </p>


            <button
              type="button"
              onClick={
                loadWorkspaceData
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-indigo-500
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-indigo-400
              "
            >

              <RefreshCw size={15} />

              Try again

            </button>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // REAL COUNTS
  // =====================================================

  const projectCount =
  summary.projectCount;

  const memberCount =
    summary.memberCount;

  const taskCount =
    summary.taskCount;

  const completedTaskCount =
    summary.completedTaskCount;

  const remainingTaskCount =
    summary.remainingTaskCount;

  const workspaceProgress =
    summary.progress;


  const documentCount =
    workspace.documentCount ??
    workspace.documentsCount ??
    workspace.documents?.length ??
    0;


  // =====================================================
  // ACTIVITY FORMATTER
  // =====================================================

  const getActivityIcon = (
    activity
  ) => {

    const type =
      String(
        activity?.type ||
        activity?.action ||
        activity?.event ||
        ""
      ).toLowerCase();


    if (
      type.includes("member") ||
      type.includes("user") ||
      type.includes("join")
    ) {

      return UserPlus;

    }


    if (
      type.includes("project")
    ) {

      return FolderPlus;

    }


    if (
      type.includes("document")
    ) {

      return FilePlus2;

    }


    if (
      type.includes("message") ||
      type.includes("chat")
    ) {

      return MessageCircle;

    }


    if (
      type.includes("setting") ||
      type.includes("update")
    ) {

      return Settings2;

    }


    if (
      type.includes("complete") ||
      type.includes("done")
    ) {

      return CheckCircle2;

    }


    return Activity;

  };


  const getActivityText = (
    activity
  ) => {

    /*
      Support several possible backend
      activity structures.

      Examples:

      {
        action: "created_project",
        user: { name: "Abhishek" },
        metadata: { projectName: "Website" }
      }

      OR

      {
        type: "member_added",
        description: "mem1 joined the workspace"
      }

      OR

      {
        action: "created",
        entity: "project",
        entityName: "Website"
      }
    */


    if (
      activity?.description
    ) {

      return activity.description;

    }


    const actor =
      activity?.user?.name ||
      activity?.createdBy?.name ||
      activity?.actor?.name ||
      activity?.userName ||
      "Someone";


    const action =
      String(
        activity?.action ||
        activity?.type ||
        activity?.event ||
        ""
      ).toLowerCase();


    const entityName =
      activity?.entityName ||
      activity?.metadata?.name ||
      activity?.metadata?.projectName ||
      activity?.metadata?.memberName ||
      activity?.name ||
      "";


    if (
      action.includes("project") &&
      (
        action.includes("create") ||
        action.includes("add")
      )
    ) {

      return (
        `${actor} created project` +
        (
          entityName
            ? ` "${entityName}"`
            : ""
        )
      );

    }


    if (
      action.includes("member") &&
      (
        action.includes("add") ||
        action.includes("invite") ||
        action.includes("join")
      )
    ) {

      return (
        `${actor} added a new member` +
        (
          entityName
            ? ` "${entityName}"`
            : ""
        )
      );

    }


    if (
      action.includes("document")
    ) {

      return (
        `${actor} updated a document` +
        (
          entityName
            ? ` "${entityName}"`
            : ""
        )
      );

    }


    if (
      action.includes("task")
    ) {

      return (
        `${actor} updated a task` +
        (
          entityName
            ? ` "${entityName}"`
            : ""
        )
      );

    }


    if (action) {

      return (
        `${actor} ${action.replace(
          /_/g,
          " "
        )}` +
        (
          entityName
            ? ` "${entityName}"`
            : ""
        )
      );

    }


    return "Workspace activity";

  };


  const getActivityTime = (
    activity
  ) => {

    const date =
      activity?.createdAt ||
      activity?.updatedAt ||
      activity?.timestamp;


    if (!date) {
      return "";
    }


    const activityDate =
      new Date(date);


    if (
      Number.isNaN(
        activityDate.getTime()
      )
    ) {

      return "";

    }


    return activityDate.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );

  };


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">


      {/* =================================================
          WORKSPACE HEADER
      ================================================== */}

      <section className="mb-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-500/10
              "
            >

              <Building2
                size={25}
                className="text-indigo-400"
              />

            </div>


            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {workspace.name}
                </h1>


                {workspace.owner && (

                  <span
                    className="
                      rounded-full
                      bg-indigo-500/10
                      px-2.5
                      py-1
                      text-[10px]
                      font-medium
                      text-indigo-400
                    "
                  >
                    Owner
                  </span>

                )}

              </div>


              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {workspace.description ||
                  "No workspace description provided."}
              </p>


              <p className="mt-2 text-xs text-slate-600">
                {memberCount}{" "}
                {memberCount === 1
                  ? "member"
                  : "members"}{" "}
                ·{" "}
                {projectCount}{" "}
                {projectCount === 1
                  ? "project"
                  : "projects"}
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/members`
                )
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-slate-700
                px-4
                py-2.5
                text-sm
                font-medium
                text-slate-300
                transition
                hover:bg-slate-800
              "
            >

              <Users size={16} />

              Members

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects`
                )
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-indigo-500
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-indigo-400
              "
            >

              <Plus size={17} />

              New Project

            </button>

          </div>

        </div>

      </section>


      {/* =================================================
          WORKSPACE STATISTICS
      ================================================== */}

      <section
        className="
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-3
        "
      >

        {/* PROJECTS */}

        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={projectCount}
          subtitle={
            projectCount === 1
              ? "Active workspace project"
              : "Workspace projects"
          }
          iconClass="text-blue-400"
          iconBg="bg-blue-500/10"
        />

        <StatCard
          icon={Users}
          label="Members"
          value={memberCount}
          subtitle={
            memberCount === 1
              ? "Workspace member"
              : "People in this workspace"
          }
          iconClass="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />


        {/* DOCUMENTS */}

        <StatCard
          icon={FileText}
          label="Documents"
          value={documentCount}
          subtitle={
            documentCount === 1
              ? "Workspace document"
              : "Shared workspace documents"
          }
          iconClass="text-purple-400"
          iconBg="bg-purple-500/10"
        />

      </section>


      {/* =================================================
          PROJECTS + ACTIVITY
      ================================================== */}

      <section
        className="
          mt-6
          grid
          gap-6
          xl:grid-cols-[1.5fr_1fr]
        "
      >


        {/* =================================================
            PROJECTS
        ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-slate-800
            bg-slate-900/40
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-800
              px-5
              py-4
            "
          >

            <div>

              <h2 className="font-semibold text-white">
                Active Projects
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Projects in this workspace
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects`
                )
              }
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

              View all

              <ArrowRight size={13} />

            </button>

          </div>


          {projects.length > 0 ? (

            <div className="divide-y divide-slate-800">

              {projects
                .slice(0, 5)
                .map((project) => {

                  const normalizedStatus =
                    String(
                      project.status ||
                      "Planning"
                    ).toLowerCase();


                  let progress = 0;

                  if (
                    normalizedStatus ===
                    "completed"
                  ) {

                    progress = 100;

                  } else if (
                    normalizedStatus ===
                    "in progress" ||
                    normalizedStatus ===
                    "in-progress"
                  ) {

                    progress = 50;

                  } else if (
                    normalizedStatus ===
                    "planning"
                  ) {

                    progress = 20;

                  }


                  return (

                    <button
                      key={
                        project._id ||
                        project.id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          `/workspaces/${workspaceId}/projects/${
                            project._id ||
                            project.id
                          }`
                        )
                      }
                      className="
                        w-full
                        p-5
                        text-left
                        transition
                        hover:bg-slate-900/70
                      "
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex min-w-0 items-start gap-3">

                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              bg-blue-500/10
                            "
                          >

                            <FolderKanban
                              size={16}
                              className="text-blue-400"
                            />

                          </div>


                          <div className="min-w-0">

                            <h3 className="truncate text-sm font-semibold text-slate-200">
                              {project.name}
                            </h3>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {project.description ||
                                "No description provided."}
                            </p>

                          </div>

                        </div>


                        <ArrowRight
                          size={16}
                          className="
                            shrink-0
                            text-slate-600
                            transition
                            group-hover:text-slate-400
                          "
                        />

                      </div>


                      {/* STATUS */}

                      <div className="mt-4 flex items-center justify-between">

                        <span className="text-xs text-slate-500">
                          {project.status ||
                            "Planning"}
                        </span>

                        <span className="text-xs font-medium text-slate-300">
                          {progress}%
                        </span>

                      </div>


                      {/* PROGRESS */}

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">

                        <div
                          className={`
                            h-full
                            rounded-full
                            ${
                              progress === 100
                                ? "bg-emerald-500"
                                : "bg-indigo-500"
                            }
                          `}
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />

                      </div>


                      {/* META */}

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">

                        {project.priority && (

                          <span>
                            {project.priority}{" "}
                            priority
                          </span>

                        )}


                        {project.dueDate && (

                          <span className="flex items-center gap-1">

                            <CalendarDays
                              size={12}
                            />

                            {new Date(
                              project.dueDate
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}

                          </span>

                        )}

                      </div>

                    </button>

                  );

                })}

            </div>

          ) : (

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                px-5
                py-16
                text-center
              "
            >

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                "
              >

                <FolderKanban
                  size={21}
                  className="text-slate-500"
                />

              </div>


              <h3 className="mt-4 text-sm font-semibold text-slate-200">
                No projects yet
              </h3>


              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Create your first project to
                start organizing work in this
                workspace.
              </p>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/workspaces/${workspaceId}/projects`
                  )
                }
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-indigo-500
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-white
                  hover:bg-indigo-400
                "
              >

                <Plus size={14} />

                Create project

              </button>

            </div>

          )}

        </div>


        {/* =================================================
            WORKSPACE ACTIVITY
        ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-slate-800
            bg-slate-900/40
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-800
              px-5
              py-4
            "
          >

            <div>

              <h2 className="font-semibold text-white">
                Workspace Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Recent activity across this workspace
              </p>

            </div>


            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-indigo-500/10
              "
            >

              <Activity
                size={17}
                className="text-indigo-400"
              />

            </div>

          </div>


          {activities.length > 0 ? (

            <div className="divide-y divide-slate-800">

              {activities
                .slice(0, 8)
                .map(
                  (
                    activity,
                    index
                  ) => {

                    const Icon =
                      getActivityIcon(
                        activity
                      );


                    return (

                      <div
                        key={
                          activity._id ||
                          activity.id ||
                          index
                        }
                        className="
                          flex
                          items-start
                          gap-3
                          px-5
                          py-4
                          transition
                          hover:bg-slate-900/70
                        "
                      >

                        {/* ICON */}

                        <div
                          className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-indigo-500/10
                            text-indigo-400
                          "
                        >

                          <Icon
                            size={16}
                          />

                        </div>


                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <p className="text-xs leading-5 text-slate-300">

                            {getActivityText(
                              activity
                            )}

                          </p>


                          <div className="mt-1 flex items-center gap-2">

                            <Clock3
                              size={11}
                              className="text-slate-600"
                            />

                            <span className="text-[11px] text-slate-600">
                              {getActivityTime(
                                activity
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

            </div>

          ) : (

            <div
              className="
                flex
                min-h-[300px]
                flex-col
                items-center
                justify-center
                px-5
                text-center
              "
            >

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                "
              >

                <Activity
                  size={21}
                  className="text-slate-600"
                />

              </div>


              <h3 className="mt-4 text-sm font-medium text-slate-300">
                No activity yet
              </h3>


              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">
                Workspace activity will appear
                here as your team creates projects,
                adds members, and updates content.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* =================================================
          QUICK ACCESS
      ================================================== */}

      <section className="mt-6">

        <div className="mb-4">

          <h2 className="font-semibold text-white">
            Workspace
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Quickly access workspace features
          </p>

        </div>


        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >

          {quickLinks.map(
            (item) => {

              const Icon =
                item.icon;


              return (

                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    navigate(
                      item.path
                    )
                  }
                  className="
                    group
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900/40
                    p-4
                    text-left
                    transition
                    hover:border-slate-700
                    hover:bg-slate-900/70
                  "
                >

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-indigo-500/10
                    "
                  >

                    <Icon
                      size={18}
                      className="text-indigo-400"
                    />

                  </div>


                  <div className="min-w-0 flex-1">

                    <h3 className="text-sm font-medium text-slate-200">
                      {item.label}
                    </h3>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.description}
                    </p>

                  </div>


                  <ArrowRight
                    size={15}
                    className="
                      text-slate-600
                      transition
                      group-hover:translate-x-0.5
                      group-hover:text-slate-400
                    "
                  />

                </button>

              );

            }
          )}

        </div>

      </section>


    </div>

  );

};


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  iconClass,
  iconBg,
}) => {

  return (

    <div
      className="
        group
        relative
        overflow-hidden
        rounded-xl
        border
        border-slate-800
        bg-slate-900/50
        p-5
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-slate-700
        hover:bg-slate-900/80
      "
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {subtitle}
          </p>

        </div>


        <div
          className={`
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            ${iconBg}
            transition-transform
            duration-300
            group-hover:scale-105
          `}
        >

          <Icon
            size={21}
            className={iconClass}
          />

        </div>

      </div>

    </div>

  );

};


export default WorkspaceDetails;