import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Mail,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
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
            email: normalizedEmail,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to process your request."
        );
      }

      setSuccess(
        data?.message ||
          "If an account exists with this email, a password reset link has been sent."
      );

      setEmail("");
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        error.message ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

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

            {/* ICON */}
            <div className="mb-6 flex justify-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

                <Mail
                  size={24}
                  strokeWidth={1.8}
                />

              </div>

            </div>

            {/* HEADING */}
            <div className="mb-8 text-center">

              <h1 className="text-2xl font-semibold tracking-tight">
                Forgot your password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Enter your email address and
                we'll send you a link to reset
                your password.
              </p>

            </div>

            {/* SUCCESS */}
            {success && (
              <div className="mb-6 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">

                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  {success}
                </div>

              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* EMAIL */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value
                    );
                    setError("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              {/* BUTTON */}
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

                    Sending reset link...
                  </>
                ) : (
                  "Send reset link"
                )}

              </button>

            </form>

            {/* BACK */}
            <div className="mt-7 text-center">

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
              >

                <ArrowLeft size={16} />

                Back to login

              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

export default ForgotPassword;