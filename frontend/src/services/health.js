import api from "./api";

export const checkBackendHealth = async () => {
  const response = await api.get("/health");

  return response.data;
};