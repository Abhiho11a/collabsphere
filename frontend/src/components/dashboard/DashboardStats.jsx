import StatCard from "./StatCard";

const DashboardStats = ({
  stats = [],
}) => {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
        />
      ))}

    </section>
  );
};

export default DashboardStats;