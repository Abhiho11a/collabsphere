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
import Workspaces from "./pages/Workspaces";
import WorkspaceDetails from "./pages/WorkspaceDetails";
import WorkspaceMembers from "./pages/WorkspaceMembers";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectBoard from "./pages/ProjectBoard";
import TaskDetails from "./pages/TaskDetails";
import Tasks from "./pages/Tasks";
import Members from "./pages/Members";
import Documents from "./pages/Documents";
import Files from "./pages/Files";
import DocumentEditor from "./pages/DocumentEditor";
import MyProjects from "./pages/MyProjects";
import ProjectChat from "./pages/ProjectChat";
import Settings from "./pages/Settings";
import OrganizationMember from "./pages/organization/OrganizationMembers";
import OrganizationSettings from "./pages/organization/OrganizationSettings";
import Chat from "./pages/Chat";


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


          <Route
            path="/organization/members"
            element={<OrganizationMember />}
          />

          <Route
            path="/organization/settings"
            element={<OrganizationSettings />}
          />


          <Route
            path="/workspaces"
            element={
              <Workspaces/>
            }
          />

          <Route
            path="/workspaces/:workspaceId"
            element={<WorkspaceDetails />}
          />

          {/* <Route
            path="/workspaces/:workspaceId/members"
            element={<WorkspaceMembers />}
          /> */}

          <Route
            path="/workspaces/:workspaceId/projects"
            element={<Projects />}
          />

          <Route
            path="/projects"
            element={<MyProjects />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId"
            element={<ProjectDetails />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId/board"
            element={<ProjectBoard />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/workspaces/:workspaceId/members"
            element={<Members />}
          />

          {/* =====================================================
              WORKSPACE DOCUMENTS
          ===================================================== */}

          <Route
            path="/documents"
            element={<Documents />}
          />

          <Route
            path="/workspaces/:workspaceId/documents"
            element={<Documents />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId/documents"
            element={<Documents />}
          />

          <Route
            path="/workspaces/:workspaceId/documents/:documentId"
            element={<DocumentEditor />}
          />


          {/* =====================================================
            FILES
          ===================================================== */}

          <Route
            path="/files"
            element={<Files />}
          />

          <Route
            path="/workspaces/:workspaceId/files"
            element={<Files />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId/files"
            element={<Files />}
          />

          <Route
            path="/chat"
            element={<Chat />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId/chat"
            element={<ProjectChat />}
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
              <Settings/>
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