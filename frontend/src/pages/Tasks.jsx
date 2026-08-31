import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  FolderKanban,
  Loader2,
  RotateCw,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import TaskDetailsModal from "../components/tasks/TaskDetailsModal";

import {
  getMyTasks,
  updateTaskStatus,
} from "../services/tasks";


// =====================================================
// MAIN COMPONENT
// =====================================================

const Tasks = () => {

  // =====================================================
  // TASK DATA
  // =====================================================

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingTaskId, setUpdatingTaskId] =
    useState(null);


  // =====================================================
  // SEARCH
  // =====================================================

  const [searchQuery, setSearchQuery] =
    useState("");


  // =====================================================
  // FILTERS
  // =====================================================

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState("all");


  // =====================================================
  // FILTER DROPDOWN
  // =====================================================

  const [filtersOpen, setFiltersOpen] =
    useState(false);


  // =====================================================
  // SELECTED TASK
  // =====================================================

  const [selectedTask, setSelectedTask] =
    useState(null);


  // =====================================================
  // STATUS TAB
  // =====================================================

  const [activeTab, setActiveTab] =
    useState("all");


  // =====================================================
  // STATUS CONFIG
  // =====================================================

  const statusConfig = {

    todo: {
      label: "To Do",
      icon: CheckCircle2,
      className:
        "bg-slate-800/80 text-slate-300 border border-slate-700",
    },

    "in-progress": {
      label: "In Progress",
      icon: Clock3,
      className:
        "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    },

    review: {
      label: "In Review",
      icon: Send,
      className:
        "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },

    done: {
      label: "Done",
      icon: CheckCircle2,
      className:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },

  };


  // =====================================================
  // PRIORITY CONFIG
  // =====================================================

  const priorityConfig = {

    High:
      "bg-red-500/10 text-red-400 border border-red-500/20",

    Medium:
      "bg-amber-500/10 text-amber-400 border border-amber-500/20",

    Low:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20",

  };


  // =====================================================
  // LOAD MY TASKS
  // =====================================================

  useEffect(() => {
    loadMyTasks();
  }, []);


  const loadMyTasks = async () => {

    try {

      setLoading(true);
      setError("");

      const data = await getMyTasks();

      if (data.success) {

        setTasks(data.tasks || []);

      } else {

        throw new Error(
          data.message || "Unable to load tasks"
        );

      }

    } catch (error) {

      console.error(
        "Load my tasks error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load tasks"
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // FILTER TASKS
  // =====================================================

  const filteredTasks = useMemo(() => {

    return tasks.filter((task) => {

      const query =
        searchQuery.trim().toLowerCase();


      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      const matchesSearch =
        !query ||

        task.title
          ?.toLowerCase()
          .includes(query) ||

        task.description
          ?.toLowerCase()
          .includes(query) ||

        task.createdBy?.name
          ?.toLowerCase()
          .includes(query) ||

        task.project?.name
          ?.toLowerCase()
          .includes(query) ||

        task.workspace?.name
          ?.toLowerCase()
          .includes(query);


      // -------------------------------------------------
      // STATUS TAB
      // -------------------------------------------------

      const matchesTab =
        activeTab === "all" ||
        task.status === activeTab;


      // -------------------------------------------------
      // STATUS FILTER
      // -------------------------------------------------

      const matchesStatus =
        statusFilter === "all" ||
        task.status === statusFilter;


      // -------------------------------------------------
      // PRIORITY FILTER
      // -------------------------------------------------

      const matchesPriority =
        priorityFilter === "all" ||
        task.priority === priorityFilter;


      return (
        matchesSearch &&
        matchesTab &&
        matchesStatus &&
        matchesPriority
      );

    });

  }, [
    tasks,
    searchQuery,
    activeTab,
    statusFilter,
    priorityFilter,
  ]);


  // =====================================================
  // STATUS COUNTS
  // =====================================================

  const getCount = (status) => {

    if (status === "all") {
      return tasks.length;
    }

    return tasks.filter(
      (task) => task.status === status
    ).length;

  };


  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {

    setStatusFilter("all");

    setPriorityFilter("all");

    setSearchQuery("");

    setActiveTab("all");

  };


  // =====================================================
  // HANDLE STATUS CHANGE
  // =====================================================

  const handleStatusChange = async (
    task,
    newStatus
  ) => {

    if (!newStatus) {
      return;
    }


    try {

      setUpdatingTaskId(task._id);


      // -------------------------------------------------
      // GET IDS FROM TASK
      // -------------------------------------------------

      const workspaceId =
        task.workspace?._id ||
        task.workspace;

      const projectId =
        task.project?._id ||
        task.project;

      const taskId =
        task._id;


      if (
        !workspaceId ||
        !projectId ||
        !taskId
      ) {

        throw new Error(
          "Task information is incomplete"
        );

      }


      // -------------------------------------------------
      // UPDATE BACKEND
      // -------------------------------------------------

      const data =
        await updateTaskStatus({
          workspaceId,
          projectId,
          taskId,
          status: newStatus,
        });


      if (!data.success) {

        throw new Error(
          data.message ||
          "Unable to update task"
        );

      }


      // -------------------------------------------------
      // UPDATE LOCAL TASK
      // -------------------------------------------------

      setTasks(
        (previousTasks) =>
          previousTasks.map(
            (item) =>
              item._id === taskId
                ? {
                    ...item,
                    ...data.task,
                    status:
                      data.task?.status ||
                      newStatus,
                  }
                : item
          )
      );


      // -------------------------------------------------
      // UPDATE OPEN MODAL
      // -------------------------------------------------

      setSelectedTask(
        (current) => {

          if (!current) {
            return current;
          }

          if (current._id !== taskId) {
            return current;
          }

          return {
            ...current,
            ...data.task,
            status:
              data.task?.status ||
              newStatus,
          };

        }
      );


    } catch (error) {

      console.error(
        "Update task status error:",
        error
      );

      alert(
        error.response?.data?.message ||
        error.message ||
        "Unable to update task"
      );

    } finally {

      setUpdatingTaskId(null);

    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="mb-7">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <p className="text-xs font-medium text-indigo-400">
              My Workspace
            </p>

            <span className="text-slate-700">
              /
            </span>

            <p className="text-xs text-slate-600">
              Personal Task Queue
            </p>

          </div>


          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            My Tasks
          </h1>


          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Tasks assigned to you across all your
            workspaces and projects.
          </p>

        </div>

      </section>


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (

        <div className="flex min-h-[300px] items-center justify-center">

          <div className="flex items-center gap-3 text-sm text-slate-500">

            <Loader2
              size={18}
              className="animate-spin text-indigo-400"
            />

            Loading your tasks...

          </div>

        </div>

      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {!loading && error && (

        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-5">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-medium text-red-400">
                Unable to load tasks
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {error}
              </p>

            </div>


            <button
              type="button"
              onClick={loadMyTasks}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >

              <RotateCw size={13} />

              Retry

            </button>

          </div>

        </div>

      )}


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      {!loading && !error && (

        <>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <section className="mb-5">

            <div className="flex flex-col gap-3 lg:flex-row">

              {/* SEARCH */}

              <div className="relative flex-1">

                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search tasks, projects, workspaces or creators..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-4 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

              </div>


              {/* FILTER */}

              <button
                type="button"
                onClick={() =>
                  setFiltersOpen(!filtersOpen)
                }
                className={`
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  px-4
                  py-3
                  text-xs
                  font-medium
                  transition
                  ${
                    filtersOpen ||
                    statusFilter !== "all" ||
                    priorityFilter !== "all"
                      ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                      : "border-slate-800 bg-slate-950/50 text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                  }
                `}
              >

                <Filter size={14} />

                Filters

              </button>

            </div>


            {/* =================================================
                FILTER PANEL
            ================================================= */}

            {filtersOpen && (

              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* STATUS */}

                  <FilterSelect
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      {
                        value: "all",
                        label: "All statuses",
                      },
                      {
                        value: "todo",
                        label: "To Do",
                      },
                      {
                        value: "in-progress",
                        label: "In Progress",
                      },
                      {
                        value: "review",
                        label: "In Review",
                      },
                      {
                        value: "done",
                        label: "Done",
                      },
                    ]}
                  />


                  {/* PRIORITY */}

                  <FilterSelect
                    label="Priority"
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    options={[
                      {
                        value: "all",
                        label: "All priorities",
                      },
                      {
                        value: "High",
                        label: "High",
                      },
                      {
                        value: "Medium",
                        label: "Medium",
                      },
                      {
                        value: "Low",
                        label: "Low",
                      },
                    ]}
                  />

                </div>


                <div className="mt-4 flex justify-end">

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-medium text-slate-600 transition hover:text-slate-300"
                  >
                    Reset filters
                  </button>

                </div>

              </div>

            )}

          </section>


          {/* =================================================
              STATUS TABS
          ================================================= */}

          <div className="mb-5 overflow-x-auto">

            <div className="flex min-w-max items-center gap-1 border-b border-slate-800">

              <StatusTab
                label="All"
                count={getCount("all")}
                active={activeTab === "all"}
                onClick={() =>
                  setActiveTab("all")
                }
              />


              <StatusTab
                label="To Do"
                count={getCount("todo")}
                active={activeTab === "todo"}
                onClick={() =>
                  setActiveTab("todo")
                }
              />


              <StatusTab
                label="In Progress"
                count={
                  getCount("in-progress")
                }
                active={
                  activeTab === "in-progress"
                }
                onClick={() =>
                  setActiveTab("in-progress")
                }
              />


              <StatusTab
                label="In Review"
                count={getCount("review")}
                active={activeTab === "review"}
                onClick={() =>
                  setActiveTab("review")
                }
              />


              <StatusTab
                label="Done"
                count={getCount("done")}
                active={activeTab === "done"}
                onClick={() =>
                  setActiveTab("done")
                }
              />

            </div>

          </div>


          {/* =================================================
              TASK TABLE
          ================================================= */}

          <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30">

            {/* TABLE HEADER */}

            <div
              className="
                hidden
                md:grid
                grid-cols-[minmax(0,1fr)_180px_110px_170px_130px_180px]
                items-center
                border-b
                border-slate-800
                px-5
                py-3
                text-[10px]
                font-semibold
                uppercase
                tracking-wider
                text-slate-600
              "
            >
              <span>Task</span>
              <span>Created By</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Due Date</span>
              <span>Action</span>
            </div>


            {/* TABLE BODY */}

            {filteredTasks.length > 0 ? (

              <div className="divide-y divide-slate-800">

                {filteredTasks.map(
                  (task) => (

                    <TaskRow
                      key={task._id}
                      task={task}
                      statusConfig={statusConfig}
                      priorityConfig={priorityConfig}
                      onClick={() =>
                        setSelectedTask(task)
                      }
                      onStatusChange={
                        handleStatusChange
                      }
                      updating={
                        updatingTaskId ===
                        task._id
                      }
                    />

                  )
                )}

              </div>

            ) : (

              <EmptyState
                hasTasks={tasks.length > 0}
                resetFilters={resetFilters}
              />

            )}

          </section>


          {/* =================================================
              RESULTS
          ================================================= */}

          <div className="mt-4 flex items-center justify-between">

            <p className="text-[10px] text-slate-600">

              Showing{" "}

              <span className="text-slate-400">
                {filteredTasks.length}
              </span>

              {" "}of{" "}

              <span className="text-slate-400">
                {tasks.length}
              </span>

              {" "}assigned tasks

            </p>

          </div>

        </>

      )}


      {/* =================================================
          TASK DETAILS MODAL
      ================================================= */}

      <TaskDetailsModal
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() =>
          setSelectedTask(null)
        }
      />

    </div>

  );

};


// =====================================================
// FILTER SELECT
// =====================================================

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}) => {

  return (

    <div>

      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </label>


      <div className="relative">

        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 pr-9 text-xs text-slate-300 outline-none focus:border-indigo-500"
        >

          {options.map(
            (option) => (

              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>

            )
          )}

        </select>


        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
        />

      </div>

    </div>

  );

};


// =====================================================
// STATUS TAB
// =====================================================

const StatusTab = ({
  label,
  count,
  active,
  onClick,
}) => {

  return (

    <button
      type="button"
      onClick={onClick}
      className={`
        border-b-2
        px-4
        py-3
        text-xs
        font-medium
        transition
        ${
          active
            ? "border-indigo-500 text-indigo-400"
            : "border-transparent text-slate-600 hover:text-slate-300"
        }
      `}
    >

      {label}

      <span
        className={`
          ml-2
          rounded-full
          px-1.5
          py-0.5
          text-[9px]
          ${
            active
              ? "bg-indigo-500/10 text-indigo-400"
              : "bg-slate-800 text-slate-600"
          }
        `}
      >
        {count}
      </span>

    </button>

  );

};


// =====================================================
// TASK ROW
// =====================================================

const TaskRow = ({
  task,
  statusConfig,
  priorityConfig,
  onClick,
  onStatusChange,
  updating,
}) => {

  const currentStatus =
    statusConfig[task.status] ||
    statusConfig.todo;

  const StatusIcon =
    currentStatus.icon;


  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .join("");
  };


  // =====================================================
  // DUE DATE
  // =====================================================

  const formattedDueDate =
    task.dueDate
      ? new Date(
          task.dueDate
        ).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : "No due date";


  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) <
      new Date();


  // =====================================================
  // ACTION CONFIG
  // =====================================================

  const getActionConfig = () => {

    switch (task.status) {

      case "todo":

        return {
          label: "Start Task",
          icon: ArrowRight,
          nextStatus: "in-progress",
          disabled: false,
          className:
            "border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30",
        };


      case "in-progress":

        return {
          label: "Send to Review",
          icon: Send,
          nextStatus: "review",
          disabled: false,
          className:
            "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30",
        };


      case "review":

        return {
          label: "Approval Pending",
          icon: Clock3,
          nextStatus: null,
          disabled: true,
          className:
            "border-amber-500/10 bg-amber-500/5 text-amber-500/60 cursor-default",
        };


      case "done":

        return {
          label: "Completed",
          icon: CheckCircle2,
          nextStatus: null,
          disabled: true,
          className:
            "border-emerald-500/10 bg-emerald-500/5 text-emerald-500/70 cursor-default",
        };


      default:

        return {
          label: "Start Task",
          icon: ArrowRight,
          nextStatus: "in-progress",
          disabled: false,
          className:
            "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
        };

    }

  };


  const action =
    getActionConfig();


  // =====================================================
  // ACTION HANDLER
  // =====================================================

  const handleAction = (event) => {

    event.stopPropagation();

    if (
      action.disabled ||
      !action.nextStatus ||
      updating
    ) {
      return;
    }

    onStatusChange(
      task,
      action.nextStatus
    );

  };


  return (

    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          onClick();

        }

      }}
      className="
        group
        w-full
        cursor-pointer
        text-left
        transition
        hover:bg-slate-900/40
      "
    >

      {/* =================================================
          DESKTOP ROW
      ================================================= */}

      <div
        className="
          hidden
          md:grid
          grid-cols-[minmax(0,1fr)_180px_110px_170px_130px_180px]
          items-center
          px-5
          py-4
        "
      >
        {/* TASK */}
        <div className="min-w-0 pr-6">
          <div className="flex items-center gap-3">

            <div
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-lg
                bg-indigo-500/10
                ring-1 ring-indigo-500/10
              "
            >
              <CheckCircle2
                size={15}
                className="text-indigo-400"
              />
            </div>

            <div className="min-w-0">

              <p
                className="
                  truncate
                  text-xs
                  font-semibold
                  text-slate-300
                  transition
                  group-hover:text-white
                "
              >
                {task.title}
              </p>

              <div className="mt-1.5 flex min-w-0 items-center gap-2">

                <span
                  className="
                    truncate
                    text-[10px]
                    text-slate-600
                  "
                >
                  {task.project?.name || "Project"}
                </span>

                <span className="text-slate-800">
                  •
                </span>

                <span
                  className="
                    truncate
                    text-[10px]
                    text-slate-600
                  "
                >
                  {task.workspace?.name || "Workspace"}
                </span>

              </div>

            </div>
          </div>
        </div>


        {/* CREATED BY */}
        <div className="min-w-0">

          <div className="flex items-center gap-2">

            {task.createdBy?.avatar ? (
              <img
                src={task.createdBy.avatar}
                alt=""
                className="
                  h-7 w-7
                  shrink-0
                  rounded-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  flex h-7 w-7 shrink-0
                  items-center justify-center
                  rounded-full
                  bg-indigo-500/15
                  text-[9px]
                  font-semibold
                  text-indigo-400
                "
              >
                {getInitials(task.createdBy?.name) || "U"}
              </div>
            )}

            <p
              className="
                truncate
                text-[11px]
                font-medium
                text-slate-400
              "
            >
              {task.createdBy?.name || "Unknown"}
            </p>

          </div>

        </div>


        {/* PRIORITY */}
        <div>

          <span
            className={`
              inline-flex
              items-center
              rounded-full
              border
              px-2.5
              py-1
              text-[9px]
              font-semibold
              ${
                priorityConfig[task.priority] ||
                "border-slate-700 bg-slate-800 text-slate-400"
              }
            `}
          >
            {task.priority || "Medium"}
          </span>

        </div>


        {/* STATUS */}
        <div>

          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1.5
              text-[9px]
              font-semibold
              ${currentStatus.className}
            `}
          >
            <StatusIcon size={11} />

            {currentStatus.label}
          </span>

        </div>


        {/* DUE DATE */}
        <div className="min-w-0">

          {task.dueDate ? (

            <div
              className={`
                flex
                items-center
                gap-2
                text-[10px]
                ${
                  isOverdue
                    ? "text-red-400"
                    : "text-slate-500"
                }
              `}
            >

              <CalendarDays
                size={13}
                className="shrink-0"
              />

              <span className="whitespace-nowrap">
                {formattedDueDate}
              </span>

            </div>

          ) : (

            <span className="text-[10px] text-slate-600">
              No due date
            </span>

          )}

        </div>


        {/* ACTION */}
        <div>

          <button
            type="button"
            disabled={
              action.disabled ||
              updating
            }
            onClick={handleAction}
            className={`
              inline-flex
              min-w-[150px]
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              px-3
              py-2
              text-[10px]
              font-medium
              transition
              ${
                action.disabled
                  ? "cursor-default"
                  : "hover:-translate-y-[1px]"
              }
              disabled:opacity-70
              ${action.className}
            `}
          >

            {updating ? (

              <Loader2
                size={12}
                className="animate-spin"
              />

            ) : (

              <action.icon size={12} />

            )}

            {updating
              ? "Updating..."
              : action.label}

          </button>

        </div>

      </div>


      {/* =================================================
          MOBILE
      ================================================= */}

      <div className="px-4 py-4 md:hidden">

        {/* TOP */}

        <div className="flex items-start justify-between gap-3">

          <div className="flex min-w-0 items-start gap-3">

            <div
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-indigo-500/10
              "
            >

              <CheckCircle2
                size={14}
                className="text-indigo-400"
              />

            </div>


            <div className="min-w-0">

              <p className="truncate text-xs font-semibold text-slate-300">

                {task.title}

              </p>


              <div className="mt-1 flex items-center gap-2">

                <span className="truncate text-[10px] text-slate-600">

                  {task.project?.name ||
                    "Project"}

                </span>

                <span className="text-slate-800">
                  •
                </span>

                <span className="truncate text-[10px] text-slate-600">

                  {task.workspace?.name ||
                    "Workspace"}

                </span>

              </div>

            </div>

          </div>


          {/* PRIORITY */}

          <span
            className={`
              shrink-0
              rounded-full
              border
              px-2
              py-1
              text-[9px]
              font-semibold
              ${
                priorityConfig[
                  task.priority
                ] ||
                "border-slate-700 bg-slate-800 text-slate-400"
              }
            `}
          >

            {task.priority ||
              "Medium"}

          </span>

        </div>


        {/* CREATED BY */}

        <div className="mt-4 flex items-center gap-2">

          {task.createdBy?.avatar ? (

            <img
              src={task.createdBy.avatar}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />

          ) : (

            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-[8px] font-semibold text-indigo-400">

              {getInitials(
                task.createdBy?.name
              ) || "U"}

            </div>

          )}

          <p className="text-[10px] text-slate-500">

            {task.createdBy?.name ||
              "Unknown"}

          </p>

        </div>


        {/* STATUS */}

        <div className="mt-4">

          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1.5
              text-[9px]
              font-semibold
              ${currentStatus.className}
            `}
          >

            <StatusIcon
              size={11}
            />

            {currentStatus.label}

          </span>

        </div>


        {/* ACTION */}

        <button
          type="button"
          disabled={
            action.disabled ||
            updating
          }
          onClick={handleAction}
          className={`
            mt-4
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            px-3
            py-2.5
            text-[10px]
            font-medium
            transition
            disabled:opacity-70
            ${action.className}
          `}
        >

          {updating ? (

            <Loader2
              size={12}
              className="animate-spin"
            />

          ) : (

            <action.icon
              size={12}
            />

          )}

          {updating
            ? "Updating..."
            : action.label}

        </button>

      </div>

    </div>

  );

};


// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
  hasTasks,
  resetFilters,
}) => {

  return (

    <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">

        {hasTasks ? (

          <Search
            size={21}
            className="text-slate-600"
          />

        ) : (

          <CheckCircle2
            size={21}
            className="text-slate-600"
          />

        )}

      </div>


      <h3 className="mt-4 text-sm font-semibold text-slate-300">

        {hasTasks
          ? "No matching tasks"
          : "You're all caught up"}

      </h3>


      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">

        {hasTasks
          ? "Try changing your search or filters to find another task."
          : "Tasks assigned to you will appear here across all your workspaces and projects."}

      </p>


      {hasTasks && (

        <button
          type="button"
          onClick={resetFilters}
          className="mt-4 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
        >

          Clear filters

        </button>

      )}

    </div>

  );

};


export default Tasks;