import {
  Mail,
  UserRound,
} from "lucide-react";

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400 border-blue-500/20",
  "bg-orange-500/20 text-orange-400 border-orange-500/20",
  "bg-purple-500/20 text-purple-400 border-purple-500/20",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
];

const getInitials = (name = "") => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "U";
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
};

const TeamMemberCard = ({
  member,
  index = 0,
}) => {

  const name =
    member?.name ||
    member?.user?.name ||
    "Unknown User";

  const email =
    member?.email ||
    member?.user?.email ||
    "";

  const role =
    member?.role ||
    member?.memberRole ||
    "Member";

  const isOwner =
    String(role).toLowerCase() === "owner";

  const avatarColor =
    AVATAR_COLORS[
      index % AVATAR_COLORS.length
    ];


  return (
    <div
      className="
        group
        flex
        min-h-[145px]
        flex-col
        justify-between
        border
        border-slate-800
        bg-slate-900/40
        p-5
        transition-all
        duration-200
        hover:border-slate-700
        hover:bg-slate-900/70
      "
    >

      {/* Member information */}

      <div className="flex items-start gap-3">

        {/* Avatar */}

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            text-sm
            font-semibold
            ${avatarColor}
          `}
        >
          {getInitials(name)}
        </div>


        {/* Name / email */}

        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-semibold text-white">
            {name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {email || "No email available"}
          </p>

        </div>

      </div>


      {/* Bottom */}

      <div className="mt-4 flex items-center justify-between">

        {/* Role */}

        <span
          className={`
            rounded-md
            px-2.5
            py-1
            text-[10px]
            font-semibold
            ${
              isOwner
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-indigo-500/10 text-indigo-400"
            }
          `}
        >
          {isOwner ? "Owner" : "Member"}
        </span>


        {/* Actions */}

        <div className="flex items-center gap-1.5">

          {email && (
            <a
              href={`mailto:${email}`}
              title={`Email ${name}`}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                border
                border-slate-800
                text-slate-500
                transition
                hover:border-slate-700
                hover:bg-slate-800
                hover:text-slate-200
              "
            >
              <Mail size={14} />
            </a>
          )}


          <button
            type="button"
            title={`View ${name}`}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-slate-800
              text-slate-500
              transition
              hover:border-slate-700
              hover:bg-slate-800
              hover:text-slate-200
            "
          >
            <UserRound size={14} />
          </button>

        </div>

      </div>

    </div>
  );
};

export default TeamMemberCard;