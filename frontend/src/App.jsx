import { useEffect, useState } from "react";
import { checkBackendHealth } from "./services/health";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await checkBackendHealth();

        if (data.success) {
          setBackendStatus("Backend connected");
        }
      } catch (error) {
        console.error("Backend connection failed:", error);
        setBackendStatus("Backend unavailable");
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          COLLABSPHERE
        </h1>

        <p className="mt-4 text-slate-400">
          Enterprise Real-Time Collaborative Workspace
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {backendStatus}
        </div>
      </div>
    </div>
  );
}

export default App;