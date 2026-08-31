import SkeletonCard  from "./SkeletonCard";

const DashboardSkeleton = () => {
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* ==========================================
          HEADER
      ========================================== */}

      <section className="animate-pulse">

        <div className="h-3 w-24 rounded bg-slate-800" />

        <div className="mt-4 h-8 w-64 rounded bg-slate-800" />

        <div className="mt-3 h-4 w-[420px] max-w-full rounded bg-slate-800" />

      </section>


      {/* ==========================================
          STATS
      ========================================== */}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[1, 2, 3, 4].map(
          (item) => (
            <SkeletonCard
              key={item}
              className="h-32"
            />
          )
        )}

      </section>


      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">

        {/* PROJECTS */}

        <SkeletonCard className="min-h-[360px]" />


        {/* DEADLINES */}

        <SkeletonCard className="min-h-[360px]" />

      </section>


      {/* ==========================================
          SECONDARY CONTENT
      ========================================== */}

      <section className="mt-6 grid gap-6 xl:grid-cols-2">

        {/* DOCUMENTS */}

        <SkeletonCard className="min-h-[300px]" />


        {/* ACTIVITY */}

        <SkeletonCard className="min-h-[300px]" />

      </section>


      {/* ==========================================
          TEAM
      ========================================== */}

      <section className="mt-6">

        <SkeletonCard className="min-h-[180px]" />

      </section>

    </main>
  );
};


export default DashboardSkeleton;