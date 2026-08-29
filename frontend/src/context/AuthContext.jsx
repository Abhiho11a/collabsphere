import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../services/auth";


const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  // ==========================================
  // CHECK CURRENT AUTHENTICATION
  // ==========================================

  const checkAuth = async () => {
    try {
      const data = await getCurrentUser();

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }

    } catch (error) {
      setUser(null);

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (credentials) => {
    const data =
      await loginUser(credentials);

    if (data.success) {
      setUser(data.user);
    }

    return data;
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async () => {
    try {
      await logoutUser();

    } finally {
      setUser(null);
    }
  };


  // ==========================================
  // INITIAL AUTH CHECK
  // ==========================================

  useEffect(() => {
    checkAuth();
  }, []);


  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


// ==========================================
// CUSTOM HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};