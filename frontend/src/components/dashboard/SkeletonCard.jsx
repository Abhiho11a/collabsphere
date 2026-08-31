const SkeletonCard = ({
  className = "",
}) => {

  return (
    <div
      className={`animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 ${className}`}
    >
      <div className="space-y-4 p-5">

        <div className="h-4 w-32 rounded bg-slate-800" />

        <div className="h-3 w-48 rounded bg-slate-800" />

        <div className="space-y-3 pt-3">

          <div className="h-3 w-full rounded bg-slate-800" />

          <div className="h-3 w-5/6 rounded bg-slate-800" />

          <div className="h-3 w-4/6 rounded bg-slate-800" />

        </div>

      </div>
    </div>
  );
};


export default SkeletonCard;