import {
  Building2,
  Check,
  Copy,
  Eye,
  Save,
  ShieldCheck,
  Workflow,
  Lock,
  CheckCircle2,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// DEFAULT PERMISSIONS
// =====================================================

const DEFAULT_PERMISSIONS = {
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


// =====================================================
// ROLE CONFIG
// =====================================================

const ROLE_CONFIG = {
  organization_admin: {
    label: "Organization Admin",
    shortLabel: "Admin",
    description:
      "Full organization management access.",
    icon: ShieldCheck,
  },

  member: {
    label: "Organization Member",
    shortLabel: "Member",
    description:
      "Can work across the organization.",
    icon: Workflow,
  },

  guest: {
    label: "Organization Viewer",
    shortLabel: "Viewer",
    description:
      "Read-only organization access.",
    icon: Eye,
  },
};


// =====================================================
// DEEP CLONE
// =====================================================

const clonePermissions = (
  permissions
) => {
  return JSON.parse(
    JSON.stringify(permissions)
  );
};


// =====================================================
// NORMALIZE PERMISSIONS
// =====================================================
//
// Protects the frontend from incomplete settings
// returned by older organizations.
//

const normalizePermissions = (
  incoming
) => {

  const source =
    incoming || {};

  return {
    organization_admin: {
      ...DEFAULT_PERMISSIONS
        .organization_admin,

      ...(source.organization_admin || {}),

      // Admin permissions can never be disabled.
      createWorkspace: true,
      inviteMembers: true,
      manageMembers: true,
    },

    member: {
      ...DEFAULT_PERMISSIONS.member,
      ...(source.member || {}),
    },

    guest: {
      ...DEFAULT_PERMISSIONS.guest,
      ...(source.guest || {}),
    },
  };
};


// =====================================================
// COMPONENT
// =====================================================

const OrganizationSettings = () => {


    // ===================================================
    // ORGANIZATION
    // ===================================================

    const [
    organizationId,
    setOrganizationId,
    ] = useState(
    () =>
        localStorage.getItem(
        "currentOrganizationId"
        ) || ""
    );


    const [
    organizationRole,
    setOrganizationRole,
    ] = useState(
    () =>
        localStorage.getItem(
        "currentOrganizationRole"
        ) || ""
    );


    const [
    organizationName,
    setOrganizationName,
    ] = useState("Organization");

    const [editingName, setEditingName] =
    useState(false);

    const [nameInput, setNameInput] =
    useState("");

    const [nameSaving, setNameSaving] =
    useState(false);

    const [deleteOpen, setDeleteOpen] =
    useState(false);

    const [deleteConfirmName, setDeleteConfirmName] =
    useState("");

    const [deleting, setDeleting] =
    useState(false);


  // ===================================================
  // PERMISSIONS
  // ===================================================

  const [
    permissions,
    setPermissions,
  ] = useState(
    clonePermissions(
      DEFAULT_PERMISSIONS
    )
  );


  const [
    savedPermissions,
    setSavedPermissions,
  ] = useState(
    clonePermissions(
      DEFAULT_PERMISSIONS
    )
  );


  // ===================================================
  // UI STATE
  // ===================================================

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");


  const [
    copied,
    setCopied,
  ] = useState(false);


  // ===================================================
  // DERIVED STATE
  // ===================================================

  const isAdmin =
    organizationRole ===
    "organization_admin";


  const hasChanges =
    JSON.stringify(
      permissions
    ) !==
    JSON.stringify(
      savedPermissions
    );


  // ===================================================
  // LOAD ORGANIZATION + SETTINGS
  // ===================================================

  const loadOrganizationSettings =
    async (selectedId) => {

      if (!selectedId) {

        setLoading(false);

        return;
      }


      try {

        setLoading(true);
        setError("");
        setSaveMessage("");


        // ---------------------------------------------
        // GET ORGANIZATION SETTINGS
        // ---------------------------------------------

        const response =
          await fetch(
            `${API_BASE_URL}/organizations/${selectedId}/settings`,
            {
              method: "GET",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
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
              "Unable to load organization settings."
          );

        }


        // ---------------------------------------------
        // ORGANIZATION INFO
        // ---------------------------------------------

        if (
          data.organization
        ) {

          setOrganizationName(
            data.organization.name ||
              "Organization"
          );

        }


        // ---------------------------------------------
        // ORGANIZATION ROLE
        // ---------------------------------------------

        if (
          data.role
        ) {

          setOrganizationRole(
            data.role
          );

          localStorage.setItem(
            "currentOrganizationRole",
            data.role
          );

        }


        // ---------------------------------------------
        // PERMISSIONS
        // ---------------------------------------------

        const normalized =
          normalizePermissions(
            data.settings
              ?.permissions
          );


        setPermissions(
          clonePermissions(
            normalized
          )
        );


        setSavedPermissions(
          clonePermissions(
            normalized
          )
        );


      } catch (error) {

        console.error(
          "Load organization settings error:",
          error
        );


        setError(
          error?.message ||
            "Unable to load organization settings."
        );


        // -------------------------------------------
        // FALLBACK TO DEFAULTS
        // -------------------------------------------

        const defaults =
          clonePermissions(
            DEFAULT_PERMISSIONS
          );


        setPermissions(
          defaults
        );


        setSavedPermissions(
          defaults
        );


      } finally {

        setLoading(false);

      }

    };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    const id =
      localStorage.getItem(
        "currentOrganizationId"
      ) || "";


    const role =
      localStorage.getItem(
        "currentOrganizationRole"
      ) || "";


    setOrganizationId(id);
    setOrganizationRole(role);


    if (id) {

      loadOrganizationSettings(
        id
      );

    } else {

      setLoading(false);

    }

  }, []);


  // ===================================================
  // ORGANIZATION CHANGE
  // ===================================================

  useEffect(() => {

    const handleOrganizationChanged =
      () => {

        const newId =
          localStorage.getItem(
            "currentOrganizationId"
          ) || "";


        const newRole =
          localStorage.getItem(
            "currentOrganizationRole"
          ) || "";


        setOrganizationId(
          newId
        );


        setOrganizationRole(
          newRole
        );


        setSaveMessage("");
        setError("");


        if (newId) {

          loadOrganizationSettings(
            newId
          );

        } else {

          setLoading(false);

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


  // ===================================================
  // TOGGLE PERMISSION
  // ===================================================

  const togglePermission = (
    role,
    permission
  ) => {

    // Only organization admins can
    // modify permissions.

    if (!isAdmin) {
      return;
    }


    // Organization Admin permissions
    // are permanently protected.

    if (
      role ===
      "organization_admin"
    ) {

      return;

    }


    setPermissions(
      (previous) => {

        const updated = {
          ...previous,

          [role]: {
            ...previous[role],

            [permission]:
              !previous[role][
                permission
              ],
          },
        };


        return updated;

      }
    );


    setSaveMessage("");
    setError("");

  };

  const handleUpdateName = async () => {
  if (!isAdmin) {
    return;
  }

  const trimmedName =
    nameInput.trim();

  if (!trimmedName) {
    setError(
      "Organization name is required."
    );
    return;
  }

  if (trimmedName.length < 2) {
    setError(
      "Organization name must contain at least 2 characters."
    );
    return;
  }

  try {
    setNameSaving(true);
    setError("");
    setSaveMessage("");

    const response = await fetch(
      `${API_BASE_URL}/organizations/${organizationId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
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
          "Unable to update organization name."
      );
    }

    const updatedName =
      data.organization?.name ||
      trimmedName;

    setOrganizationName(
      updatedName
    );

    setNameInput(
      updatedName
    );

    setEditingName(false);

    setSaveMessage(
      "Organization name updated successfully."
    );

    // Keep sidebar organization name in sync
    window.dispatchEvent(
      new Event(
        "organizationChanged"
      )
    );
  } catch (error) {
    console.error(
      "Update organization name error:",
      error
    );

    setError(
      error?.message ||
        "Unable to update organization name."
    );
  } finally {
    setNameSaving(false);
  }
};


  // ===================================================
  // SAVE SETTINGS
  // ===================================================

  const handleSave = async () => {

    if (!isAdmin) {
      return;
    }


    if (!organizationId) {

      setError(
        "No organization selected."
      );

      return;

    }


    try {

      setSaving(true);
      setError("");
      setSaveMessage("");


      // ---------------------------------------------
      // SAFETY: ALWAYS KEEP ADMIN FULL ACCESS
      // ---------------------------------------------

      const permissionsToSave =
        normalizePermissions(
          permissions
        );


      // ---------------------------------------------
      // PATCH SETTINGS
      // ---------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/organizations/${organizationId}/settings`,
          {
            method: "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              permissions:
                permissionsToSave,
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
            "Unable to save organization settings."
        );

      }


      // ---------------------------------------------
      // USE SERVER RESPONSE
      // ---------------------------------------------

      const updatedPermissions =
        normalizePermissions(
          data.settings
            ?.permissions
        );


      setPermissions(
        clonePermissions(
          updatedPermissions
        )
      );


      setSavedPermissions(
        clonePermissions(
          updatedPermissions
        )
      );


      setSaveMessage(
        "Changes saved successfully."
      );


    } catch (error) {

      console.error(
        "Save organization settings error:",
        error
      );


      setError(
        error?.message ||
          "Unable to save changes."
      );


    } finally {

      setSaving(false);

    }

  };


  // ===================================================
  // DISCARD CHANGES
  // ===================================================

  const handleDiscard = () => {

    setPermissions(
      clonePermissions(
        savedPermissions
      )
    );

    setError("");
    setSaveMessage("");

  };


  // ===================================================
  // REFRESH SETTINGS
  // ===================================================

  const handleRefresh = () => {

    if (!organizationId) {
      return;
    }

    loadOrganizationSettings(
      organizationId
    );

  };


  // ===================================================
  // COPY ORGANIZATION ID
  // ===================================================

  const handleCopyId = async () => {

    if (!organizationId) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        organizationId
      );


      setCopied(true);


      setTimeout(() => {

        setCopied(false);

      }, 1600);


    } catch (error) {

      console.error(
        "Copy organization ID error:",
        error
      );

    }

  };

  //DELET ORGANIZATION FUNC

  const handleDeleteOrganization =
  async () => {
    if (!isAdmin) {
      return;
    }

    if (
      deleteConfirmName.trim() !==
      organizationName
    ) {
      setError(
        "Enter the exact organization name to confirm deletion."
      );
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}`,
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
            "Unable to delete organization."
        );
      }

      // Clear current organization
      localStorage.removeItem(
        "currentOrganizationId"
      );

      localStorage.removeItem(
        "currentOrganizationRole"
      );

      window.dispatchEvent(
        new Event(
          "organizationChanged"
        )
      );

      setDeleteOpen(false);

      // Navigate to a safe page
      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "Delete organization error:",
        error
      );

      setError(
        error?.message ||
          "Unable to delete organization."
      );
    } finally {
      setDeleting(false);
    }
  };


  // ===================================================
  // NO ORGANIZATION
  // ===================================================

  if (!organizationId) {

    return (
      <div className="flex min-h-[calc(100vh-100px)] items-center justify-center px-5">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">

            <Building2
              size={24}
              className="text-slate-600"
            />

          </div>


          <h2 className="mt-4 text-lg font-semibold text-white">
            No organization selected
          </h2>


          <p className="mt-2 text-sm text-slate-500">
            Select an organization from the sidebar.
          </p>

        </div>

      </div>
    );

  }


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div className="mx-auto max-w-[1450px] px-5 py-6 sm:px-7 lg:px-8">

        <div className="animate-pulse">

          <div className="mb-3 h-3 w-28 rounded bg-slate-800" />

          <div className="h-8 w-64 rounded bg-slate-800" />

          <div className="mt-2 h-4 w-80 rounded bg-slate-900" />


          <div className="mt-7 h-20 rounded-xl border border-slate-800 bg-slate-950/40" />


          <div className="mt-6 grid gap-4 xl:grid-cols-3">

            <div className="h-[350px] rounded-xl border border-slate-800 bg-slate-950/40" />

            <div className="h-[350px] rounded-xl border border-slate-800 bg-slate-950/40" />

            <div className="h-[350px] rounded-xl border border-slate-800 bg-slate-950/40" />

          </div>

        </div>

      </div>
    );

  }


  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="mx-auto max-w-[1450px] px-5 py-6 sm:px-7 lg:px-8">

      {/* ==============================================
          HEADER
      =============================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <Building2
              size={15}
              className="text-indigo-400"
            />

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Organization
            </span>

          </div>


          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Organization Settings
          </h1>


          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            Manage roles and organization-wide access.
          </p>

        </div>


        {/* CURRENT ROLE */}

        <div className="flex items-center gap-2">

          <div className="hidden text-right sm:block">

            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Your role
            </p>


            <p className="mt-1 text-xs font-medium text-slate-300">
              {getRoleLabel(
                organizationRole
              )}
            </p>

          </div>


          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">

            <ShieldCheck
              size={15}
              className="text-indigo-400"
            />


            <span className="text-xs font-medium text-slate-300">
              {isAdmin
                ? "Administrator"
                : "Read only"}
            </span>

          </div>

        </div>

      </div>
      
      {/* ==============================================
        ORGANIZATION INFO
    ============================================== */}

    <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950/40">
    <div className="flex flex-col gap-5 px-5 py-4">

        {/* TOP ROW */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* NAME */}
        <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
            <Building2
                size={18}
                className="text-indigo-400"
            />
            </div>

            <div className="min-w-0 flex-1">

            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                Organization Name
            </p>

            {!editingName ? (
                <p className="truncate text-sm font-semibold text-slate-200">
                {organizationName}
                </p>
            ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                <input
                    type="text"
                    value={nameInput}
                    onChange={(event) =>
                    setNameInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        handleUpdateName();
                    }

                    if (event.key === "Escape") {
                        setEditingName(false);
                        setNameInput(organizationName);
                        setError("");
                    }
                    }}
                    autoFocus
                    maxLength={100}
                    disabled={nameSaving}
                    className="h-9 w-full min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 sm:w-[280px]"
                    placeholder="Enter organization name"
                />

                <div className="flex items-center gap-2">

                    <button
                    type="button"
                    onClick={handleUpdateName}
                    disabled={
                        nameSaving ||
                        !nameInput.trim()
                    }
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                    {nameSaving ? (
                        <>
                        <RefreshCw
                            size={13}
                            className="animate-spin"
                        />
                        Saving
                        </>
                    ) : (
                        <>
                        <Check size={13} />
                        Save
                        </>
                    )}
                    </button>

                    <button
                    type="button"
                    onClick={() => {
                        setEditingName(false);
                        setNameInput(organizationName);
                        setError("");
                    }}
                    disabled={nameSaving}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-800 px-3 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
                    >
                    <X size={13} />
                    Cancel
                    </button>

                </div>

                </div>
            )}

            {!editingName && (
                <p className="mt-0.5 text-[10px] text-slate-600">
                Current organization
                </p>
            )}

            </div>

        </div>


        {/* ACTIONS + ID */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* EDIT */}
            {isAdmin && !editingName && (
            <button
                type="button"
                onClick={() => {
                setNameInput(organizationName);
                setEditingName(true);
                setError("");
                setSaveMessage("");
                }}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-800 px-3 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200"
            >
                <Pencil size={12} />
                Edit
            </button>
            )}

            {/* ID */}
            <div className="flex min-w-0 items-center gap-2">

            <div className="min-w-0">

                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                Organization ID
                </p>

                <p className="max-w-[260px] truncate font-mono text-[10px] text-slate-500">
                {organizationId}
                </p>

            </div>

            <button
                type="button"
                onClick={handleCopyId}
                title="Copy organization ID"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-800 text-slate-600 transition hover:bg-slate-900 hover:text-slate-300"
            >
                {copied ? (
                <Check
                    size={13}
                    className="text-emerald-400"
                />
                ) : (
                <Copy size={13} />
                )}
            </button>

            </div>

        </div>

        </div>

    </div>
    </section>


      {/* ==============================================
          PERMISSION HEADER
      =============================================== */}

      <div className="mb-4 flex items-end justify-between">

        <div>

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={17}
              className="text-indigo-400"
            />

            <h2 className="text-sm font-semibold text-slate-200">
              Roles & Permissions
            </h2>

          </div>


          <p className="mt-1 text-[10px] text-slate-600">
            Configure what each organization role can access.
          </p>

        </div>


        <div className="flex items-center gap-2">

          {/* REFRESH */}

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={loading}
            title="Refresh permissions"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-600 transition hover:bg-slate-900 hover:text-slate-300 disabled:opacity-40"
          >

            <RefreshCw
              size={13}
            />

          </button>


          {!isAdmin && (

            <div className="hidden items-center gap-1.5 text-[10px] text-amber-400 sm:flex">

              <Lock
                size={12}
              />

              Read only

            </div>

          )}

        </div>

      </div>


      {/* ==============================================
          ERROR
      =============================================== */}

      {error && (

        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">

          <p className="text-xs text-red-400">
            {error}
          </p>


          <button
            type="button"
            onClick={
              handleRefresh
            }
            className="shrink-0 text-[10px] font-medium text-red-300 hover:text-red-200"
          >
            Retry
          </button>

        </div>

      )}


      {/* ==============================================
          ROLE COLUMNS
      =============================================== */}

      <div className="grid gap-4 xl:grid-cols-3">

        <RoleColumn
          role="organization_admin"
          config={
            ROLE_CONFIG
              .organization_admin
          }
          permissions={
            permissions
              .organization_admin
          }
          isAdmin={isAdmin}
          onToggle={
            togglePermission
          }
        />


        <RoleColumn
          role="member"
          config={
            ROLE_CONFIG.member
          }
          permissions={
            permissions.member
          }
          isAdmin={isAdmin}
          onToggle={
            togglePermission
          }
        />


        <RoleColumn
          role="guest"
          config={
            ROLE_CONFIG.guest
          }
          permissions={
            permissions.guest
          }
          isAdmin={isAdmin}
          onToggle={
            togglePermission
          }
        />

      </div>


      {/* ==============================================
          ACTION BAR
      =============================================== */}

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-h-[18px]">

          {saveMessage ? (

            <div className="flex items-center gap-2 text-xs text-emerald-400">

              <CheckCircle2
                size={14}
              />

              {saveMessage}

            </div>

          ) : hasChanges ? (

            <p className="text-xs text-amber-400">
              You have unsaved changes.
            </p>

          ) : (

            <p className="text-xs text-slate-600">
              All permission changes are saved.
            </p>

          )}

        </div>


        {isAdmin && (

          <div className="flex items-center gap-2">

            {hasChanges && (

              <button
                type="button"
                disabled={saving}
                onClick={
                  handleDiscard
                }
                className="rounded-lg border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
              >
                Discard
              </button>

            )}


            <button
              type="button"
              disabled={
                saving ||
                !hasChanges
              }
              onClick={
                handleSave
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <Save
                size={14}
              />

              {saving
                ? "Saving..."
                : "Save changes"}

            </button>

          </div>

        )}

      </div>

      {/* ==============================================
        DANGER ZONE
    ============================================== */}

    {isAdmin && (
    <section className="mt-6 rounded-xl border border-red-500/20 bg-red-500/[0.025]">

        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <AlertTriangle
                size={16}
                className="text-red-400"
            />
            </div>

            <div className="min-w-0">

            <h2 className="text-sm font-semibold text-red-300">
                Danger Zone
            </h2>

            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Permanently delete this organization and remove
                its organization memberships and workspaces.
            </p>

            </div>

        </div>

        <button
            type="button"
            onClick={() => {
            setDeleteConfirmName("");
            setDeleteOpen(true);
            setError("");
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
        >
            <Trash2 size={14} />
            Delete organization
        </button>

        </div>

    </section>
    )}

    {/* ==============================================
    DELETE ORGANIZATION MODAL
============================================== */}

{deleteOpen && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !deleting) {
        setDeleteOpen(false);
        setDeleteConfirmName("");
        setError("");
      }
    }}
  >

    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">

      {/* HEADER */}
      <div className="border-b border-slate-800 px-5 py-4">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <Trash2
              size={18}
              className="text-red-400"
            />
          </div>

          <div className="min-w-0 flex-1">

            <h3 className="text-sm font-semibold text-white">
              Delete organization
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This action cannot be undone.
            </p>

          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              setDeleteOpen(false);
              setDeleteConfirmName("");
              setError("");
            }}
            className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-900 hover:text-slate-300 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>

        </div>

      </div>


      {/* CONTENT */}
      <div className="px-5 py-5">

        <div className="rounded-lg border border-red-500/15 bg-red-500/[0.035] px-4 py-3">

          <p className="text-xs leading-5 text-slate-400">
            You are about to permanently delete
            <span className="font-semibold text-red-300">
              {" "}{organizationName}
            </span>
            .
          </p>

          <p className="mt-2 text-[10px] leading-4 text-slate-600">
            This will remove the organization, its memberships,
            and its workspaces.
          </p>

        </div>


        <div className="mt-5">

          <label
            htmlFor="delete-organization-confirm"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Type the organization name to confirm
          </label>

          <input
            id="delete-organization-confirm"
            type="text"
            value={deleteConfirmName}
            onChange={(event) => {
              setDeleteConfirmName(
                event.target.value
              );
              setError("");
            }}
            disabled={deleting}
            autoFocus
            placeholder={organizationName}
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 disabled:opacity-50"
          />

          {error && (
            <p className="mt-2 text-[10px] text-red-400">
              {error}
            </p>
          )}

        </div>

      </div>


      {/* FOOTER */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">

        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            setDeleteOpen(false);
            setDeleteConfirmName("");
            setError("");
          }}
          className="rounded-lg border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            deleting ||
            deleteConfirmName.trim() !==
              organizationName
          }
          onClick={handleDeleteOrganization}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? (
            <>
              <RefreshCw
                size={13}
                className="animate-spin"
              />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={13} />
              Delete permanently
            </>
          )}
        </button>

      </div>

    </div>

  </div>
)}

    </div>
  );
};


// =====================================================
// ROLE COLUMN
// =====================================================

const RoleColumn = ({
  role,
  config,
  permissions,
  isAdmin,
  onToggle,
}) => {

  const Icon =
    config.icon;


  const isProtected =
    role ===
    "organization_admin";


  return (
    <div
      className={`overflow-hidden rounded-xl border bg-slate-950/40 transition ${
        isProtected
          ? "border-indigo-500/30"
          : "border-slate-800"
      }`}
    >

      {/* ==============================================
          ROLE HEADER
      =============================================== */}

      <div
        className={`px-5 py-5 ${
          isProtected
            ? "bg-indigo-500/[0.035]"
            : ""
        }`}
      >

        <div className="flex items-start gap-3">

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isProtected
                ? "bg-indigo-500/10"
                : "bg-slate-900"
            }`}
          >

            <Icon
              size={18}
              className={
                isProtected
                  ? "text-indigo-400"
                  : "text-slate-500"
              }
            />

          </div>


          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-sm font-semibold text-slate-200">
                {config.label}
              </h3>


              {isProtected && (

                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[8px] font-semibold text-indigo-400">
                  Protected
                </span>

              )}

            </div>


            <p className="mt-1 text-[10px] leading-4 text-slate-600">
              {config.description}
            </p>

          </div>

        </div>

      </div>


      {/* ==============================================
          PERMISSIONS
      =============================================== */}

      <div className="border-t border-slate-800">

        <PermissionItem
          label="Create Workspaces"
          description="Create new workspaces."
          enabled={
            permissions
              ?.createWorkspace === true
          }
          disabled={
            !isAdmin ||
            isProtected
          }
          onClick={() =>
            onToggle(
              role,
              "createWorkspace"
            )
          }
        />


        <PermissionItem
          label="Invite Members"
          description="Add users to the organization."
          enabled={
            permissions
              ?.inviteMembers === true
          }
          disabled={
            !isAdmin ||
            isProtected
          }
          onClick={() =>
            onToggle(
              role,
              "inviteMembers"
            )
          }
        />


        <PermissionItem
          label="Manage Members"
          description="Change roles and suspend members."
          enabled={
            permissions
              ?.manageMembers === true
          }
          disabled={
            !isAdmin ||
            isProtected
          }
          onClick={() =>
            onToggle(
              role,
              "manageMembers"
            )
          }
        />

      </div>


      {/* ==============================================
          FOOTER
      =============================================== */}

      <div className="border-t border-slate-800 px-5 py-3">

        <div className="flex items-center justify-between">

          <span className="text-[9px] uppercase tracking-wider text-slate-700">

            {isProtected
              ? "System protected"
              : isAdmin
              ? "Editable"
              : "Read only"}

          </span>


          {isProtected && (

            <Lock
              size={11}
              className="text-slate-700"
            />

          )}

        </div>

      </div>

    </div>
  );
};


// =====================================================
// PERMISSION ITEM
// =====================================================

const PermissionItem = ({
  label,
  description,
  enabled,
  disabled,
  onClick,
}) => {

  return (
    <div className="flex min-h-[78px] items-center gap-3 px-5 py-3.5">

      <div className="min-w-0 flex-1">

        <p className="text-[11px] font-medium text-slate-300">
          {label}
        </p>


        <p className="mt-1 text-[9px] leading-4 text-slate-600">
          {description}
        </p>

      </div>


      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={`${label}: ${
          enabled
            ? "enabled"
            : "disabled"
        }`}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          enabled
            ? "bg-indigo-500"
            : "bg-slate-800"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
      >

        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-[18px]"
              : "left-0.5"
          }`}
        />

      </button>


      {disabled && enabled && (

        <Lock
          size={11}
          className="shrink-0 text-slate-700"
        />

      )}

    </div>
  );
};


// =====================================================
// ROLE LABEL
// =====================================================

const getRoleLabel = (
  role
) => {

  if (
    role ===
    "organization_admin"
  ) {
    return "Organization Admin";
  }


  if (
    role === "guest"
  ) {
    return "Organization Viewer";
  }


  return "Organization Member";

};


export default OrganizationSettings;