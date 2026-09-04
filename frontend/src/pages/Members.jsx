import {
  Check,
  ChevronDown,
  Crown,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserMinus,
  Users,
  X,
} from "lucide-react";

import {
    useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";
  
const Members = () => {
  const { workspaceId } = useParams();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchMembers = async () => {
  try {
    setLoading(true);
    setPageError("");

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/members`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to fetch members"
      );
    }

    setMembers(data.members || []);
  } catch (error) {
    console.error(
      "Fetch members error:",
      error
    );

    setPageError(
      error.message ||
        "Unable to load workspace members."
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setRoleDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);


  // ==========================================
  // SEARCH
  // ==========================================

  const [searchQuery, setSearchQuery] =
    useState("");


  // ==========================================
  // ROLE FILTER
  // ==========================================

  const [roleFilter, setRoleFilter] = useState("all");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roleDropdownRef = useRef(null);

  // ==========================================
  // INVITE MODAL
  // ==========================================

  const [inviteOpen, setInviteOpen] =
    useState(false);


  // ==========================================
  // SELECTED MEMBER MENU
  // ==========================================

  const [openMenuId, setOpenMenuId] =
    useState(null);


  // ==========================================
  // INVITE FORM
  // ==========================================

  const [inviteEmail, setInviteEmail] =
    useState("");


  const [inviteRole, setInviteRole] =
    useState("Member");


  const [inviteError, setInviteError] =
    useState("");


  // ==========================================
  // FILTER MEMBERS
  // ==========================================

  const filteredMembers = useMemo(() => {

    return members.filter((member) => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      const matchesSearch =
        !query ||
        member.name
          .toLowerCase()
          .includes(query) ||
        member.email
          .toLowerCase()
          .includes(query);


      const matchesRole =
        roleFilter === "all" ||
        member.role === roleFilter;


      return (
        matchesSearch &&
        matchesRole
      );

    });

  }, [
    members,
    searchQuery,
    roleFilter,
  ]);


  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (
    name = ""
  ) => {

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");

  };


  // ==========================================
  // AVATAR STYLE
  // ==========================================

  const avatarStyles = [
    "bg-indigo-500/10 text-indigo-400",
    "bg-blue-500/10 text-blue-400",
    "bg-violet-500/10 text-violet-400",
    "bg-cyan-500/10 text-cyan-400",
    "bg-emerald-500/10 text-emerald-400",
  ];


  // ==========================================
  // REMOVE MEMBER
  // ==========================================

  const handleRemoveMember = (
    memberId
  ) => {

    setMembers(
      (previous) =>
        previous.filter(
          (member) =>
            member.id !== memberId
        )
    );

    setOpenMenuId(null);

  };


  // ==========================================
  // INVITE MEMBER
  // ==========================================

  const handleInvite = async (event) => {
  event.preventDefault();

  const email = inviteEmail
    .trim()
    .toLowerCase();

  if (!email) {
    setInviteError(
      "Email address is required."
    );
    return;
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setInviteError(
      "Enter a valid email address."
    );
    return;
  }

  try {
    setInviteError("");

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/members`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to add member."
      );
    }

    // Reset form
    setInviteEmail("");
    setInviteRole("Member");
    setInviteError("");
    setInviteOpen(false);

    // Get latest members from backend
    await fetchMembers();

  } catch (error) {
    console.error(
      "Add member error:",
      error
    );

    setInviteError(
      error.message ||
        "Unable to add member."
    );
  }
};


  // ==========================================
  // RESET FILTERS
  // ==========================================

  const resetFilters = () => {

    setSearchQuery("");

    setRoleFilter("all");

  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto max-w-[1500px] py-4">

      {/* =====================================
          HEADER
      ====================================== */}

      <section className="mb-5">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="mb-2 text-xs font-medium text-indigo-400">
              Engineering Team
            </p>


            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-500/10
                "
              >

                <Users
                  size={21}
                  className="text-indigo-400"
                />

              </div>


              <div>

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Members
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage people and roles in your workspace.
                </p>

              </div>

            </div>

          </div>


          {/* INVITE */}

          <button
            type="button"
            onClick={() => {

              setInviteError("");

              setInviteOpen(true);

            }}
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-lg
              bg-indigo-500
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-lg
              shadow-indigo-500/10
              transition
              hover:bg-indigo-400
            "
          >

            <Plus size={17} />

            Add workspace member

          </button>

        </div>

      </section>


      {/* =====================================
          SEARCH + FILTER
      ====================================== */}

      <section className="mb-5">

        <div className="flex flex-col gap-3 sm:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

            <Search
                size={16}
                className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-slate-600
                "
            />

            <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                setSearchQuery(
                    event.target.value
                )
                }
                placeholder="Search members..."
                className="
                w-full
                rounded-lg
                border
                border-slate-800
                bg-slate-950/50
                py-3
                pl-10
                pr-4
                text-xs
                text-slate-300
                outline-none
                placeholder:text-slate-600
                focus:border-indigo-500
                "
            />

            </div>


            {/* ROLE FILTER */}

            <div
            ref={roleDropdownRef}
            className="relative w-full sm:w-44"
            >

            {/* Trigger */}

            <button
                type="button"
                onClick={() =>
                setRoleDropdownOpen(
                    (previous) => !previous
                )
                }
                className={`
                flex
                w-full
                items-center
                justify-between
                gap-3
                rounded-lg
                border
                px-3.5
                py-3
                text-xs
                transition-all
                duration-200
                ${
                    roleDropdownOpen
                    ? "border-indigo-500 bg-slate-950 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                    : roleFilter !== "all"
                    ? "border-indigo-500/40 bg-indigo-500/5"
                    : "border-slate-800 bg-slate-950/50"
                }
                `}
            >

                <div className="flex items-center gap-2.5">

                <ShieldCheck
                    size={15}
                    className={
                    roleFilter !== "all"
                        ? "text-indigo-400"
                        : "text-slate-600"
                    }
                />

                <span
                    className={
                    roleFilter !== "all"
                        ? "text-indigo-300"
                        : "text-slate-400"
                    }
                >
                    {roleFilter === "all"
                    ? "All roles"
                    : roleFilter}
                </span>

                </div>

                <ChevronDown
                size={14}
                className={`
                    text-slate-600
                    transition-transform
                    duration-200
                    ${
                    roleDropdownOpen
                        ? "rotate-180 text-indigo-400"
                        : ""
                    }
                `}
                />

            </button>


            {/* Dropdown */}

            {roleDropdownOpen && (

                <div
                className="
                    absolute
                    left-0
                    right-0
                    top-[calc(100%+8px)]
                    z-50
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-800
                    bg-[#080d1f]
                    p-1.5
                    shadow-2xl
                    shadow-black/40
                    animate-in
                    fade-in
                    slide-in-from-top-1
                    duration-150
                "
                >

                {/* ALL ROLES */}

                <button
                    type="button"
                    onClick={() => {
                    setRoleFilter("all");
                    setRoleDropdownOpen(false);
                    }}
                    className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2.5
                    text-xs
                    transition-colors
                    ${
                        roleFilter === "all"
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }
                    `}
                >

                    <div className="flex items-center gap-2.5">

                    <ShieldCheck
                        size={14}
                        className={
                        roleFilter === "all"
                            ? "text-indigo-400"
                            : "text-slate-600"
                        }
                    />

                    <span>
                        All roles
                    </span>

                    </div>

                    {roleFilter === "all" && (
                    <Check
                        size={14}
                        className="text-indigo-400"
                    />
                    )}

                </button>


                {/* OWNER */}

                <button
                    type="button"
                    onClick={() => {
                    setRoleFilter("Owner");
                    setRoleDropdownOpen(false);
                    }}
                    className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2.5
                    text-xs
                    transition-colors
                    ${
                        roleFilter === "Owner"
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }
                    `}
                >

                    <div className="flex items-center gap-2.5">

                    <Crown
                        size={14}
                        className={
                        roleFilter === "Owner"
                            ? "text-indigo-400"
                            : "text-slate-600"
                        }
                    />

                    <span>
                        Owner
                    </span>

                    </div>

                    {roleFilter === "Owner" && (
                    <Check
                        size={14}
                        className="text-indigo-400"
                    />
                    )}

                </button>


                {/* ADMIN */}

                <button
                    type="button"
                    onClick={() => {
                    setRoleFilter("Admin");
                    setRoleDropdownOpen(false);
                    }}
                    className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2.5
                    text-xs
                    transition-colors
                    ${
                        roleFilter === "Admin"
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }
                    `}
                >

                    <div className="flex items-center gap-2.5">

                    <ShieldCheck
                        size={14}
                        className={
                        roleFilter === "Admin"
                            ? "text-indigo-400"
                            : "text-slate-600"
                        }
                    />

                    <span>
                        Admin
                    </span>

                    </div>

                    {roleFilter === "Admin" && (
                    <Check
                        size={14}
                        className="text-indigo-400"
                    />
                    )}

                </button>


                {/* MEMBER */}

                <button
                    type="button"
                    onClick={() => {
                    setRoleFilter("Viewer");
                    setRoleDropdownOpen(false);
                    }}
                    className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-lg
                    px-3
                    py-2.5
                    text-xs
                    transition-colors
                    ${
                        roleFilter === "Viewer"
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }
                    `}
                >

                    <div className="flex items-center gap-2.5">

                    <User
                        size={14}
                        className={
                        roleFilter === "Member"
                            ? "text-indigo-400"
                            : "text-slate-600"
                        }
                    />

                    <span>
                        Member
                    </span>

                    </div>

                    {roleFilter === "Member" && (
                    <Check
                        size={14}
                        className="text-indigo-400"
                    />
                    )}

                </button>

                </div>

            )}

            </div>

        </div>

      </section>


      {/* =====================================
          MEMBER COUNT
      ====================================== */}

      <div className="mb-4 flex items-center justify-between">

        <p className="text-xs text-slate-600">

          <span className="font-medium text-slate-400">
            {filteredMembers.length}
          </span>{" "}

          {filteredMembers.length === 1
            ? "member"
            : "members"}

        </p>

      </div>


      {/* =====================================
          MEMBERS TABLE
      ====================================== */}

      <section className="overflow-visible rounded-xl border border-slate-800 bg-slate-950/30">

        {/* DESKTOP HEADER */}

        <div
          className="
            hidden
            grid-cols-[minmax(300px,1fr)_150px_130px_150px_45px]
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
            md:grid
          "
        >

          <span>
            Member
          </span>

          <span>
            Role
          </span>

          <span>
            Status
          </span>

          <span>
            Joined
          </span>

          <span />

        </div>


        {/* MEMBERS */}

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />

            <p className="mt-3 text-xs text-slate-500">
              Loading members...
            </p>
          </div>
        ) : pageError ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <X
                size={20}
                className="text-red-400"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-300">
              Unable to load members
            </h3>

            <p className="mt-1 max-w-sm text-xs text-slate-600">
              {pageError}
            </p>

            <button
              type="button"
              onClick={fetchMembers}
              className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Try again
            </button>
          </div>
        ) : filteredMembers.length > 0 ? (

          <div className="divide-y divide-slate-800">

            {filteredMembers.map(
              (member, index) => (

                <MemberRow
                  key={
                    member.id
                  }
                  member={
                    member
                  }
                  avatarClass={
                    avatarStyles[
                      index %
                        avatarStyles.length
                    ]
                  }
                  menuOpen={
                    openMenuId ===
                    member.id
                  }
                  onMenuToggle={() =>
                    setOpenMenuId(
                      openMenuId ===
                        member.id
                        ? null
                        : member.id
                    )
                  }
                  onRemove={() =>
                    handleRemoveMember(
                      member.id
                    )
                  }
                />

              )
            )}

          </div>

        ) : (

          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">

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

              <Users
                size={20}
                className="text-slate-600"
              />

            </div>


            <h3 className="mt-4 text-sm font-semibold text-slate-300">
              No members found
            </h3>


            <p className="mt-1 text-xs text-slate-600">
              Try changing your search or role filter.
            </p>


            <button
              type="button"
              onClick={
                resetFilters
              }
              className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>

          </div>

        )}

      </section>


      {/* =====================================
          INVITE MODAL
      ====================================== */}

      {inviteOpen && (

        <InviteMemberModal
          email={
            inviteEmail
          }
          role={
            inviteRole
          }
          error={
            inviteError
          }
          onEmailChange={
            setInviteEmail
          }
          onRoleChange={
            setInviteRole
          }
          onClose={() =>
            setInviteOpen(false)
          }
          onSubmit={
            handleInvite
          }
        />

      )}

    </div>
  );
};

const formatJoinedDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

/* ==========================================
   MEMBER ROW
========================================== */

const MemberRow = ({
  member,
  avatarClass,
  menuOpen,
  onMenuToggle,
  onRemove,
}) => {

  const initials =
    member.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");


  return (
    <div className="group">

      {/* DESKTOP */}

      <div className="hidden grid-cols-[minmax(300px,1fr)_150px_130px_150px_45px] items-center px-5 py-4 md:grid">

        {/* MEMBER */}

        <div className="flex min-w-0 items-center gap-3">

          <div
            className={`
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[10px]
              font-semibold
              ${avatarClass}
            `}
          >

            {initials}

          </div>


          <div className="min-w-0">

            <p className="truncate text-xs font-semibold text-slate-300">
              {member.name}
            </p>

            <p className="mt-0.5 truncate text-[10px] text-slate-600">
              {member.email}
            </p>

          </div>

        </div>


        {/* ROLE */}

        <div>

          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              rounded-full
              px-2.5
              py-1
              text-[9px]
              font-semibold
              ${
                member.role ===
                "Owner"
                  ? "bg-violet-500/10 text-violet-400"
                  : member.role ===
                    "Admin"
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "bg-slate-800 text-slate-400"
              }
            `}
          >

            {member.role}

          </span>

        </div>


        {/* STATUS */}

        <div>

          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              text-[10px]
              ${
                member.status ===
                "Active"
                  ? "text-emerald-400"
                  : "text-slate-600"
              }
            `}
          >

            <span
              className={`
                h-1.5
                w-1.5
                rounded-full
                ${
                  member.status ===
                  "Active"
                    ? "bg-emerald-400"
                    : "bg-slate-700"
                }
              `}
            />

            {member.status}

          </span>

        </div>


        {/* JOINED */}

        <div className="text-[10px] text-slate-600">

          {formatJoinedDate(member.joinedAt)}

        </div>


        {/* MENU */}

        <div className="relative">

          <button
            type="button"
            onClick={(event) => {

              event.stopPropagation();

              onMenuToggle();

            }}
            className="
              rounded-md
              p-1.5
              text-slate-700
              opacity-0
              transition
              group-hover:opacity-100
              hover:bg-slate-800
              hover:text-slate-400
            "
          >

            <MoreHorizontal
              size={15}
            />

          </button>


          {menuOpen && (

            <MemberMenu
              role={
                member.role
              }
              onRemove={
                onRemove
              }
            />

          )}

        </div>

      </div>


      {/* MOBILE */}

      <div className="px-4 py-4 md:hidden">

        <div className="flex items-start justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div
              className={`
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                text-[10px]
                font-semibold
                ${avatarClass}
              `}
            >

              {initials}

            </div>


            <div className="min-w-0">

              <p className="truncate text-xs font-semibold text-slate-300">
                {member.name}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-slate-600">
                {member.email}
              </p>

            </div>

          </div>


          <div className="relative">

            <button
              type="button"
              onClick={
                onMenuToggle
              }
              className="
                rounded-md
                p-1.5
                text-slate-600
                hover:bg-slate-800
              "
            >

              <MoreHorizontal
                size={15}
              />

            </button>


            {menuOpen && (

              <MemberMenu
                role={
                  member.role
                }
                onRemove={
                  onRemove
                }
              />

            )}

          </div>

        </div>


        <div className="mt-3 flex items-center gap-2 pl-12">

          <span
            className="
              rounded-full
              bg-slate-800
              px-2
              py-1
              text-[9px]
              font-semibold
              text-slate-400
            "
          >
            {member.role}
          </span>


          <span
            className={`
              flex
              items-center
              gap-1.5
              text-[9px]
              ${
                member.status ===
                "Active"
                  ? "text-emerald-400"
                  : "text-slate-600"
              }
            `}
          >

            <span
              className={`
                h-1.5
                w-1.5
                rounded-full
                ${
                  member.status ===
                  "Active"
                    ? "bg-emerald-400"
                    : "bg-slate-700"
                }
              `}
            />

            {member.status}

          </span>


          <span className="text-[9px] text-slate-700">
            Joined {member.joinedAt}
          </span>

        </div>

      </div>

    </div>
  );
};


/* ==========================================
   MEMBER MENU
========================================== */

const MemberMenu = ({
  role,
  onRemove,
}) => {

  return (
    <div
      className="
        absolute
        right-0
        top-8
        z-30
        w-40
        overflow-hidden
        rounded-lg
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      <button
        type="button"
        className="
          flex
          w-full
          items-center
          gap-2
          px-3
          py-2.5
          text-left
          text-[10px]
          text-slate-400
          transition
          hover:bg-slate-800
          hover:text-slate-200
        "
      >

        <ShieldCheck
          size={13}
        />

        Change Role

      </button>


      {role !== "Owner" && (

        <button
          type="button"
          onClick={
            onRemove
          }
          className="
            flex
            w-full
            items-center
            gap-2
            border-t
            border-slate-800
            px-3
            py-2.5
            text-left
            text-[10px]
            text-red-400
            transition
            hover:bg-red-500/5
          "
        >

          <UserMinus
            size={13}
          />

          Remove Member

        </button>

      )}

    </div>
  );
};


/* ==========================================
   INVITE MODAL
========================================== */

const InviteMemberModal = ({
  email,
  role,
  error,
  onEmailChange,
  onRoleChange,
  onClose,
  onSubmit,
}) => {

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        px-4
        py-6
        backdrop-blur-sm
      "
    >

      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close"
        onClick={
          onClose
        }
        className="absolute inset-0 cursor-default"
      />


      {/* MODAL */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-md
          overflow-hidden
          rounded-2xl
          border
          border-slate-800
          bg-[#080d1d]
          shadow-2xl
        "
      >

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">

          <div>

            <div
              className="
                mb-3
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-indigo-500/10
              "
            >

              <Mail
                size={17}
                className="text-indigo-400"
              />

            </div>


            <h2 className="text-base font-semibold text-white">
              Invite member
            </h2>


            <p className="mt-1 text-xs leading-5 text-slate-500">
              Add an existing COLLABSPHERE user to this workspace.
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="
              rounded-lg
              p-2
              text-slate-500
              transition
              hover:bg-slate-800
              hover:text-slate-200
            "
          >

            <X size={17} />

          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={
            onSubmit
          }
          className="p-6"
        >

          {error && (

            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              {error}
            </div>

          )}


          {/* EMAIL */}

          <div>

            <label className="mb-2 block text-xs font-medium text-slate-300">

              Email address

              <span className="ml-1 text-red-400">
                *
              </span>

            </label>


            <div className="relative">

              <Mail
                size={15}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-600
                "
              />


              <input
                type="email"
                value={
                  email
                }
                onChange={(event) =>
                  onEmailChange(
                    event.target.value
                  )
                }
                placeholder="member@example.com"
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-800
                  bg-slate-900
                  py-3
                  pl-10
                  pr-4
                  text-xs
                  text-slate-300
                  outline-none
                  placeholder:text-slate-600
                  focus:border-indigo-500
                "
              />

            </div>

          </div>


          {/* ROLE */}

          <div className="mt-5">

            <label className="mb-2 block text-xs font-medium text-slate-300">
              Workspace role
            </label>


            <select
              value={
                role
              }
              onChange={(event) =>
                onRoleChange(
                  event.target.value
                )
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-800
                bg-slate-900
                px-3
                py-3
                text-xs
                text-slate-300
                outline-none
                focus:border-indigo-500
              "
            >

              <option value="Member">
                Member
              </option>

              <option value="Admin">
                Admin
              </option>

              <option value="Viewer">
                Viewer
              </option>

            </select>

          </div>


          {/* INFO */}

          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/50 p-3">

            <div className="flex gap-2">

              <Check
                size={14}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <p className="text-[10px] leading-5 text-slate-500">
                The invited member will be able to access workspace projects and tasks based on their assigned role.
              </p>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="mt-6 flex justify-end gap-2">

            <button
              type="button"
              onClick={
                onClose
              }
              className="
                rounded-lg
                border
                border-slate-800
                px-4
                py-2.5
                text-xs
                font-medium
                text-slate-400
                transition
                hover:bg-slate-800
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-indigo-500
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-indigo-400
              "
            >

              <Mail size={13} />

              Add Member

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};


export default Members;