import api from "./api";


// ==============================
// REGISTER
// ==============================

export const registerUser = async (data) => {
  const response = await api.post(
    "/auth/register",
    data
  );

  return response.data;
};


// ==============================
// LOGIN
// ==============================

export const loginUser = async (data) => {
  const response = await api.post(
    "/auth/login",
    data
  );

  return response.data;
};


// ==============================
// CURRENT USER
// ==============================

export const getCurrentUser = async () => {
  const response = await api.get(
    "/auth/me"
  );

  return response.data;
};


// ==============================
// LOGOUT
// ==============================

export const logoutUser = async () => {
  const response = await api.post(
    "/auth/logout"
  );

  return response.data;
};


// ==============================
// FORGOT PASSWORD
// ==============================

export const forgotPassword = async (
  email
) => {
  const response = await api.post(
    "/auth/forgot-password",
    { email }
  );

  return response.data;
};


// ==============================
// RESET PASSWORD
// ==============================

export const resetPassword = async (
  data
) => {
  const response = await api.post(
    "/auth/reset-password",
    data
  );

  return response.data;
};