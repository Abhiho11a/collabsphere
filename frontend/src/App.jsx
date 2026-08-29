import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==========================
            PUBLIC
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={
            <Register/>
          }
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />


        {/* ==========================
            PROTECTED
        ========================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ==========================
            DEFAULT
        ========================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* ==========================
            404
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
};

export default App;