import {
  FolderKanban,
  ListTodo,
  Users,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const Dashboard = () => {

  const { user } = useAuth();


  const stats = [
    {
      title: "Active Projects",
      value: "8",
      icon: FolderKanban,
    },
    {
      title: "Pending Tasks",
      value: "24",
      icon: ListTodo,
    },
    {
      title: "Team Members",
      value: "12",
      icon: Users,
    },
    {
      title: "Due Today",
      value: "5",
      icon: CheckCircle2,
    },
  ];


  return (
    <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">

      {/* =====================================
          WELCOME
      ====================================== */}

      <div className="mb-8">

        <p className="text-sm text-slate-500">
          Dashboard
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Good morning,{" "}
          <span className="text-indigo-400">
            {user?.name?.split(" ")[0] || "there"}
          </span>{" "}
          👋
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Here's what's happening across your workspace.
        </p>

      </div>


      {/* =====================================
          STATISTICS
      ====================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {

          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Icon size={19} />
                </div>

              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.title}
              </p>

              <p className="mt-1 text-2xl font-semibold text-white">
                {stat.value}
              </p>

            </div>
          );

        })}

      </div>


      {/* =====================================
          CONTENT PLACEHOLDER
      ====================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        <div className="min-h-72 rounded-xl border border-slate-800 bg-slate-900/40 p-6">

          <h3 className="font-semibold text-white">
            Active Projects
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Project overview will be added here.
          </p>

        </div>


        <div className="min-h-72 rounded-xl border border-slate-800 bg-slate-900/40 p-6">

          <h3 className="font-semibold text-white">
            Upcoming Deadlines
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Upcoming tasks and deadlines will appear here.
          </p>

        </div>

      </div>

    </div>
  );
};


export default Dashboard;