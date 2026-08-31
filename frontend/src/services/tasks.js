import api from "./api";

// ==========================================
// GET TASKS ASSIGNED TO CURRENT USER
// ==========================================

export const getMyTasks = async () => {
  const response = await api.get(
    "/tasks/my"
  );

  return response.data;
};

// ==========================================
// UPDATE TASK STATUS
// ==========================================

export const updateTaskStatus = async ({
  workspaceId,
  projectId,
  taskId,
  status,
}) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    {
      status,
    }
  );

  return response.data;
};