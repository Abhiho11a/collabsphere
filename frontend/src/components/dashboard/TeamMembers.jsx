import {
  ArrowRight,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import TeamMemberCard from "./TeamMemberCard";


const TeamMembers = ({
  members = [],
}) => {

  const visibleMembers =
    members.slice(0, 5);


  return (
    <section
      className="
        overflow-hidden
        rounded-xl
        border
        border-slate-800
        bg-slate-950/40
      "
    >

      {/* =====================================
          HEADER
      ====================================== */}

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

          <div className="flex items-center gap-2">

            <h2 className="text-sm font-semibold text-white">
              Team members
            </h2>

            <span
              className="
                rounded-full
                bg-indigo-500/10
                px-2
                py-0.5
                text-[10px]
                font-semibold
                text-indigo-400
              "
            >
              {members.length}
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            People across your workspaces
          </p>

        </div>


        {/* Icon */}

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            bg-indigo-500/10
            text-indigo-400
          "
        >
          <Users size={17} />
        </div>

      </div>


      {/* =====================================
          MEMBERS
      ====================================== */}

      {visibleMembers.length > 0 ? (

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-5
          "
        >

          {visibleMembers.map(
            (member, index) => (

              <TeamMemberCard
                key={
                  member?.id ||
                  member?._id ||
                  member?.userId ||
                  member?.user?._id ||
                  index
                }
                member={member}
                index={index}
              />

            )
          )}

        </div>

      ) : (

        <div
          className="
            flex
            min-h-[180px]
            flex-col
            items-center
            justify-center
            px-6
            text-center
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-slate-900
              text-slate-600
            "
          >
            <Users size={20} />
          </div>

          <p className="mt-3 text-sm font-medium text-slate-400">
            No team members yet
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Members will appear here.
          </p>

        </div>

      )}


      {/* =====================================
          FOOTER
      ====================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          px-5
          py-3
        "
      >

        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-400">
            {Math.min(
              members.length,
              5
            )}
          </span>{" "}
          members
        </p>


        <Link
          to="/members"
          className="
            flex
            items-center
            gap-1.5
            text-xs
            font-medium
            text-indigo-400
            transition
            hover:text-indigo-300
          "
        >

          View all members

          <ArrowRight size={13} />

        </Link>

      </div>

    </section>
  );
};

export default TeamMembers;