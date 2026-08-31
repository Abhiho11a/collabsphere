import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  Users,
  CheckCircle2,
  ListTodo,
  Plus,
} from "lucide-react";

import { Link } from "react-router-dom";

import useDashboard from "../hooks/useDashboard";

import DashboardStats from "../components/dashboard/DashboardStats";
import ProjectOverview from "../components/dashboard/ProjectOverview";
import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import TeamMembers from "../components/dashboard/TeamMembers";


const Dashboard = () => {

  const {
    loading,
    error,
    refresh,
    stats,
    projects,
    deadlines,
    members,
  } = useDashboard();


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <DashboardSkeleton />;
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1600px] items-center justify-center px-5">

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-8 py-10 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <CheckCircle2 size={22} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
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
    <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <section className="mb-8">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">
              Overview
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Overview of your workspace
            </p>

          </div>


          <Link
            to="/workspaces"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            <FolderKanban size={16} />

            View workspaces

            <ArrowRight size={15} />

          </Link>

        </div>

      </section>


      {/* ==================================================
          STATS
      ================================================== */}

      <DashboardStats
        stats={stats}
      />


      {/* ==================================================
          PROJECTS + DEADLINES
      ================================================== */}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">

        <ProjectOverview
          projects={projects}
        />

        <UpcomingDeadlines
          deadlines={deadlines}
        />

      </section>


      {/* ==================================================
          TEAM MEMBERS
      ================================================== */}

      <section className="mt-6">

        <TeamMembers
          members={members}
        />

      </section>

    </main>
  );
};


export default Dashboard;