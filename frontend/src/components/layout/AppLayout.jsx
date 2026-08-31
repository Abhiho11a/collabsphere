import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumbs from "./BreadCrumbs";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* =====================================
          MOBILE SIDEBAR OVERLAY
      ====================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      {/* =====================================
          SIDEBAR
      ====================================== */}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <Sidebar
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>


      {/* =====================================
          MAIN APPLICATION
      ====================================== */}

      <div className="min-h-screen lg:pl-64">

        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />
        <Breadcrumbs/>

        {/* Page Content */}

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AppLayout;