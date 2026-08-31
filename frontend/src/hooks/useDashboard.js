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
  getWorkspaceMembers,
  getWorkspaceDocuments,
  getWorkspaceActivity,
} from "../services/dashboardService";


const useDashboard = () => {

  // =====================================================
  // STATE
  // =====================================================

  const [data, setData] = useState({
    workspaces: [],
    projects: [],
    tasks: [],
    members: [],
    documents: [],
    activities: [],
  });


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard =
    useCallback(async () => {

      try {

        setLoading(true);
        setError("");


        // ================================================
        // WORKSPACES
        // ================================================

        const workspaces =
          await getWorkspaces();


        // ================================================
        // PROJECTS
        // ================================================

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


        // ================================================
        // TASKS
        // ================================================

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


        // ================================================
        // MEMBERS
        // ================================================

        const memberResults =
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

                  const members =
                    await getWorkspaceMembers(
                      workspaceId
                    );


                  return members.map(
                    (member) => ({
                      ...member,

                      workspaceId,

                      workspace,
                    })
                  );

                } catch (error) {

                  console.error(
                    `Failed to load members for workspace ${workspaceId}:`,
                    error
                  );

                  return [];

                }

              }
            )
          );


        const members =
          memberResults.flat();


        // ================================================
        // DOCUMENTS
        // ================================================

        const documentResults =
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

                  const documents =
                    await getWorkspaceDocuments(
                      workspaceId
                    );


                  return documents.map(
                    (document) => ({
                      ...document,

                      workspaceId,

                      workspace,
                    })
                  );

                } catch (error) {

                  console.error(
                    `Failed to load documents for workspace ${workspaceId}:`,
                    error
                  );

                  return [];

                }

              }
            )
          );


        const documents =
          documentResults.flat();


        // ================================================
        // ACTIVITY
        // ================================================

        const activityResults =
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

                  const activities =
                    await getWorkspaceActivity(
                      workspaceId
                    );


                  return activities.map(
                    (activity) => ({
                      ...activity,

                      workspaceId,

                      workspace,
                    })
                  );

                } catch (error) {

                  console.error(
                    `Failed to load activity for workspace ${workspaceId}:`,
                    error
                  );

                  return [];

                }

              }
            )
          );


        const activities =
          activityResults.flat();


        // ================================================
        // SAVE DATA
        // ================================================

        setData({
          workspaces,
          projects,
          tasks,
          members,
          documents,
          activities,
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

    }, []);


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadDashboard();

  }, [
    loadDashboard,
  ]);


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
              task.status
            )
        ).length;


      const completedTasks =
        data.tasks.filter(
          (task) =>
            [
              "done",
              "completed",
            ].includes(
              task.status
            )
        ).length;


      return [
        {
          title: "Active Projects",
          value: activeProjects,
          icon: "projects",
        },

        {
          title: "Pending Tasks",
          value: pendingTasks,
          icon: "tasks",
        },

        {
          title: "Team Members",
          value: data.members.length,
          icon: "members",
        },

        {
          title: "Completed Tasks",
          value: completedTasks,
          icon: "completed",
        },
      ];

    }, [
      data.projects,
      data.tasks,
      data.members,
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
              task.status
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

        .slice(0, 5);

    }, [
      data.tasks,
    ]);


  // =====================================================
  // RECENT DOCUMENTS
  // =====================================================

  const documents =
    useMemo(() => {

      return [...data.documents]

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

        .slice(0, 5);

    }, [
      data.documents,
    ]);


  // =====================================================
  // RECENT ACTIVITY
  // =====================================================

  const activities =
    useMemo(() => {

      return [...data.activities]

        .sort(
          (a, b) =>
            new Date(
              b.createdAt ||
              b.updatedAt ||
              b.date ||
              0
            ) -
            new Date(
              a.createdAt ||
              a.updatedAt ||
              a.date ||
              0
            )
        )

        .slice(0, 5);

    }, [
      data.activities,
    ]);


  // =====================================================
  // RETURN
  // =====================================================

  return {

    loading,

    error,

    refresh:
      loadDashboard,

    stats,

    projects:
      data.projects.slice(0, 5),

    deadlines,

    documents,

    activities,

    members:
      data.members.slice(0, 8),

  };

};


export default useDashboard;