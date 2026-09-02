import {
  Check,
  ChevronDown,
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


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const OrganizationMembers = () => {
  // ==========================================
  // ORGANIZATION
  // ==========================================

  const [organizationId, setOrganizationId] =
    useState(
      () =>
        localStorage.getItem(
          "currentOrganizationId"
        ) || ""
    );

  const [organizationRole, setOrganizationRole] =
    useState(
      () =>
        localStorage.getItem(
          "currentOrganizationRole"
        ) || ""
    );

  const [organizationPermissions, setOrganizationPermissions] =
    useState({
      organization_admin: {
        createWorkspace: true,
        inviteMembers: true,
        manageMembers: true,
      },
      member: {
        createWorkspace: true,
        inviteMembers: false,
        manageMembers: false,
      },
      guest: {
        createWorkspace: false,
        inviteMembers: false,
        manageMembers: false,
      },
    });


  // ==========================================
  // STATE
  // ==========================================

  const [members, setMembers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [roleDropdownOpen, setRoleDropdownOpen] =
    useState(false);

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [inviteRole, setInviteRole] =
    useState("member");

  const [inviteError, setInviteError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [actionError, setActionError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const roleDropdownRef =
    useRef(null);


  // ==========================================
  // PERMISSIONS
  // ==========================================

  const isOrganizationAdmin =
    organizationRole ===
    "organization_admin";

  const currentRolePermissions =
    organizationPermissions?.[organizationRole] || {};

  const canInviteMembers =
    isOrganizationAdmin ||
    currentRolePermissions.inviteMembers === true;

  const canManageMembers =
    isOrganizationAdmin ||
    currentRolePermissions.manageMembers === true;


  // ==========================================
  // ROLE LABEL
  // ==========================================

  const getRoleLabel = (role) => {
    if (role === "organization_admin") {
      return "Organization Admin";
    }

    if (role === "guest") {
      return "Organization Viewer";
    }

    return "Organization Member";
  };


  // ==========================================
  // FETCH ORGANIZATION SETTINGS
  // ==========================================

  const fetchOrganizationSettings = async (
    selectedOrganizationId = organizationId
  ) => {
    if (!selectedOrganizationId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/organizations/${selectedOrganizationId}/settings`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message ||
            "Unable to fetch organization settings."
        );
      }

      if (data.role) {
        setOrganizationRole(data.role);
        localStorage.setItem(
          "currentOrganizationRole",
          data.role
        );
      }

      if (data.settings?.permissions) {
        const defaults = {
          organization_admin: {
            createWorkspace: true,
            inviteMembers: true,
            manageMembers: true,
          },
          member: {
            createWorkspace: true,
            inviteMembers: false,
            manageMembers: false,
          },
          guest: {
            createWorkspace: false,
            inviteMembers: false,
            manageMembers: false,
          },
        };

        const returned = data.settings.permissions;

        setOrganizationPermissions({
          organization_admin: {
            ...defaults.organization_admin,
            ...(returned.organization_admin || {}),
            createWorkspace: true,
            inviteMembers: true,
            manageMembers: true,
          },
          member: {
            ...defaults.member,
            ...(returned.member || {}),
          },
          guest: {
            ...defaults.guest,
            ...(returned.guest || {}),
          },
        });
      }
    } catch (error) {
      console.error(
        "Fetch organization settings error:",
        error
      );

      // Keep safe defaults if settings cannot be loaded.
      setOrganizationPermissions({
        organization_admin: {
          createWorkspace: true,
          inviteMembers: true,
          manageMembers: true,
        },
        member: {
          createWorkspace: true,
          inviteMembers: false,
          manageMembers: false,
        },
        guest: {
          createWorkspace: false,
          inviteMembers: false,
          manageMembers: false,
        },
      });
    }
  };


  // ==========================================
  // FETCH MEMBERS
  // ==========================================

  const fetchMembers = async (
    selectedOrganizationId = organizationId
  ) => {
    if (!selectedOrganizationId) {
      setMembers([]);
      setLoading(false);
      setPageError(
        "Please select an organization."
      );
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const response = await fetch(
        `${API_BASE_URL}/organizations/${selectedOrganizationId}/members`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message ||
            "Unable to fetch organization members."
        );
      }

      setMembers(
        Array.isArray(data.members)
          ? data.members
          : []
      );
    } catch (error) {
      console.error(
        "Fetch organization members error:",
        error
      );

      setMembers([]);

      setPageError(
        error?.message ||
          "Unable to load organization members."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const savedOrganizationId =
      localStorage.getItem(
        "currentOrganizationId"
      ) || "";

    const savedOrganizationRole =
      localStorage.getItem(
        "currentOrganizationRole"
      ) || "";

    setOrganizationId(
      savedOrganizationId
    );

    setOrganizationRole(
      savedOrganizationRole
    );

    if (savedOrganizationId) {
      fetchOrganizationSettings(
        savedOrganizationId
      );
      fetchMembers(
        savedOrganizationId
      );
    } else {
      setLoading(false);
      setPageError(
        "Please select an organization."
      );
    }
  }, []);


  // ==========================================
  // ORGANIZATION CHANGE
  // ==========================================

  useEffect(() => {
    const handleOrganizationChanged =
      () => {
        const newOrganizationId =
          localStorage.getItem(
            "currentOrganizationId"
          ) || "";

        const newOrganizationRole =
          localStorage.getItem(
            "currentOrganizationRole"
          ) || "";

        setOrganizationId(
          newOrganizationId
        );

        setOrganizationRole(
          newOrganizationRole
        );

        setOpenMenuId(null);
        setActionError("");

        if (newOrganizationId) {
          fetchOrganizationSettings(
            newOrganizationId
          );
          fetchMembers(
            newOrganizationId
          );
        } else {
          setMembers([]);
          setLoading(false);
          setPageError(
            "Please select an organization."
          );
        }
      };

    window.addEventListener(
      "organizationChanged",
      handleOrganizationChanged
    );

    return () => {
      window.removeEventListener(
        "organizationChanged",
        handleOrganizationChanged
      );
    };
  }, []);


  // ==========================================
  // CLOSE DROPDOWN
  // ==========================================

  useEffect(() => {
    const handleClickOutside =
      (event) => {
        if (
          roleDropdownRef.current &&
          !roleDropdownRef.current.contains(
            event.target
          )
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


  // ==========================================
  // FILTER MEMBERS
  // ==========================================

  const filteredMembers = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return members.filter(
      (member) => {
        const name =
          member.name ||
          member.user?.name ||
          "";

        const email =
          member.email ||
          member.user?.email ||
          "";

        const role =
          member.role || "member";

        const matchesSearch =
          !query ||
          name
            .toLowerCase()
            .includes(query) ||
          email
            .toLowerCase()
            .includes(query);

        const matchesRole =
          roleFilter === "all" ||
          role === roleFilter;

        return (
          matchesSearch &&
          matchesRole
        );
      }
    );
  }, [
    members,
    searchQuery,
    roleFilter,
  ]);


  // ==========================================
  // INVITE MEMBER
  // ==========================================

  const handleInvite = async (
    event
  ) => {
    event.preventDefault();

    if (!canInviteMembers) {
      setInviteError(
        "You do not have permission to invite organization members."
      );
      return;
    }

    const email =
      inviteEmail
        .trim()
        .toLowerCase();

    if (!email) {
      setInviteError(
        "Email address is required."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setInviteError(
        "Enter a valid email address."
      );
      return;
    }

    try {
      setSubmitting(true);
      setInviteError("");

      const response = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/members`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            role: inviteRole,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to add organization member."
        );
      }

      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);

      await fetchMembers();
    } catch (error) {
      console.error(
        "Invite organization member error:",
        error
      );

      setInviteError(
        error?.message ||
          "Unable to add member."
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ==========================================
  // UPDATE ROLE
  // ==========================================

  const handleRoleChange = async (
    memberId,
    newRole
  ) => {
    if (!canManageMembers) {
      setActionError(
        "You do not have permission to manage organization members."
      );
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      setOpenMenuId(null);

      const response = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/members/${memberId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to update member role."
        );
      }

      await fetchMembers();
    } catch (error) {
      console.error(
        "Update organization member role error:",
        error
      );

      setActionError(
        error?.message ||
          "Unable to update member role."
      );
    } finally {
      setActionLoading(false);
    }
  };


  // ==========================================
  // REMOVE MEMBER
  // ==========================================

  const handleRemoveMember = async (
    memberId
  ) => {
    if (!canManageMembers) {
      setActionError(
        "You do not have permission to manage organization members."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Suspend this organization member?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      setOpenMenuId(null);

      const response = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to remove member."
        );
      }

      await fetchMembers();
    } catch (error) {
      console.error(
        "Remove organization member error:",
        error
      );

      setActionError(
        error?.message ||
          "Unable to remove member."
      );
    } finally {
      setActionLoading(false);
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
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">

      {/* HEADER */}

      <section className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-2 text-sm font-medium text-indigo-400">
            Organization
          </p>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
              <Users
                size={21}
                className="text-indigo-400"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Organization Members
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage people and access across your organization.
              </p>
            </div>

          </div>
        </div>


        {canInviteMembers && (
          <button
            type="button"
            onClick={() => {
              setInviteError("");
              setActionError("");
              setInviteOpen(true);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <Plus size={17} />
            Add organization member
          </button>
        )}

      </section>


      {/* ROLE NOTICE */}

      <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">

        <div className="flex items-center gap-3">

          <ShieldCheck
            size={17}
            className="text-indigo-400"
          />

          <div>
            <p className="text-xs font-medium text-slate-300">
              Your organization role
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {getRoleLabel(
                organizationRole
              )}
            </p>
          </div>

        </div>

      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Your permissions
        </span>

        <span className={canInviteMembers ? "text-[10px] text-emerald-400" : "text-[10px] text-slate-600"}>
          {canInviteMembers ? "✓" : "×"} Invite members
        </span>

        <span className={canManageMembers ? "text-[10px] text-emerald-400" : "text-[10px] text-slate-600"}>
          {canManageMembers ? "✓" : "×"} Manage members
        </span>
      </div>


      {/* ERROR */}

      {actionError && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <span>{actionError}</span>

          <button
            type="button"
            onClick={() =>
              setActionError("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}


      {/* SEARCH */}

      <section className="mb-5 flex flex-col gap-3 sm:flex-row">

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
            placeholder="Search organization members..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-4 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500"
          />

        </div>


        {/* ROLE FILTER */}

        <div
          ref={roleDropdownRef}
          className="relative w-full sm:w-52"
        >

          <button
            type="button"
            onClick={() =>
              setRoleDropdownOpen(
                (previous) =>
                  !previous
              )
            }
            className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-3 text-xs text-slate-400"
          >
            <span>
              {roleFilter === "all"
                ? "All roles"
                : getRoleLabel(
                    roleFilter
                  )}
            </span>

            <ChevronDown
              size={14}
              className={
                roleDropdownOpen
                  ? "rotate-180"
                  : ""
              }
            />
          </button>


          {roleDropdownOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-800 bg-[#080d1f] p-1.5 shadow-2xl">

              {[
                {
                  value: "all",
                  label: "All roles",
                },
                {
                  value:
                    "organization_admin",
                  label:
                    "Organization Admin",
                },
                {
                  value: "member",
                  label:
                    "Organization Member",
                },
                {
                  value: "guest",
                  label:
                    "Organization Viewer",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setRoleFilter(
                      option.value
                    );
                    setRoleDropdownOpen(
                      false
                    );
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs transition ${
                    roleFilter ===
                    option.value
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {option.label}

                  {roleFilter ===
                    option.value && (
                    <Check
                      size={14}
                      className="text-indigo-400"
                    />
                  )}
                </button>
              ))}

            </div>
          )}

        </div>

      </section>


      {/* COUNT */}

      <div className="mb-4">
        <p className="text-xs text-slate-600">
          <span className="font-medium text-slate-400">
            {filteredMembers.length}
          </span>{" "}
          {filteredMembers.length === 1
            ? "member"
            : "members"}
        </p>
      </div>


      {/* TABLE */}

      <section className="overflow-visible rounded-xl border border-slate-800 bg-slate-950/30">

        {/* HEADER */}

        <div className="hidden grid-cols-[minmax(300px,1fr)_190px_120px_150px_45px] items-center border-b border-slate-800 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 md:grid">

          <span>Member</span>
          <span>Organization Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span />

        </div>


        {/* CONTENT */}

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
              onClick={() =>
                fetchMembers()
              }
              className="mt-4 text-xs font-medium text-indigo-400"
            >
              Try again
            </button>

          </div>

        ) : filteredMembers.length === 0 ? (

          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
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
              onClick={resetFilters}
              className="mt-4 text-xs font-medium text-indigo-400"
            >
              Clear filters
            </button>

          </div>

        ) : (

          <div className="divide-y divide-slate-800">

            {filteredMembers.map(
              (member, index) => {

                const memberId =
                  member.id ||
                  member._id;

                const name =
                  member.name ||
                  member.user?.name ||
                  "Unknown user";

                const email =
                  member.email ||
                  member.user?.email ||
                  "—";

                const role =
                  member.role ||
                  "member";

                const canManage =
                  isOrganizationAdmin;

                return (
                  <div
                    key={memberId}
                    className="group px-4 py-4 md:px-5"
                  >

                    <div className="flex items-center gap-4">

                      {/* AVATAR */}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          index % 3 === 0
                            ? "bg-indigo-500/10 text-indigo-400"
                            : index % 3 === 1
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-violet-500/10 text-violet-400"
                        }`}
                      >
                        {name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(
                            (part) =>
                              part
                                .charAt(0)
                                .toUpperCase()
                          )
                          .join("")}
                      </div>


                      {/* USER */}

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-xs font-semibold text-slate-300">
                          {name}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-600">
                          {email}
                        </p>

                      </div>


                      {/* ROLE */}

                      <div className="hidden w-48 md:block">

                        <span className="inline-flex rounded-full bg-indigo-500/10 px-2.5 py-1 text-[9px] font-semibold text-indigo-400">
                          {getRoleLabel(
                            role
                          )}
                        </span>

                      </div>


                      {/* STATUS */}

                      <div className="hidden w-28 md:block">

                        <span
                          className={`text-[10px] ${
                            member.status ===
                            "Active"
                              ? "text-emerald-400"
                              : "text-slate-600"
                          }`}
                        >
                          ●{" "}
                          {member.status ||
                            "Active"}
                        </span>

                      </div>


                      {/* JOINED */}

                      <div className="hidden w-36 text-[10px] text-slate-600 md:block">
                        {member.joinedAt
                          ? new Date(
                              member.joinedAt
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month:
                                  "short",
                                day:
                                  "numeric",
                                year:
                                  "numeric",
                              }
                            )
                          : "—"}
                      </div>


                      {/* ACTIONS */}

                      {canManage ? (
                        <div className="relative">

                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  memberId
                                  ? null
                                  : memberId
                              )
                            }
                            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                          >
                            <MoreHorizontal
                              size={16}
                            />
                          </button>


                          {openMenuId ===
                            memberId && (
                            <div className="absolute right-0 top-9 z-50 w-48 overflow-hidden rounded-xl border border-slate-800 bg-[#080d1f] p-1.5 shadow-2xl">

                              {/* MEMBER */}

                              {role !==
                                "member" && (
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading
                                  }
                                  onClick={() =>
                                    handleRoleChange(
                                      memberId,
                                      "member"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                >
                                  <User
                                    size={14}
                                  />
                                  Make Member
                                </button>
                              )}


                              {/* VIEWER */}

                              {role !==
                                "guest" && (
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading
                                  }
                                  onClick={() =>
                                    handleRoleChange(
                                      memberId,
                                      "guest"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                >
                                  <User
                                    size={14}
                                  />
                                  Make Viewer
                                </button>
                              )}


                              {/* ADMIN */}

                              {isOrganizationAdmin &&
                                role !==
                                  "organization_admin" && (
                                  <button
                                    type="button"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleRoleChange(
                                        memberId,
                                        "organization_admin"
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                  >
                                    <ShieldCheck
                                      size={14}
                                    />
                                    Make Admin
                                  </button>
                                )}


                              {/* REMOVE */}

                              {role !==
                                "organization_admin" && (
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading
                                  }
                                  onClick={() =>
                                    handleRemoveMember(
                                      memberId
                                    )
                                  }
                                  className="flex w-full items-center gap-2 border-t border-slate-800 px-3 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/5"
                                >
                                  <UserMinus
                                    size={14}
                                  />
                                  Suspend Member
                                </button>
                              )}

                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="w-6" />
                      )}

                    </div>


                    {/* MOBILE META */}

                    <div className="mt-3 flex items-center gap-2 pl-14 md:hidden">

                      <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[9px] font-semibold text-indigo-400">
                        {getRoleLabel(
                          role
                        )}
                      </span>

                      <span className="text-[9px] text-slate-600">
                        {member.status ||
                          "Active"}
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>


      {/* INVITE MODAL */}

      {inviteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setInviteOpen(false)
            }
            className="absolute inset-0"
          />


          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#080d1d] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">

              <div>

                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Mail
                    size={17}
                    className="text-indigo-400"
                  />
                </div>

                <h2 className="text-base font-semibold text-white">
                  Add organization member
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add an existing COLLABSPHERE user to this organization.
                  The selected organization role controls their access.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setInviteOpen(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              >
                <X size={17} />
              </button>

            </div>


            <form
              onSubmit={handleInvite}
              className="p-6"
            >

              {inviteError && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                  {inviteError}
                </div>
              )}


              {/* EMAIL */}

              <label className="mb-2 block text-xs font-medium text-slate-300">
                Email address
              </label>

              <input
                type="email"
                value={inviteEmail}
                onChange={(event) =>
                  setInviteEmail(
                    event.target.value
                  )
                }
                placeholder="member@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />


              {/* ROLE */}

              <div className="mt-5">

                <label className="mb-2 block text-xs font-medium text-slate-300">
                  Organization role
                </label>

                <select
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="organization_admin">
                    Organization Admin
                  </option>

                  <option value="member">
                    Organization Member
                   </option>

                  <option value="guest">
                    Organization Viewer
                  </option>
                </select>

              </div>


              {/* INFO */}

              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/50 p-3">

                <p className="text-[10px] leading-5 text-slate-500">
                  Choose the organization role this member should receive.
                  Organization Admins have full organization management access.
                </p>

              </div>


              {/* ACTIONS */}

              <div className="mt-6 flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setInviteOpen(false)
                  }
                  className="rounded-lg border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Mail size={13} />

                  {submitting
                    ? "Adding..."
                    : "Add Member"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};


export default OrganizationMembers;