import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
  } = useAuth();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [
    superAdminMode,
    setSuperAdminMode,
  ] = useState(false);

  const [
    superAdminPassword,
    setSuperAdminPassword,
  ] = useState("");

  const [
    showSuperAdminPassword,
    setShowSuperAdminPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    superAdminLoading,
    setSuperAdminLoading,
  ] = useState(false);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setError("");
  };


  // ==========================================
  // NORMAL LOGIN
  // ==========================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");

      if (
        !formData.email ||
        !formData.password
      ) {
        setError(
          "Please enter your email and password."
        );

        return;
      }

      try {
        setLoading(true);

        const data =
          await login(formData);

        if (data.success) {
          navigate("/dashboard");
        } else {
          setError(
            data.message ||
              "Unable to login."
          );
        }
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Invalid email or password."
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================
  // SUPER ADMIN LOGIN
  // ==========================================

  const handleSuperAdminLogin =
    async () => {
      setError("");

      if (!superAdminPassword.trim()) {
        setError(
          "Please enter the Super Admin password."
        );

        return;
      }

      try {
        setSuperAdminLoading(true);

        const response =
          await fetch(
            `${API_BASE_URL}/superadmin/login`,
            {
              method: "POST",

              credentials: "include",

              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },

              body: JSON.stringify({
                password:
                  superAdminPassword,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to login as Super Admin"
          );
        }

        navigate(
          "/superadmin/dashboard"
        );
      } catch (error) {
        setError(
          error.message ||
            "Invalid Super Admin password."
        );
      } finally {
        setSuperAdminLoading(
          false
        );
      }
    };


  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  const handleGoogleLogin = () => {

    console.log(API_BASE_URL)
    window.location.href =
      `${API_BASE_URL}/auth/google`;
  };


  // ==========================================
  // ALREADY AUTHENTICATED
  // ==========================================

  if (isAuthenticated) {
    navigate("/dashboard");

    return null;
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}

      <header className="flex items-center justify-between px-6 py-5 lg:px-10">

        <Link
          to="/"
          className="text-xl font-bold tracking-tight"
        >
          COLLAB
          <span className="text-indigo-400">
            SPHERE
          </span>
        </Link>

        <div className="hidden text-sm text-slate-400 sm:block">
          Simple. Connected. Collaborative.
        </div>

      </header>


      {/* MAIN */}

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          {/* CARD */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/20 sm:p-9">

            {/* HEADING */}

            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-lg font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                CS
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Sign in to continue to your workspace
              </p>

            </div>


            {/* ERROR */}

            {error && (
              <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}


            {/* NORMAL LOGIN */}

            {!superAdminMode && (
              <>
                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-5"
                >

                  {/* EMAIL */}

                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-200"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                  </div>


                  {/* PASSWORD */}

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-200"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                      >
                        Forgot password?
                      </Link>

                    </div>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                  </div>


                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Signing in..."
                      : "Sign in"}
                  </button>

                </form>


                {/* DIVIDER */}

                <div className="my-7 flex items-center gap-4">

                  <div className="h-px flex-1 bg-slate-800" />

                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    or
                  </span>

                  <div className="h-px flex-1 bg-slate-800" />

                </div>


                {/* GOOGLE */}

                <button
                  type="button"
                  onClick={
                    handleGoogleLogin
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                >

                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                    G
                  </span>

                  Continue with Google

                </button>


                {/* SUPER ADMIN */}

                <button
                  type="button"
                  onClick={() => {
                    setSuperAdminMode(
                      true
                    );
                    setError("");
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm font-medium text-indigo-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10"
                >

                  <ShieldCheck
                    size={17}
                  />

                  Login as Super Admin

                </button>
              </>
            )}


            {/* SUPER ADMIN LOGIN */}

            {superAdminMode && (
              <div>

                <button
                  type="button"
                  onClick={() => {
                    setSuperAdminMode(
                      false
                    );
                    setSuperAdminPassword(
                      ""
                    );
                    setError("");
                  }}
                  className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >

                  <ArrowLeft
                    size={16}
                  />

                  Back to normal login

                </button>


                <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                      <ShieldCheck
                        size={19}
                      />
                    </div>

                    <div>

                      <h2 className="font-semibold text-white">
                        Super Admin Access
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Enter the Super Admin password to access the global administration dashboard.
                      </p>

                    </div>

                  </div>

                </div>


                <div>

                  <label
                    htmlFor="superAdminPassword"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Super Admin password
                  </label>

                  <div className="relative">

                    <input
                      id="superAdminPassword"
                      type={
                        showSuperAdminPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        superAdminPassword
                      }
                      onChange={(event) => {
                        setSuperAdminPassword(
                          event.target.value
                        );
                        setError("");
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          handleSuperAdminLogin();
                        }
                      }}
                      placeholder="Enter Super Admin password"
                      autoFocus
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowSuperAdminPassword(
                          (current) =>
                            !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showSuperAdminPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}
                    </button>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={
                    handleSuperAdminLogin
                  }
                  disabled={
                    superAdminLoading
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {superAdminLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Authenticating...

                    </>
                  ) : (
                    <>
                      <ShieldCheck
                        size={17}
                      />

                      Access Super Admin Dashboard

                    </>
                  )}

                </button>

              </div>
            )}


            {/* REGISTER */}

            {!superAdminMode && (
              <p className="mt-7 text-center text-sm text-slate-400">

                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="font-medium text-indigo-400 transition hover:text-indigo-300"
                >
                  Create account
                </Link>

              </p>
            )}

          </div>


          <p className="mt-6 text-center text-xs text-slate-600">
            By continuing, you agree to the COLLABSPHERE terms and privacy policy.
          </p>

        </div>

      </main>

    </div>
  );
};

export default Login;