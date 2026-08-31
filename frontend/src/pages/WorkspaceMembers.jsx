import {
  Building2,
  Check,
  ChevronDown,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useParams,
} from "react-router-dom";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// ==========================================
// WORKSPACE MEMBERS
// ==========================================

const WorkspaceMembers = () => {
  const { workspaceId } = useParams();


  // ========================================
  // STATE
  // ========================================

  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] =
    useState("All roles");

  const [roleMenu, setRoleMenu] =
    useState(null);

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ========================================
  // FETCH MEMBERS
  // ========================================

  const fetchMembers = useCallback(
    async () => {
      if (!workspaceId) {
        setError("Workspace ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/workspaces/${workspaceId}/members`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load workspace members."
          );
        }

        setMembers(data.members || []);
      } catch (err) {
        console.error(
          "Fetch workspace members error:",
          err
        );

        setError(
          err.message ||
            "Unable to load workspace members."
        );
      } finally {
        setLoading(false);
      }
    },
    [workspaceId]
  );


  // ========================================
  // LOAD MEMBERS
  // ========================================

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);


  // ========================================
  // FILTER MEMBERS
  // ========================================

  const filteredMembers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name
          ?.toLowerCase()
          .includes(query) ||
        member.email
          ?.toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "All roles" ||
        member.role === roleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [
    members,
    search,
    roleFilter,
  ]);


  // ========================================
  // INITIALS
  // ========================================

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("");
  };


  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  // ========================================
  // TEMPORARY ROLE CHANGE
  // ========================================

  const handleRoleChange = (
    memberId,
    newRole
  ) => {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === memberId
          ? {
              ...member,
              role: newRole,
            }
          : member
      )
    );

    setRoleMenu(null);
  };


  // ========================================
  // TEMPORARY REMOVE
  // ========================================

  const handleRemoveMember = (
    memberId
  ) => {
    const confirmed =
      window.confirm(
        "Remove this member from the workspace?"
      );

    if (!confirmed) {
      return;
    }

    setMembers((previous) =>
      previous.filter(
        (member) =>
          member.id !== memberId
      )
    );
  };


  // ========================================
  // WORKSPACE NAME
  // ========================================

  // Temporary until we connect the
  // workspace details API.

  const workspaceName =
    "Engineering Team";

  const handleInviteMember = async (email, role) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceId}/members`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to add member"
      );
    }

    // Close modal
    setInviteOpen(false);

    // Refresh members from MongoDB
    await fetchMembers();

  } catch (error) {
    console.error(
      "Add member error:",
      error
    );

    throw error;
  }
};


  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

      {/* =====================================
          HEADER
      ====================================== */}

      <section className="mb-7">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          {/* Title */}

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
              <Users
                size={21}
                className="text-indigo-400"
              />
            </div>


            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Members
                </h1>

                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                  {members.length}{" "}
                  {members.length === 1
                    ? "member"
                    : "members"}
                </span>

              </div>


              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                <Building2 size={14} />

                <span>
                  {workspaceName}
                </span>

              </div>

            </div>

          </div>


          {/* Invite */}

          <button
            type="button"
            onClick={() =>
              setInviteOpen(true)
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <UserPlus size={17} />

            Invite Member
          </button>

        </div>

      </section>


      {/* =====================================
          ROLE SUMMARY
      ====================================== */}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <RoleSummary
          label="Owners"
          value={
            members.filter(
              (member) =>
                member.role === "Owner"
            ).length
          }
          description="Full workspace control"
        />

        <RoleSummary
          label="Admins"
          value={
            members.filter(
              (member) =>
                member.role === "Admin"
            ).length
          }
          description="Workspace management"
        />

        <RoleSummary
          label="Members"
          value={
            members.filter(
              (member) =>
                member.role === "Member"
            ).length
          }
          description="Standard access"
        />

        <RoleSummary
          label="Viewers"
          value={
            members.filter(
              (member) =>
                member.role === "Viewer"
            ).length
          }
          description="Read-only access"
        />

      </section>


      {/* =====================================
          MEMBERS CARD
      ====================================== */}

      <section className="overflow-visible rounded-xl border border-slate-800 bg-slate-900/40">

        {/* Toolbar */}

        <div className="flex flex-col gap-4 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="font-semibold text-white">
              Workspace members
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage people and their workspace roles.
            </p>

          </div>


          {/* Search + Filter */}

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">

            {/* Search */}

            <div className="relative min-w-0 flex-1 sm:w-64">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search members..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

            </div>


            {/* Role Filter */}

            <div className="relative sm:w-36">

              <Shield
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500"
              />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-8 text-xs text-slate-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="All roles">
                  All roles
                </option>

                <option value="Owner">
                  Owner
                </option>

                <option value="Admin">
                  Admin
                </option>

                <option value="Member">
                  Member
                </option>

                <option value="Viewer">
                  Viewer
                </option>
              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

            </div>

          </div>

        </div>


        {/* =====================================
            LOADING
        ====================================== */}

        {loading && (
          <div className="px-5 py-16 text-center">

            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />

            <p className="mt-4 text-sm text-slate-400">
              Loading workspace members...
            </p>

          </div>
        )}


        {/* =====================================
            ERROR
        ====================================== */}

        {!loading && error && (
          <div className="px-5 py-14 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">

              <X
                size={18}
                className="text-red-400"
              />

            </div>

            <p className="mt-4 text-sm font-medium text-slate-300">
              Unable to load members
            </p>

            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchMembers}
              className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Try again
            </button>

          </div>
        )}


        {/* =====================================
            DESKTOP TABLE
        ====================================== */}

        {!loading &&
          !error && (
            <div className="hidden overflow-x-auto md:block">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-slate-800 text-left">

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Member
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Role
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Status
                    </th>

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Joined
                    </th>

                    <th className="w-12 px-3 py-3" />

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-800">

                  {filteredMembers.map(
                    (member) => (

                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-900/60"
                      >

                        {/* MEMBER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            {member.avatar ? (

                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="h-9 w-9 rounded-full object-cover"
                              />

                            ) : (

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
                                {getInitials(
                                  member.name
                                )}
                              </div>

                            )}


                            <div className="min-w-0">

                              <p className="truncate text-sm font-medium text-slate-200">
                                {member.name}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {member.email}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* ROLE */}

                        <td className="px-5 py-4">

                          {member.role ===
                          "Owner" ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-400">

                              <Shield size={11} />

                              Owner

                            </span>

                          ) : (

                            <div className="relative">

                              <button
                                type="button"
                                onClick={() =>
                                  setRoleMenu(
                                    roleMenu ===
                                      member.id
                                      ? null
                                      : member.id
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700"
                              >
                                {member.role}

                                <ChevronDown
                                  size={13}
                                  className="text-slate-500"
                                />

                              </button>


                              {roleMenu ===
                                member.id && (
                                <RoleDropdown
                                  currentRole={
                                    member.role
                                  }
                                  onChange={(
                                    role
                                  ) =>
                                    handleRoleChange(
                                      member.id,
                                      role
                                    )
                                  }
                                />
                              )}

                            </div>

                          )}

                        </td>


                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              member.status ===
                              "Active"
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                member.status ===
                                "Active"
                                  ? "bg-emerald-400"
                                  : "bg-slate-600"
                              }`}
                            />

                            {member.status}

                          </span>

                        </td>


                        {/* JOINED */}

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(
                            member.joinedAt
                          )}
                        </td>


                        {/* ACTION */}

                        <td className="px-3 py-4">

                          {member.role !==
                            "Owner" && (

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(
                                  member.id
                                )
                              }
                              className="rounded-md p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                              title="Remove member"
                            >
                              <MoreHorizontal
                                size={17}
                              />
                            </button>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>
          )}


        {/* =====================================
            MOBILE
        ====================================== */}

        {!loading &&
          !error && (
            <div className="divide-y divide-slate-800 md:hidden">

              {filteredMembers.map(
                (member) => (

                  <div
                    key={member.id}
                    className="p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        {member.avatar ? (

                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />

                        ) : (

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
                            {getInitials(
                              member.name
                            )}
                          </div>

                        )}

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium text-slate-200">
                            {member.name}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {member.email}
                          </p>

                        </div>

                      </div>


                      {member.role !==
                        "Owner" && (

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(
                              member.id
                            )
                          }
                          className="rounded-md p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <MoreHorizontal
                            size={17}
                          />
                        </button>

                      )}

                    </div>


                    <div className="mt-4 flex items-center justify-between">

                      <div className="relative">

                        {member.role ===
                        "Owner" ? (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-400">

                            <Shield size={11} />

                            Owner

                          </span>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              setRoleMenu(
                                roleMenu ===
                                  member.id
                                  ? null
                                  : member.id
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300"
                          >

                            {member.role}

                            <ChevronDown
                              size={13}
                            />

                          </button>

                        )}


                        {roleMenu ===
                          member.id && (
                          <RoleDropdown
                            currentRole={
                              member.role
                            }
                            onChange={(
                              role
                            ) =>
                              handleRoleChange(
                                member.id,
                                role
                              )
                            }
                          />
                        )}

                      </div>


                      <span className="text-xs text-slate-600">
                        {formatDate(
                          member.joinedAt
                        )}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>
          )}


        {/* =====================================
            EMPTY
        ====================================== */}

        {!loading &&
          !error &&
          filteredMembers.length ===
            0 && (

            <div className="px-5 py-14 text-center">

              <Users
                size={22}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm font-medium text-slate-300">
                No members found
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {search ||
                roleFilter !== "All roles"
                  ? "Try changing your search or role filter."
                  : "This workspace has no members yet."}
              </p>

            </div>
          )}

      </section>


      {/* =====================================
          PERMISSION INFORMATION
      ====================================== */}

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/30 p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">

            <Shield
              size={17}
              className="text-indigo-400"
            />

          </div>


          <div>

            <h3 className="text-sm font-semibold text-slate-200">
              Workspace roles
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Roles determine what members can view, create, modify, and manage within this workspace.
            </p>


            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <PermissionRole
                role="Owner"
                description="Full workspace control"
              />

              <PermissionRole
                role="Admin"
                description="Manage members and workspace resources"
              />

              <PermissionRole
                role="Member"
                description="Create and collaborate on resources"
              />

              <PermissionRole
                role="Viewer"
                description="Read-only workspace access"
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          INVITE MODAL
      ====================================== */}

      {inviteOpen && (
        <InviteMemberModal
          onClose={() =>
            setInviteOpen(false)
          }
          onInvite={(email, role) => { handleInviteMember }}
        />
      )}

    </div>
  );
};


// ==========================================
// ROLE SUMMARY
// ==========================================

const RoleSummary = ({
  label,
  value,
  description,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        {description}
      </p>

    </div>
  );
};


// ==========================================
// ROLE DROPDOWN
// ==========================================

const RoleDropdown = ({
  currentRole,
  onChange,
}) => {

  const roles = [
    "Admin",
    "Member",
    "Viewer",
  ];

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-1 shadow-xl">

      {roles.map((role) => (

        <button
          key={role}
          type="button"
          onClick={() =>
            onChange(role)
          }
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >

          {role}

          {currentRole === role && (
            <Check
              size={14}
              className="text-indigo-400"
            />
          )}

        </button>

      ))}

    </div>
  );
};


// ==========================================
// PERMISSION ROLE
// ==========================================

const PermissionRole = ({
  role,
  description,
}) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">

      <p className="text-xs font-semibold text-slate-300">
        {role}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-slate-600">
        {description}
      </p>

    </div>
  );
};


// ==========================================
// INVITE MODAL
// ==========================================

const InviteMemberModal = ({
  onClose,
  onInvite,
}) => {

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState("Member");

  const [error, setError] =
    useState("");


  const [submitting, setSubmitting] =
  useState(false);

  const handleSubmit = async (event) => {
  event.preventDefault();

  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    setError(
      "Email address is required."
    );
    return;
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    )
  ) {
    setError(
      "Enter a valid email address."
    );
    return;
  }

  try {
    setError("");
    setSubmitting(true);

    await onInvite(
      normalizedEmail,
      role
    );

  } catch (error) {
    setError(
      error.message ||
        "Unable to add member."
    );
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">

      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />


      {/* MODAL */}

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">

              <Mail
                size={18}
                className="text-indigo-400"
              />

            </div>


            <div>

              <h2 className="text-base font-semibold text-white">
                Invite member
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Add someone to this workspace.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X size={18} />
          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              {error}
            </div>
          )}


          {/* EMAIL */}

          <label className="block">

            <span className="mb-2 block text-sm font-medium text-slate-200">
              Email address
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value
                );
                setError("");
              }}
              placeholder="member@example.com"
              autoFocus
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

          </label>


          {/* ROLE */}

          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium text-slate-200">
              Workspace role
            </label>

            <select
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
            >

              <option value="Admin">
                Admin
              </option>

              <option value="Member">
                Member
              </option>

              <option value="Viewer">
                Viewer
              </option>

            </select>

          </div>


          {/* ACTIONS */}

          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Adding...
                </>
              ) : (
                <>
                  <Mail size={15} />
                  Add member
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};


export default WorkspaceMembers;