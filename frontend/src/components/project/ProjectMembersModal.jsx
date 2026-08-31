import { useEffect, useMemo, useState } from "react";
import {
  X,
  Users,
  Search,
  Plus,
  MoreHorizontal,
  UserPlus,
  Shield,
  Loader2,
  AlertCircle,
  UserMinus,
} from "lucide-react";
import { useRef } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const ProjectMembersModal = ({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  projectName,
  currentUserId
}) => {
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("All roles");

  const [showAddMember, setShowAddMember] =
    useState(false);

  const [selectedMember, setSelectedMember] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [menuPosition, setMenuPosition] = useState(null);
  const menuRef = useRef(null);



  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!selectedMember) return;

      // Don't close if clicking inside the menu
      if (
        menuRef.current &&
        menuRef.current.contains(event.target)
      ) {
        return;
      }

      // Don't close when clicking the three-dot button
      if (
        event.target.closest(
          "[data-member-menu-trigger]"
        )
      ) {
        return;
      }

      // Otherwise close
      setSelectedMember(null);
      setMenuPosition(null);
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [selectedMember]);

  // =====================================================
  // FETCH MEMBERS
  // =====================================================

  const fetchMembers = async () => {
    if (!workspaceId || !projectId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load project members"
        );
      }

      setMembers(data.members || []);
    } catch (err) {
      console.error(
        "Fetch project members error:",
        err
      );

      setError(
        err.message ||
          "Unable to load project members"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH WHEN MODAL OPENS
  // =====================================================

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, workspaceId, projectId]);

  // =====================================================
  // FILTER MEMBERS
  // =====================================================

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        member.name
          ?.toLowerCase()
          .includes(searchValue) ||
        member.email
          ?.toLowerCase()
          .includes(searchValue);

      const matchesRole =
        roleFilter === "All roles" ||
        member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);



const projectManager = members.find(
  (member) =>
    member.role === "Project Manager"
);

const projectManagerId =
  projectManager?.user?._id ||
  projectManager?.user ||
  projectManager?.userId?._id ||
  projectManager?.userId;

const isProjectManager =
  !!currentUserId &&
  !!projectManagerId &&
  String(currentUserId) ===
    String(projectManagerId);

  // =====================================================
  // REMOVE MEMBER
  // =====================================================

  const handleRemoveMember = async (member) => {
    const confirmed = window.confirm(
      `Remove ${member.name} from this project?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members/${member.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to remove member"
        );
      }

      setSelectedMember(null);
      setMenuPosition(null);

      await fetchMembers();
    } catch (err) {
      console.error(
        "Remove project member error:",
        err
      );

      alert(
        err.message ||
          "Unable to remove project member"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // CHANGE ROLE
  // =====================================================

  const handleChangeRole = async (
    member,
    newRole
  ) => {
    if (member.role === newRole) {
      setSelectedMember(null);
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members/${member.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",

          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update role"
        );
      }

      setSelectedMember(null);
      setMenuPosition(null);

      await fetchMembers();
    } catch (err) {
      console.error(
        "Change project member role error:",
        err
      );

      alert(
        err.message ||
          "Unable to update role"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // CLOSE
  // =====================================================

  const handleClose = () => {
    if (actionLoading) return;

    setSearch("");
    setRoleFilter("All roles");
    setSelectedMember(null);
    setMenuPosition(null);
    setShowAddMember(false);

    onClose();
  };

  if (!isOpen) return null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#070b1b] shadow-2xl"
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Project Members
              </h2>

              <p className="mt-0.5 max-w-[420px] truncate text-xs text-slate-500">
                {projectName ||
                  "People working on this project"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={actionLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="flex-1 overflow-y-auto p-6">
          {/* Search + Filter */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/50 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-slate-300 outline-none focus:border-indigo-500/60"
            >
              <option>All roles</option>
              <option>Project Manager</option>
              <option>Developer</option>
              <option>Designer</option>
              <option>Reviewer</option>
              <option>Member</option>
            </select>
          </div>

          {/* Member count */}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {filteredMembers.length}{" "}
              {filteredMembers.length === 1
                ? "member"
                : "members"}
            </p>

            {(search ||
              roleFilter !== "All roles") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter(
                    "All roles"
                  );
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ================================================= */}
          {/* LOADING */}
          {/* ================================================= */}

          {loading && (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={25}
                  className="animate-spin text-indigo-400"
                />

                <p className="text-sm text-slate-500">
                  Loading members...
                </p>
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {!loading && error && (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <AlertCircle size={23} />
              </div>

              <p className="text-sm font-medium text-white">
                Unable to load members
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {error}
              </p>

              <button
                onClick={fetchMembers}
                className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* ================================================= */}
          {/* EMPTY */}
          {/* ================================================= */}

          {!loading &&
            !error &&
            filteredMembers.length === 0 && (
              <div className="flex min-h-[280px] flex-col items-center justify-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/70 text-slate-500">
                  <Users size={23} />
                </div>

                <p className="text-sm font-medium text-white">
                  No members found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Try changing your search or
                  role filter.
                </p>
              </div>
            )}

          {/* ================================================= */}
          {/* MEMBERS */}
          {/* ================================================= */}

          {!loading &&
            !error &&
            filteredMembers.length > 0 && (
              <div className="max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-800 hide-scrollbar">
                {filteredMembers.map(
                  (member, index) => (
                    <div
                      key={member.id}
                        className={`relative flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-slate-900/60 ${
                        index !==
                        filteredMembers.length -
                          1
                          ? "border-b border-slate-800"
                          : ""
                      }`}
                    >
                      {/* User */}

                      <div className="flex min-w-0 items-center gap-3">
                        {/* Avatar */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
                          {member.avatar ? (
                            <img
                              src={
                                member.avatar
                              }
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            member.name
                              ?.split(
                                " "
                              )
                              .map(
                                (part) =>
                                  part[0]
                              )
                              .join("")
                              .slice(
                                0,
                                2
                              )
                              .toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {member.name}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      {/* Right */}

                      <div className="flex shrink-0 items-center gap-3">
                        {/* Role */}

                        <span
                          className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${
                            member.role ===
                            "Project Manager"
                              ? "bg-indigo-500/10 text-indigo-400"
                              : member.role ===
                                "Developer"
                              ? "bg-blue-500/10 text-blue-400"
                              : member.role ===
                                "Designer"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {member.role}
                        </span>

                        {/* Status */}

                        <div className="hidden items-center gap-1.5 md:flex">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              member.status ===
                              "Active"
                                ? "bg-emerald-400"
                                : "bg-slate-600"
                            }`}
                          />

                          <span className="text-[11px] text-slate-500">
                            {member.status}
                          </span>
                        </div>

                        {/* Actions */}

                        {isProjectManager && (
                            <div className="relative">
                              <button
                                data-member-menu-trigger
                                onClick={(e) => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();

                                  const menuWidth = 192;
                                  const menuHeight = 300;
                                  const gap = 8;

                                  let left = rect.right - menuWidth;

                                  // Keep menu inside viewport horizontally
                                  if (left < 8) {
                                    left = 8;
                                  }

                                  if (left + menuWidth > window.innerWidth - 8) {
                                    left =
                                      window.innerWidth - menuWidth - 8;
                                  }

                                  // Open below if there is enough space
                                  // otherwise open above
                                  let top = rect.bottom + gap;

                                  if (
                                    top + menuHeight >
                                    window.innerHeight - 8
                                  ) {
                                    top =
                                      rect.top -
                                      menuHeight -
                                      gap;
                                  }

                                  // Final safety check
                                  if (top < 8) {
                                    top = 8;
                                  }

                                  setMenuPosition({
                                    top,
                                    left,
                                  });

                                  setSelectedMember(
                                    selectedMember?.id === member.id
                                      ? null
                                      : member
                                  );
                                }}
                                disabled={actionLoading}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
                              >
                                <MoreHorizontal size={17} />
                              </button>


                              {selectedMember?.id === member.id &&
                                menuPosition && (
                                  <div
                                    ref={menuRef}
                                    className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-slate-700 bg-[#0b1022] p-1.5 shadow-2xl"
                                    style={{
                                      top: `${menuPosition.top}px`,
                                      left: `${menuPosition.left}px`,
                                    }}
                                  >
                                    <div className="px-3 py-2">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                        Change role
                                      </p>
                                    </div>

                                    {[
                                      "Project Manager",
                                      "Developer",
                                      "Designer",
                                      "Reviewer",
                                      "Member",
                                    ].map((role) => (
                                      <button
                                        key={role}
                                        onClick={() =>
                                          handleChangeRole(
                                            selectedMember,
                                            role
                                          )
                                        }
                                        disabled={actionLoading}
                                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition ${
                                          selectedMember.role === role
                                            ? "bg-indigo-500/10 text-indigo-400"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                      >
                                        {role}
                                      </button>
                                    ))}

                                    <div className="my-1 border-t border-slate-800" />

                                    <button
                                      onClick={() =>
                                        handleRemoveMember(selectedMember)
                                      }
                                      disabled={actionLoading}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                                    >
                                      <UserMinus size={14} />

                                      Remove member
                                    </button>
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield size={14} />

            Project access
          </div>

          <button
            onClick={() => setShowAddMember(true)}
            disabled={!isProjectManager}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              isProjectManager
                ? "bg-indigo-500 text-white hover:bg-indigo-400"
                : "cursor-not-allowed border border-slate-700 bg-slate-800/50 text-slate-500"
            }`}
          >
            <Plus size={16} />
            Add Member
          </button>
        </div>
      </div>

      {/* =================================================== */}
      {/* ADD MEMBER MODAL */}
      {/* =================================================== */}

      {showAddMember && (
        <AddProjectMemberModal
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() =>
            setShowAddMember(false)
          }
          onSuccess={() => {
            setShowAddMember(false);
            fetchMembers();
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// ADD PROJECT MEMBER MODAL
// =====================================================

const AddProjectMemberModal = ({
  workspaceId,
  projectId,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState("Member");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(
        "Please enter the member's email."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",

          body: JSON.stringify({
            email: email.trim(),
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to add member"
        );
      }

      onSuccess();
    } catch (err) {
      console.error(
        "Add project member error:",
        err
      );

      setError(
        err.message ||
          "Unable to add member"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a0f21] p-6 shadow-2xl">
        {/* Header */}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <UserPlus size={19} />
            </div>

            <h3 className="text-lg font-semibold text-white">
              Add Project Member
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Add an existing workspace member
              to this project.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-500 transition hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Email */}

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="member@example.com"
              disabled={loading}
              autoFocus
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60 disabled:opacity-50"
            />
          </div>

          {/* Role */}

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Project role
            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              disabled={loading}
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-sm text-slate-300 outline-none focus:border-indigo-500/60"
            >
              <option value="Member">
                Member
              </option>

              <option value="Developer">
                Developer
              </option>

              <option value="Designer">
                Designer
              </option>

              <option value="Reviewer">
                Reviewer
              </option>

              <option value="Project Manager">
                Project Manager
              </option>
            </select>
          </div>

          {/* Error */}

          {error && (
            <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Adding..."
                : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectMembersModal;