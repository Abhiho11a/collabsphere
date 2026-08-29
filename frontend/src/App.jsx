import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";


const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================
            PUBLIC ROUTES
        ====================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />


        {/* =====================================
            PROTECTED APPLICATION
        ====================================== */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >

          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Temporary routes */}

          <Route
            path="/workspaces"
            element={
              <PlaceholderPage
                title="Workspaces"
              />
            }
          />

          <Route
            path="/projects"
            element={
              <PlaceholderPage
                title="Projects"
              />
            }
          />

          <Route
            path="/tasks"
            element={
              <PlaceholderPage
                title="Tasks"
              />
            }
          />

          <Route
            path="/documents"
            element={
              <PlaceholderPage
                title="Documents"
              />
            }
          />

          <Route
            path="/files"
            element={
              <PlaceholderPage
                title="Files"
              />
            }
          />

          <Route
            path="/chat"
            element={
              <PlaceholderPage
                title="Chat"
              />
            }
          />

          <Route
            path="/notifications"
            element={
              <PlaceholderPage
                title="Notifications"
              />
            }
          />

          <Route
            path="/analytics"
            element={
              <PlaceholderPage
                title="Analytics"
              />
            }
          />

          <Route
            path="/activity"
            element={
              <PlaceholderPage
                title="Activity"
              />
            }
          />

          <Route
            path="/members"
            element={
              <PlaceholderPage
                title="Members"
              />
            }
          />

          <Route
            path="/settings"
            element={
              <PlaceholderPage
                title="Settings"
              />
            }
          />

        </Route>


        {/* =====================================
            DEFAULT ROUTE
        ====================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* =====================================
            404
        ====================================== */}

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


/* ==========================================
   TEMPORARY PAGE
========================================== */

const PlaceholderPage = ({ title }) => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">

      <div className="text-center">

        <h1 className="text-2xl font-semibold text-white">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          This page will be built next.
        </p>

      </div>

    </div>
  );
};


export default App;