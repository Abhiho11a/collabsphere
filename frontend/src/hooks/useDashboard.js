import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getWorkspaces,
  getWorkspaceProjects,
  getProjectTasks,
} from "../services/dashboardService";

import { useAuth } from "../context/AuthContext";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// =====================================================
// HOOK
// =====================================================

const useDashboard = () => {

  const { user } = useAuth();


  // =====================================================
  // ORGANIZATION
  // =====================================================

  const [
    organizationId,
    setOrganizationId,
  ] = useState(
    () =>
      localStorage.getItem(
        "currentOrganizationId"
      ) || ""
  );


  // =====================================================
  // DATA
  // =====================================================

  const [data, setData] = useState({
    organizations: [],
    workspaces: [],
    projects: [],
    tasks: [],
    members: [],
  });


  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD ORGANIZATION ID
  // =====================================================

  const loadOrganizationId =
    useCallback(() => {

      const storedOrganizationId =
        localStorage.getItem(
          "currentOrganizationId"
        ) || "";

      setOrganizationId(
        storedOrganizationId
      );

      return storedOrganizationId;

    }, []);


  // =====================================================
  // GET ORGANIZATIONS
  // =====================================================

  const getOrganizations =
    useCallback(async () => {

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


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result?.message ||
            "Unable to fetch organizations."
        );
      }


      return Array.isArray(
        result.organizations
      )
        ? result.organizations
        : [];

    }, []);


  // =====================================================
  // GET ORGANIZATION MEMBERS
  // =====================================================

  const getOrganizationMembers =
    useCallback(
      async (selectedOrganizationId) => {

        if (!selectedOrganizationId) {
          return [];
        }


        const response =
          await fetch(
            `${API_BASE_URL}/organizations/${selectedOrganizationId}/members`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );


        const result =
          await response.json();


        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result?.message ||
              "Unable to fetch organization members."
          );
        }


        return Array.isArray(
          result.members
        )
          ? result.members
          : [];

      },
      []
    );


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard =
    useCallback(
      async (
        selectedOrganizationId
      ) => {

        try {

          setLoading(true);
          setError("");


          // ---------------------------------------------
          // VALIDATE ORGANIZATION
          // ---------------------------------------------

          if (
            !selectedOrganizationId
          ) {

            setData({
              organizations: [],
              workspaces: [],
              projects: [],
              tasks: [],
              members: [],
            });

            setError(
              "Please select an organization."
            );

            return;
          }


          // ---------------------------------------------
          // ORGANIZATIONS + MEMBERS
          // ---------------------------------------------

          const [
            organizations,
            organizationMembers,
          ] = await Promise.all([
            getOrganizations(),
            getOrganizationMembers(
              selectedOrganizationId
            ),
          ]);


          // ---------------------------------------------
          // WORKSPACES
          // ---------------------------------------------

          const workspaces =
            await getWorkspaces(
              selectedOrganizationId
            );


          // ---------------------------------------------
          // PROJECTS
          // ---------------------------------------------

          const projectResults =
            await Promise.all(
              workspaces.map(
                async (workspace) => {

                  const workspaceId =
                    workspace?._id ||
                    workspace?.id;


                  if (!workspaceId) {
                    return [];
                  }


                  try {

                    const projects =
                      await getWorkspaceProjects(
                        workspaceId
                      );


                    return projects.map(
                      (project) => ({
                        ...project,
                        workspaceId,
                        workspace,
                      })
                    );

                  } catch (error) {

                    console.error(
                      `Failed to load projects for workspace ${workspaceId}:`,
                      error
                    );

                    return [];
                  }
                }
              )
            );


          const projects =
            projectResults.flat();


          // ---------------------------------------------
          // TASKS
          // ---------------------------------------------

          const taskResults =
            await Promise.all(
              projects.map(
                async (project) => {

                  const workspaceId =
                    project.workspaceId;

                  const projectId =
                    project._id ||
                    project.id;


                  if (
                    !workspaceId ||
                    !projectId
                  ) {
                    return [];
                  }


                  try {

                    const tasks =
                      await getProjectTasks(
                        workspaceId,
                        projectId
                      );


                    return tasks.map(
                      (task) => ({
                        ...task,
                        workspaceId,
                        projectId,
                        project,
                      })
                    );

                  } catch (error) {

                    console.error(
                      `Failed to load tasks for project ${projectId}:`,
                      error
                    );

                    return [];
                  }
                }
              )
            );


          const tasks =
            taskResults.flat();


          // ---------------------------------------------
          // SAVE
          // ---------------------------------------------

          setData({
            organizations,
            workspaces,
            projects,
            tasks,
            members:
              organizationMembers,
          });

        } catch (error) {

          console.error(
            "Dashboard error:",
            error
          );


          setError(
            error?.message ||
              "Unable to load dashboard."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        getOrganizations,
        getOrganizationMembers,
      ]
    );


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    const id =
      loadOrganizationId();


    if (id) {

      loadDashboard(id);

    } else {

      setLoading(false);

    }

  }, [
    loadOrganizationId,
    loadDashboard,
  ]);


  // =====================================================
  // ORGANIZATION CHANGE
  // =====================================================

  useEffect(() => {

    const handleOrganizationChanged =
      () => {

        const id =
          loadOrganizationId();


        setData({
          organizations: [],
          workspaces: [],
          projects: [],
          tasks: [],
          members: [],
        });


        if (id) {

          loadDashboard(id);

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

  }, [
    loadOrganizationId,
    loadDashboard,
  ]);


  // =====================================================
  // CURRENT USER ID
  // =====================================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.uid ||
    null;


  // =====================================================
  // STATS
  // =====================================================

  const stats =
    useMemo(() => {

      const activeProjects =
        data.projects.filter(
          (project) =>
            ![
              "completed",
              "Completed",
              "done",
            ].includes(
              project.status
            )
        ).length;


      const pendingTasks =
        data.tasks.filter(
          (task) =>
            ![
              "done",
              "completed",
            ].includes(
              String(
                task.status
              ).toLowerCase()
            )
        ).length;


      const myTasks =
        data.tasks.filter(
          (task) => {

            const assignee =
              task.assignee;


            if (!assignee) {
              return false;
            }


            const assigneeId =
              assignee?._id ||
              assignee?.id ||
              assignee?.userId ||
              assignee?.uid;


            return (
              currentUserId &&
              String(assigneeId) ===
                String(currentUserId)
            );

          }
        );


      return {
        organizations:
          data.organizations.length,

        workspaces:
          data.workspaces.length,

        projects:
          activeProjects,

        myTasks:
          myTasks.filter(
            (task) =>
              ![
                "done",
                "completed",
              ].includes(
                String(
                  task.status
                ).toLowerCase()
              )
          ).length,

        pendingTasks,

        totalTasks:
          data.tasks.length,
      };

    }, [
      data.organizations,
      data.workspaces,
      data.projects,
      data.tasks,
      currentUserId,
    ]);


  // =====================================================
  // MY TASKS
  // =====================================================

  const myTasks =
    useMemo(() => {

      return data.tasks
        .filter(
          (task) => {

            const assignee =
              task.assignee;


            if (!assignee) {
              return false;
            }


            const assigneeId =
              assignee?._id ||
              assignee?.id ||
              assignee?.userId ||
              assignee?.uid;


            return (
              currentUserId &&
              String(assigneeId) ===
                String(currentUserId)
            );

          }
        )
        .filter(
          (task) =>
            ![
              "done",
              "completed",
            ].includes(
              String(
                task.status
              ).toLowerCase()
            )
        )
        .sort((a, b) => {

          if (
            !a.dueDate &&
            !b.dueDate
          ) {
            return 0;
          }

          if (!a.dueDate) {
            return 1;
          }

          if (!b.dueDate) {
            return -1;
          }

          return (
            new Date(a.dueDate) -
            new Date(b.dueDate)
          );

        });

    }, [
      data.tasks,
      currentUserId,
    ]);


  // =====================================================
  // UPCOMING DEADLINES
  // =====================================================

  const deadlines =
    useMemo(() => {

      const now =
        new Date();


      return data.tasks
        .filter(
          (task) =>
            task.dueDate &&
            ![
              "done",
              "completed",
            ].includes(
              String(
                task.status
              ).toLowerCase()
            )
        )
        .filter(
          (task) => {

            const dueDate =
              new Date(
                task.dueDate
              );


            return (
              !Number.isNaN(
                dueDate.getTime()
              ) &&
              dueDate >= now
            );

          }
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate) -
            new Date(b.dueDate)
        )
        .slice(0, 8);

    }, [
      data.tasks,
    ]);


  // =====================================================
  // PROJECTS
  // =====================================================

  const dashboardProjects =
    useMemo(() => {

      return data.projects
        .slice()
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ||
                b.createdAt ||
                0
            ) -
            new Date(
              a.updatedAt ||
                a.createdAt ||
                0
            )
        )
        .slice(0, 8);

    }, [
      data.projects,
    ]);


  // =====================================================
  // TASK DISTRIBUTION
  // =====================================================

  const taskDistribution =
    useMemo(() => {

      const normalizeStatus =
        (status) =>
          String(
            status || "todo"
          ).toLowerCase();


      return {
        todo:
          data.tasks.filter(
            (task) =>
              [
                "todo",
                "to-do",
                "backlog",
              ].includes(
                normalizeStatus(
                  task.status
                )
              )
          ).length,

        inProgress:
          data.tasks.filter(
            (task) =>
              [
                "in_progress",
                "in-progress",
                "in progress",
                "progress",
              ].includes(
                normalizeStatus(
                  task.status
                )
              )
          ).length,

        review:
          data.tasks.filter(
            (task) =>
              [
                "review",
                "in_review",
                "in-review",
              ].includes(
                normalizeStatus(
                  task.status
                )
              )
          ).length,

        completed:
          data.tasks.filter(
            (task) =>
              [
                "done",
                "completed",
              ].includes(
                normalizeStatus(
                  task.status
                )
              )
          ).length,
      };

    }, [
      data.tasks,
    ]);


  // =====================================================
  // REFRESH
  // =====================================================

  const refresh = useCallback(() => {

    const id =
      localStorage.getItem(
        "currentOrganizationId"
      ) || "";


    return loadDashboard(id);

  }, [
    loadDashboard,
  ]);


  // =====================================================
  // RETURN
  // =====================================================

  return {

    loading,

    error,

    refresh,

    stats,

    projects:
      dashboardProjects,

    tasks:
      data.tasks,

    myTasks,

    deadlines,

    taskDistribution,

    members:
      data.members,

    organizations:
      data.organizations,

    organizationId,

  };

};


export default useDashboard;