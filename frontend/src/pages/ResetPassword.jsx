import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  LockKeyhole,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token");

  const email =
    searchParams.get("email");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [invalidLink, setInvalidLink] =
    useState(false);

  /*
   * ==========================================
   * CHECK RESET LINK
   * ==========================================
   */

  useEffect(() => {
    if (!token || !email) {
      setInvalidLink(true);

      setError(
        "This password reset link is invalid."
      );
    }
  }, [token, email]);

  /*
   * ==========================================
   * SUBMIT
   * ==========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token || !email) {
      setError(
        "This password reset link is invalid."
      );

      return;
    }

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );

      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
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
            token,
            email,
            newPassword,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to reset password."
        );
      }

      setSuccess(
        data?.message ||
          "Password reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setError(
        error.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * INVALID LINK UI
   * ==========================================
   */

  if (invalidLink) {
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

        </header>

        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-10">

          <div className="w-full max-w-md">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 text-center shadow-2xl shadow-black/20 sm:p-9">

              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">

                <AlertCircle
                  size={25}
                />

              </div>

              <h1 className="text-2xl font-semibold">
                Invalid reset link
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                This password reset link is
                invalid or incomplete.
                Please request a new one.
              </p>

              <Link
                to="/forgot-password"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Request a new link
              </Link>

              <Link
                to="/login"
                className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft size={16} />

                Back to login
              </Link>

            </div>

          </div>

        </main>

      </div>
    );
  }

  /*
   * ==========================================
   * MAIN UI
   * ==========================================
   */

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

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/20 sm:p-9">

            {/* ICON */}
            <div className="mb-6 flex justify-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                <LockKeyhole
                  size={24}
                  strokeWidth={1.8}
                />

              </div>

            </div>

            {/* HEADING */}
            <div className="mb-8 text-center">

              <h1 className="text-2xl font-semibold tracking-tight">
                Reset password
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Create a new password for your
                COLLABSPHERE account.
              </p>

            </div>

            {/* SUCCESS */}
            {success && (
              <div className="mb-6">

                <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">

                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    {success}
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/login")
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Continue to login
                </button>

              </div>
            )}

            {/* ERROR */}
            {error && !success && (
              <div className="mb-6 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  {error}
                </div>

              </div>
            )}

            {/* FORM */}
            {!success && (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NEW PASSWORD */}
                <div>

                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    New password
                  </label>

                  <div className="relative">

                    <input
                      id="newPassword"
                      name="newPassword"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(
                          event.target.value
                        );
                        setError("");
                      }}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Password must be at least
                    8 characters.
                  </p>

                </div>

                {/* CONFIRM PASSWORD */}
                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Confirm password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        confirmPassword
                      }
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        setError("");
                      }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Resetting password...
                    </>
                  ) : (
                    "Reset password"
                  )}

                </button>

              </form>
            )}

            {/* BACK */}
            {!success && (
              <div className="mt-7 text-center">

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
                >

                  <ArrowLeft size={16} />

                  Back to login

                </Link>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
};

export default ResetPassword;