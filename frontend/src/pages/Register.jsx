import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";
  
  
const Register = () => {
  const navigate = useNavigate();

  const {
    isAuthenticated,
  } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };


  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return "Please fill in all fields.";
    }

    if (formData.name.trim().length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      return "Passwords do not match.";
    }

    return null;
  };


  // ==========================================
  // HANDLE REGISTER
  // ==========================================

  const handleSubmit = async (event) => {
  event.preventDefault();

  setError("");

  const validationError =
    validateForm();

  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setLoading(true);

    const data = await registerUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (!data.success) {
      setError(
        data.message ||
          "Unable to create your account."
      );

      return;
    }

    navigate("/login");

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    setError(
      error.response?.data?.message ||
      "Unable to connect to the server."
    );

  } finally {
    setLoading(false);
  }
};


  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  const handleGoogleLogin = () => {
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

      {/* ======================================
          HEADER
      ====================================== */}

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


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          {/* ==================================
              CARD
          ================================== */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/20 sm:p-9">

            {/* Heading */}

            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-lg font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                CS
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Create your account
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Start collaborating with your team
              </p>

            </div>


            {/* ==================================
                ERROR
            ================================== */}

            {error && (
              <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}


            {/* ==================================
                FORM
            ================================== */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Name */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

              </div>


              {/* Email */}

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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

              </div>


              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Use at least 8 characters.
                </p>

              </div>


              {/* Confirm Password */}

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

              </div>


              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>


            {/* ==================================
                DIVIDER
            ================================== */}

            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                or
              </span>

              <div className="h-px flex-1 bg-slate-800" />

            </div>


            {/* ==================================
                GOOGLE
            ================================== */}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600"
            >

              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                G
              </span>

              Continue with Google

            </button>


            {/* ==================================
                LOGIN
            ================================== */}

            <p className="mt-7 text-center text-sm text-slate-400">

              Already have an account?{" "}

              <Link
                to="/login"
                className="font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                Sign in
              </Link>

            </p>

          </div>


          {/* Footer */}

          <p className="mt-6 text-center text-xs text-slate-600">
            By creating an account, you agree to the
            COLLABSPHERE terms and privacy policy.
          </p>

        </div>

      </main>

    </div>
  );
};

export default Register;