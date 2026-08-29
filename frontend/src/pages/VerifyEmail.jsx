import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import api from "../services/api";
import { useRef } from "react";


const VerifyEmail = () => {

  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("loading");

  const [message, setMessage] = useState("");

  const verificationStarted = useRef(false);

  const navigate = useNavigate();


  useEffect(() => {
    // Prevent duplicate verification requests
    // during React development StrictMode.
    if (verificationStarted.current) {
        return;
    }

    verificationStarted.current = true;


    const token = searchParams.get("token");

    const email = searchParams.get("email");


    if (!token || !email) {

        setStatus("error");

        setMessage(
        "Invalid verification link."
        );

        return;
    }


    const verifyEmail = async () => {

        try {

        setStatus("loading");


        const response = await api.get(
            "/auth/verify-email",
            {
            params: {
                token,
                email,
            },
            }
        );


        if (response.data.success) {

            setStatus("success");

            setMessage(
                response.data.message ||
                "Your email has been verified successfully."
            );

            window.history.replaceState(
                {},
                document.title,
                "/verify-email"
            );

        } else {

            setStatus("error");

            setMessage(
            response.data.message ||
            "Unable to verify your email."
            );

        }

        } catch (error) {

        console.error(
            "Email verification error:",
            error
        );


        setStatus("error");

        setMessage(
            error.response?.data?.message ||
            "This verification link is invalid or has expired."
        );

        }

    };


    verifyEmail();

    }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}

      <header className="flex items-center justify-between px-6 py-5 lg:px-10">

        <Link
          to="/login"
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


      {/* Main */}

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5">

        <div className="w-full max-w-md">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">

            {/* LOADING */}

            {status === "loading" && (
              <>

                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">

                  <Loader2
                    size={26}
                    className="animate-spin text-indigo-400"
                  />

                </div>

                <h1 className="text-2xl font-semibold">
                  Verifying your email
                </h1>

                <p className="mt-3 text-sm text-slate-400">
                  Please wait while we verify your email address.
                </p>

              </>
            )}


            {/* SUCCESS */}

            {status === "success" && (
              <>

                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">

                  <CheckCircle2
                    size={28}
                    className="text-emerald-400"
                  />

                </div>


                <h1 className="text-2xl font-semibold">
                  Email verified!
                </h1>


                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {message}
                </p>


                <Link
                  to="/login"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Continue to login
                </Link>

              </>
            )}


            {/* ERROR */}

            {status === "error" && (
              <>

                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">

                  <XCircle
                    size={28}
                    className="text-red-400"
                  />

                </div>


                <h1 className="text-2xl font-semibold">
                  Verification failed
                </h1>


                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {message}
                </p>


                <Link
                  to="/login"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Back to login
                </Link>

              </>

            )}

          </div>

        </div>

      </main>

    </div>
  );
};


export default VerifyEmail;