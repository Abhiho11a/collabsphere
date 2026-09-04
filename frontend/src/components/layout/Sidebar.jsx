import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  FolderOpen,
  MessageSquare,
  Bell,
  BarChart3,
  Activity,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  Users,
  User,
} from "lucide-react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";

import CreateOrganizationModal
  from "../organization/CreateOrganizationModal";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// SIDEBAR
// =====================================================

const Sidebar = ({
  onNavigate,
}) => {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    logout,
  } = useAuth();


  // =====================================================
  // ORGANIZATION STATE
  // =====================================================

  const [
    organizations,
    setOrganizations,
  ] = useState([]);


  const [
    currentOrganization,
    setCurrentOrganization,
  ] = useState(null);


  const [
    showOrganizationMenu,
    setShowOrganizationMenu,
  ] = useState(false);


  const [
    showCreateOrganization,
    setShowCreateOrganization,
  ] = useState(false);


  // =====================================================
  // FETCH ORGANIZATIONS
  // =====================================================

  useEffect(() => {

    const fetchOrganizations =
      async () => {

        try {

          const response =
            await fetch(
              `${API_BASE_URL}/organizations`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data?.message ||
                "Failed to fetch organizations"
            );

          }


          const organizationList =
            Array.isArray(
              data?.organizations
            )
              ? data.organizations
              : [];


          setOrganizations(
            organizationList
          );


          // ==========================================
          // RESTORE SAVED ORGANIZATION
          // ==========================================

          const savedOrganizationId =
            localStorage.getItem(
              "currentOrganizationId"
            );


          const savedOrganization =
            organizationList.find(
              (organization) =>
                String(
                  organization.id
                ) ===
                String(
                  savedOrganizationId
                )
            );


          // ==========================================
          // USE SAVED ORGANIZATION
          // ==========================================

          if (savedOrganization) {

            setCurrentOrganization(
              savedOrganization
            );

          }

          // ==========================================
          // OTHERWISE SELECT FIRST ORGANIZATION
          // ==========================================

          else if (
            organizationList.length > 0
          ) {

            const firstOrganization =
              organizationList[0];


            setCurrentOrganization(
              firstOrganization
            );


            localStorage.setItem(
              "currentOrganizationId",
              firstOrganization.id
            );

            localStorage.setItem(
              "currentOrganizationRole",
              firstOrganization.role
            );


            // Notify the rest of application
            window.dispatchEvent(
              new Event(
                "organizationChanged"
              )
            );

          }

        } catch (error) {

          console.error(
            "Failed to fetch organizations:",
            error
          );

        }

      };


    if (user) {
      fetchOrganizations();
    }


     const handleOrganizationChanged = () => {
    if (user) {
      fetchOrganizations();
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

  }, [user]);


  // =====================================================
  // NAVIGATION
  // =====================================================

  const mainNavigation = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },

    {
      label: "Workspaces",
      icon: Building2,
      path: "/workspaces",
    },

    {
      label: "Projects",
      icon: FolderKanban,
      path: "/projects",
    },

    {
      label: "Tasks",
      icon: CheckSquare,
      path: "/tasks",
    },

    {
      label: "Documents",
      icon: FileText,
      path: "/documents",
    },

    {
      label: "Files",
      icon: FolderOpen,
      path: "/files",
    },

    {
      label: "Chat",
      icon: MessageSquare,
      path: "/chat",
    },
  ];


  const insightNavigation = [
    {
      label: "Notifications",
      icon: Bell,
      path: "/notifications",
      badge: 3,
    },

    // {
    //   label: "Analytics",
    //   icon: BarChart3,
    //   path: "/analytics",
    // },

    // {
    //   label: "Activity",
    //   icon: Activity,
    //   path: "/activity",
    // },
  ];


  const bottomNavigation = [
    {
      label: "Account Settings",
      icon: User,
      path: "/settings",
    },
  ];

  const organizationNavigation = [
  {
    label: "Members",
    icon: Users,
    path: "/organization/members",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/organization/settings",
  },
];


  // =====================================================
  // ACTIVE ROUTE
  // =====================================================

  const isActive = (path) => {
    return (
      location.pathname === path
    );
  };


  // =====================================================
  // NAVIGATE
  // =====================================================

  const handleNavigation = (
    item
  ) => {

    navigate(item.path);

    if (onNavigate) {
      onNavigate();
    }

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout =
    async () => {

      await logout();

      localStorage.removeItem(
        "currentOrganizationId"
      );
      localStorage.removeItem(
        "currentOrganizationRole"
      );

      navigate("/login");

      if (onNavigate) {
        onNavigate();
      }

    };


  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials =
    (name = "") => {

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


  const userInitials =
    getInitials(
      user?.name
    ) || "U";


  // =====================================================
  // NAVIGATION ITEM
  // =====================================================

  const renderNavigationItem =
    (item) => {

      const Icon =
        item.icon;

      const active =
        isActive(item.path);


      return (
        <button
          key={item.label}
          type="button"
          onClick={() =>
            handleNavigation(item)
          }
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-indigo-500/10 text-indigo-400"
              : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
          }`}
        >

          <Icon
            size={18}
            strokeWidth={
              active
                ? 2.2
                : 1.8
            }
            className={`shrink-0 transition-colors ${
              active
                ? "text-indigo-400"
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          />


          <span className="flex-1 text-left">
            {item.label}
          </span>


          {item.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500/15 px-1.5 text-[11px] font-semibold text-indigo-400">
              {item.badge}
            </span>
          )}

        </button>
      );

    };


  // =====================================================
  // SELECT ORGANIZATION
  // =====================================================

  const handleOrganizationSelect =
    (organization) => {

      if (!organization?.id) {
        return;
      }


      // ----------------------------------------------
      // Prevent unnecessary reload
      // ----------------------------------------------

      if (
        currentOrganization?.id ===
        organization.id
      ) {

        setShowOrganizationMenu(
          false
        );

        return;
      }


      // ----------------------------------------------
      // Update state
      // ----------------------------------------------

      setCurrentOrganization(
        organization
      );

      // ----------------------------------------------
      // Persist selection
      // ----------------------------------------------

      localStorage.setItem(
        "currentOrganizationId",
        organization.id
      );

      localStorage.setItem(
        "currentOrganizationRole",
        organization.role
      );


      // ----------------------------------------------
      // Close dropdown
      // ----------------------------------------------

      setShowOrganizationMenu(
        false
      );


      // ----------------------------------------------
      // Tell application that
      // organization changed
      // ----------------------------------------------

      window.dispatchEvent(
        new Event(
          "organizationChanged"
        )
      );

    };


  // =====================================================
  // CREATE ORGANIZATION
  // =====================================================

  const handleOrganizationCreated =
    (organization) => {

      if (!organization?.id) {
        return;
      }


      setOrganizations(
        (prev) => [
          organization,
          ...prev,
        ]
      );


      setCurrentOrganization(
        organization
      );


      localStorage.setItem(
        "currentOrganizationId",
        organization.id
      );

      localStorage.setItem(
        "currentOrganizationRole",
        organization.role
      );

      window.dispatchEvent(
        new Event(
          "organizationChanged"
        )
      );

    };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950">

      {/* =================================================
          LOGO
      ================================================= */}

      <div className="flex h-16 items-center border-b border-slate-800 px-5">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <span className="text-sm font-bold text-white">
              C
            </span>
          </div>


          <div>

            <h1 className="text-base font-bold tracking-tight text-white">
              COLLAB
              <span className="text-indigo-400">
                SPHERE
              </span>
            </h1>

            <p className="text-[10px] text-slate-500">
              Collaborative Workspace
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          CURRENT ORGANIZATION
      ================================================= */}

      <div className="relative border-b border-slate-800 p-3">

        <button
          type="button"
          onClick={() =>
            setShowOrganizationMenu(
              (prev) => !prev
            )
          }
          className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-left transition hover:border-slate-700 hover:bg-slate-900"
        >

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">

            <Building2
              size={16}
              className="text-indigo-400"
            />

          </div>


          <div className="min-w-0 flex-1">

            <p className="truncate text-[11px] text-slate-500">
              Current Organization
            </p>

            <p className="truncate text-sm font-semibold text-slate-200">
              {currentOrganization?.name ||
                "Select organization"}
            </p>

          </div>


          <ChevronDown
            size={16}
            className={`shrink-0 text-slate-500 transition-transform ${
              showOrganizationMenu
                ? "rotate-180"
                : ""
            }`}
          />

        </button>


        {/* =================================================
            ORGANIZATION MENU
        ================================================= */}

        {showOrganizationMenu && (

          <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="border-b border-slate-800 px-3 py-2">

              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Organizations
              </p>

            </div>


            <div className="max-h-60 overflow-y-auto p-2">

              {organizations.length === 0 ? (

                <div className="px-3 py-4 text-center">

                  <p className="text-xs text-slate-500">
                    No organizations yet
                  </p>

                </div>

              ) : (

                organizations.map(
                  (organization) => (

                    <button
                      key={organization.id}
                      type="button"
                      onClick={() =>
                        handleOrganizationSelect(
                          organization
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-800"
                    >

                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/10">

                        <Building2
                          size={15}
                          className="text-indigo-400"
                        />

                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-medium text-slate-200">
                          {organization.name}
                        </p>


                        <p className="text-[11px] text-slate-500">

                          {organization.role ===
                            "organization_admin"
                              ? "Organization Admin"
                              : organization.role ===
                                "guest"
                              ? "Organization Viewer"
                              : "Organization Member"}

                        </p>

                      </div>


                      {currentOrganization?.id ===
                        organization.id && (

                        <span className="text-indigo-400">
                          ✓
                        </span>

                      )}

                    </button>

                  )
                )

              )}

            </div>


            {/* =================================================
                CREATE ORGANIZATION
            ================================================= */}

            <div className="border-t border-slate-800 p-2">

              <button
                type="button"
                onClick={() => {

                  setShowOrganizationMenu(
                    false
                  );

                  setShowCreateOrganization(
                    true
                  );

                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-indigo-500/10 hover:text-indigo-400"
              >

                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10">

                  <Plus size={15} />

                </div>

                Create organization

              </button>

            </div>

          </div>

        )}

      </div>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="flex-1 overflow-y-auto px-3 py-4">

        <div>

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Workspace
          </p>


          <nav className="space-y-1">
            {mainNavigation.map(
              renderNavigationItem
            )}
          </nav>

        </div>
        

        <div className="mt-7">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Organization
          </p>

          <nav className="space-y-1">
            {organizationNavigation.map(
              renderNavigationItem
            )}
          </nav>

        </div>


        <div className="mt-7">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Insights
          </p>


          <nav className="space-y-1">
            {insightNavigation.map(
              renderNavigationItem
            )}
          </nav>

        </div>

      </div>


      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <div className="border-t border-slate-800 px-3 py-3">

        <nav className="space-y-1">

          {bottomNavigation.map(
            renderNavigationItem
          )}

        </nav>

      </div>


      {/* =================================================
          USER
      ================================================= */}

      <div className="border-t border-slate-800 p-3">

        <div className="flex items-center gap-3 rounded-lg px-2 py-2">

          {user?.avatar ? (

            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />

          ) : (

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
              {userInitials}
            </div>

          )}


          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-slate-200">
              {user?.name ||
                "User"}
            </p>

            <p className="truncate text-xs text-slate-500">

              {user?.provider ===
              "google"
                ? "Google account"
                : "Member"}

            </p>

          </div>


          <button
            type="button"
            onClick={
              handleLogout
            }
            title="Logout"
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >

            <LogOut
              size={16}
            />

          </button>

        </div>

      </div>


      {/* =================================================
          CREATE ORGANIZATION MODAL
      ================================================= */}

      <CreateOrganizationModal
        isOpen={
          showCreateOrganization
        }
        onClose={() =>
          setShowCreateOrganization(
            false
          )
        }
        onCreated={
          handleOrganizationCreated
        }
      />

    </aside>

  );
};


export default Sidebar;