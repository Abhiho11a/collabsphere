// Get project messages
export const getProjectMessages = async (
  workspaceId,
  projectId
) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/projects/${projectId}/messages`
  );

  return response.data;
};


// Send message
export const sendProjectMessage = async (
  workspaceId,
  projectId,
  content,
  replyTo = null
) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/projects/${projectId}/messages`,
    {
      content,
      ...(replyTo && { replyTo }),
    }
  );

  return response.data;
};


// Edit message
export const editMessage = async (
  messageId,
  content
) => {
  const response = await api.patch(
    `/messages/${messageId}`,
    {
      content,
    }
  );

  return response.data;
};


// Delete message
export const deleteMessage = async (
  messageId
) => {
  const response = await api.delete(
    `/messages/${messageId}`
  );

  return response.data;
};