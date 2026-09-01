import {
  ChevronRight,
  Home,
} from "lucide-react";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";


// ==========================================
// API
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// ==========================================
// BREADCRUMBS
// ==========================================

const Breadcrumbs = () => {
  const location = useLocation();

  const {
    workspaceId,
    projectId,
  } = useParams();


  // ==========================================
  // STATE
  // ==========================================

  const [workspaceName, setWorkspaceName] =
    useState("Workspace");

  const [projectName, setProjectName] =
    useState("Project");


  // ==========================================
  // FETCH WORKSPACE / PROJECT NAMES
  // ==========================================

  useEffect(() => {

    const loadNames = async () => {

      try {

        // --------------------------------------
        // FETCH WORKSPACE
        // --------------------------------------

        if (workspaceId) {

          const workspaceResponse =
            await fetch(
              `${API_BASE_URL}/workspaces/${workspaceId}`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  Accept: "application/json",
                },
              }
            );


          if (workspaceResponse.ok) {

            const workspaceData =
              await workspaceResponse.json();


            const workspace =
              workspaceData?.workspace ||
              workspaceData?.data ||
              workspaceData;


            if (workspace?.name) {
              setWorkspaceName(
                workspace.name
              );
            }
          }
        }


        // --------------------------------------
        // FETCH PROJECT
        // --------------------------------------

        if (
          workspaceId &&
          projectId
        ) {

          const projectResponse =
            await fetch(
              `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  Accept: "application/json",
                },
              }
            );


          if (projectResponse.ok) {

            const projectData =
              await projectResponse.json();


            const project =
              projectData?.project ||
              projectData?.data ||
              projectData;


            if (project?.name) {
              setProjectName(
                project.name
              );
            }
          }
        }

      } catch (error) {

        console.error(
          "Breadcrumb fetch error:",
          error
        );

      }

    };


    loadNames();

  }, [
    workspaceId,
    projectId,
  ]);


  // ==========================================
  // CURRENT PATH
  // ==========================================

  const pathname =
    location.pathname;


  // ==========================================
  // BREADCRUMB BUILDER
  // ==========================================

  const buildBreadcrumbs = () => {

    // ----------------------------------------
    // DASHBOARD
    // ----------------------------------------

    if (
      pathname === "/dashboard"
    ) {
      return [];
    }


    // ----------------------------------------
    // WORKSPACES
    // ----------------------------------------

    if (
      pathname === "/workspaces"
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },
      ];

    }


    // ----------------------------------------
    // WORKSPACE DETAILS
    // ----------------------------------------

    if (
      pathname ===
      `/workspaces/${workspaceId}`
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },

        {
          label: workspaceName,
          path:
            `/workspaces/${workspaceId}`,
        },
      ];

    }


    // ----------------------------------------
    // WORKSPACE MEMBERS
    // ----------------------------------------

    if (
      pathname ===
      `/workspaces/${workspaceId}/members`
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },

        {
          label: workspaceName,
          path:
            `/workspaces/${workspaceId}`,
        },

        {
          label: "Members",
          path:
            `/workspaces/${workspaceId}/members`,
        },
      ];

    }


    // ----------------------------------------
    // PROJECTS LIST
    // ----------------------------------------

    if (
      pathname ===
      `/workspaces/${workspaceId}/projects`
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },

        {
          label: workspaceName,
          path:
            `/workspaces/${workspaceId}`,
        },

        {
          label: "Projects",
          path:
            `/workspaces/${workspaceId}/projects`,
        },
      ];

    }


    // ----------------------------------------
    // PROJECT DETAILS
    // ----------------------------------------

    if (
      pathname ===
      `/workspaces/${workspaceId}/projects/${projectId}`
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },

        {
          label: workspaceName,
          path:
            `/workspaces/${workspaceId}`,
        },

        {
          label: "Projects",
          path:
            `/workspaces/${workspaceId}/projects`,
        },

        {
          label: projectName,
          path:
            `/workspaces/${workspaceId}/projects/${projectId}`,
        },
      ];

    }


    // ----------------------------------------
    // KANBAN BOARD
    // ----------------------------------------

    if (
      pathname ===
      `/workspaces/${workspaceId}/projects/${projectId}/board`
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },

        {
          label: workspaceName,
          path:
            `/workspaces/${workspaceId}`,
        },

        {
          label: "Projects",
          path:
            `/workspaces/${workspaceId}/projects`,
        },

        {
          label: projectName,
          path:
            `/workspaces/${workspaceId}/projects/${projectId}`,
        },

        {
          label: "Kanban Board",
          path:
            `/workspaces/${workspaceId}/projects/${projectId}/board`,
        },
      ];

    }


    // ----------------------------------------
    // PROJECT CHAT
    // ----------------------------------------

    if (
      pathname ===
      `/workspaces/${workspaceId}/projects/${projectId}/chat`
    ) {

      return [
        {
          label: "Workspaces",
          path: "/workspaces",
        },

        {
          label: workspaceName,
          path:
            `/workspaces/${workspaceId}`,
        },

        {
          label: "Projects",
          path:
            `/workspaces/${workspaceId}/projects`,
        },

        {
          label: projectName,
          path:
            `/workspaces/${workspaceId}/projects/${projectId}`,
        },

        {
          label: "Project Chat",
          path:
            `/workspaces/${workspaceId}/projects/${projectId}/chat`,
        },
      ];

    }


    // ----------------------------------------
    // DEFAULT
    // ----------------------------------------

    return [];

  };


  const breadcrumbs =
    buildBreadcrumbs();


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-3 sm:px-8 lg:px-10">

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap"
      >

        {/* ==================================
            HOME
        =================================== */}

        <Link
          to="/dashboard"
          className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-300"
        >

          <Home size={13} />

          <span>
            Dashboard
          </span>

        </Link>


        {/* ==================================
            OTHER BREADCRUMBS
        =================================== */}

        {breadcrumbs.map(
          (breadcrumb, index) => {

            const isLast =
              index ===
              breadcrumbs.length - 1;


            return (

              <div
                key={breadcrumb.path}
                className="flex shrink-0 items-center gap-1.5"
              >

                <ChevronRight
                  size={13}
                  className="text-slate-700"
                />


                {isLast ? (

                  <span className="text-xs font-medium text-indigo-400">
                    {breadcrumb.label}
                  </span>

                ) : (

                  <Link
                    to={breadcrumb.path}
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-300"
                  >
                    {breadcrumb.label}
                  </Link>

                )}

              </div>

            );

          }
        )}

      </nav>

    </div>

  );

};


export default Breadcrumbs;