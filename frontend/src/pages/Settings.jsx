import {
  Camera,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
  User as UserIcon,
  Settings as SettingsIcon,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";
import { useAuth } from "../context/AuthContext";

// ==========================================
// API
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


// ==========================================
// SETTINGS
// ==========================================

const Settings = () => {

  // ==========================================
  // AUTH
  // ==========================================

  const {
    user,
    setUser,
  } = useAuth();


  // ==========================================
  // STATE
  // ==========================================

  const [name, setName] =
    useState("");

  const [avatar, setAvatar] =
    useState("");

  const [avatarPreview, setAvatarPreview] =
    useState("");

  const [avatarFile, setAvatarFile] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");


  // ==========================================
  // LOAD USER DATA
  // ==========================================

  useEffect(() => {

    if (!user) {
      return;
    }

    setName(
      user.name || ""
    );

    setAvatar(
      user.avatar || ""
    );

    setAvatarPreview(
      user.avatar || ""
    );

  }, [user]);


  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (
    value = ""
  ) => {

    return value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
      )
      .join("");

  };


  const initials =
    getInitials(name) || "U";


  // ==========================================
  // AVATAR FILE CHANGE
  // ==========================================

  const handleAvatarChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    // ----------------------------------------
    // FILE TYPE
    // ----------------------------------------

    if (!file.type.startsWith("image/")) {

      setErrorMessage(
        "Please select a valid image file."
      );

      return;
    }


    // ----------------------------------------
    // FILE SIZE
    // ----------------------------------------

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setErrorMessage(
        "Image size must be less than 5 MB."
      );

      return;
    }


    // ----------------------------------------
    // CLEAR ERRORS
    // ----------------------------------------

    setErrorMessage("");
    setSuccessMessage("");


    // ----------------------------------------
    // STORE FILE
    // ----------------------------------------

    setAvatarFile(file);


    // ----------------------------------------
    // CREATE PREVIEW
    // ----------------------------------------

    const previewUrl =
      URL.createObjectURL(file);

    setAvatarPreview(
      previewUrl
    );

  };


  // ==========================================
  // REMOVE AVATAR
  // ==========================================

  const handleRemoveAvatar = () => {

    setAvatar("");
    setAvatarFile(null);
    setAvatarPreview("");

    setSuccessMessage("");
    setErrorMessage("");

  };


  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async () => {

    // ----------------------------------------
    // VALIDATE NAME
    // ----------------------------------------

    const trimmedName =
      name.trim();

    if (!trimmedName) {

      setErrorMessage(
        "Name cannot be empty."
      );

      return;
    }


    if (trimmedName.length < 2) {

      setErrorMessage(
        "Name must contain at least 2 characters."
      );

      return;
    }


    // ----------------------------------------
    // RESET MESSAGES
    // ----------------------------------------

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");


    try {

      /*
       * ------------------------------------------------
       * AVATAR
       *
       * Your current User model stores avatar as a
       * string URL.
       *
       * Until we connect your existing upload system,
       * the backend can persist an avatar URL.
       *
       * If a new local file was selected, we don't send
       * its blob URL to MongoDB because blob URLs are
       * browser-local and become invalid after refresh.
       * ------------------------------------------------
       */

      let avatarToSave =
        avatar;


      /*
       * For now, if the user selected a new file,
       * don't persist the temporary blob URL.
       *
       * Actual image upload should be connected to
       * your existing upload endpoint separately.
       */

      if (avatarFile) {

        setErrorMessage(
          "Profile image upload will be connected to the server upload system next. Your name can still be saved."
        );

        // We still save the name below.
      }


      // ----------------------------------------
      // REQUEST
      // ----------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/auth/profile`,
          {
            method: "PATCH",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              name:
                trimmedName,

              avatar:
                avatarFile
                  ? user?.avatar || ""
                  : avatarToSave,
            }),
          }
        );


      // ----------------------------------------
      // RESPONSE
      // ----------------------------------------

      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.message ||
            "Unable to update profile."
        );

      }


      // ----------------------------------------
      // UPDATED USER
      // ----------------------------------------

      const updatedUser =
        data?.user;


      if (updatedUser) {

        /*
         * Update AuthContext immediately.
         *
         * This means:
         *
         * Settings
         *     ↓
         * AuthContext
         *     ↓
         * Sidebar
         *     ↓
         * New name/avatar immediately
         */

        if (
          typeof setUser ===
          "function"
        ) {

          setUser(
            updatedUser
          );

        }

      }


      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      setAvatarFile(null);

      setSuccessMessage(
        "Profile updated successfully."
      );


    } catch (error) {

      console.error(
        "Update profile error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Something went wrong while updating your profile."
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="min-h-full bg-slate-950 px-5 py-6 sm:px-8 lg:px-10">

      <div className="mx-auto max-w-4xl">


        {/* ======================================
            PAGE HEADER
        ======================================= */}

        <div className="mb-8">

          <div className="mb-2 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">

              <SettingsIcon
                size={18}
                className="text-indigo-400"
              />

            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Settings
            </h1>

          </div>

          <p className="text-sm text-slate-400">
            Manage your account information
            and profile details.
          </p>

        </div>


        {/* ======================================
            SUCCESS
        ======================================= */}

        {successMessage && (

          <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">

            <Check size={16} />

            <span>
              {successMessage}
            </span>

          </div>

        )}


        {/* ======================================
            ERROR
        ======================================= */}

        {errorMessage && (

          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">

            <X
              size={16}
              className="mt-0.5 shrink-0"
            />

            <span>
              {errorMessage}
            </span>

          </div>

        )}


        {/* ======================================
            PROFILE CARD
        ======================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">


          {/* ====================================
              HEADER
          ===================================== */}

          <div className="border-b border-slate-800 px-6 py-5">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800">

                <UserIcon
                  size={17}
                  className="text-slate-400"
                />

              </div>

              <div>

                <h2 className="text-sm font-semibold text-slate-100">
                  Profile information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update the information visible
                  to other COLLABSPHERE members.
                </p>

              </div>

            </div>

          </div>


          {/* ====================================
              CONTENT
          ===================================== */}

          <div className="px-6 py-7">


            {/* ==================================
                AVATAR
            =================================== */}

            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">

              <div className="relative">

                {avatarPreview ? (

                  <img
                    src={avatarPreview}
                    alt={
                      name ||
                      "Profile"
                    }
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-800"
                    onError={() =>
                      setAvatarPreview("")
                    }
                  />

                ) : (

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/15 text-xl font-semibold text-indigo-400 ring-2 ring-indigo-500/20">

                    {initials}

                  </div>

                )}


                {/* CAMERA */}

                <label
                  htmlFor="avatar-upload"
                  title="Change profile photo"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 shadow-lg transition hover:bg-slate-800 hover:text-indigo-400"
                >

                  <Camera size={14} />

                </label>


                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleAvatarChange
                  }
                  className="hidden"
                />

              </div>


              <div>

                <p className="text-sm font-medium text-slate-200">
                  Profile photo
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG or WEBP.
                  Maximum 5 MB.
                </p>


                <div className="mt-2 flex items-center gap-3">

                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Change photo
                  </label>


                  {avatarPreview && (

                    <button
                      type="button"
                      onClick={
                        handleRemoveAvatar
                      }
                      className="text-xs font-medium text-slate-500 transition hover:text-red-400"
                    >
                      Remove
                    </button>

                  )}

                </div>

              </div>

            </div>


            {/* ==================================
                FORM
            =================================== */}

            <div className="space-y-6">


              {/* =================================
                  NAME
              ================================== */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Full name
                </label>


                <div className="relative">

                  <UserIcon
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(
                        event.target.value
                      );

                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    placeholder="Enter your name"
                    maxLength={50}
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>


                <div className="mt-1.5 flex items-center justify-between">

                  <p className="text-[11px] text-slate-600">
                    This name is visible to
                    workspace and project members.
                  </p>

                  <span className="text-[10px] text-slate-600">
                    {name.length}/50
                  </span>

                </div>

              </div>


              {/* =================================
                  EMAIL
              ================================== */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-slate-300"
                  >
                    Email address
                  </label>


                  {user?.emailVerified && (

                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">

                      <ShieldCheck size={12} />

                      Verified

                    </span>

                  )}

                </div>


                <div className="relative">

                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="email"
                    type="email"
                    value={
                      user?.email || ""
                    }
                    disabled
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
                  />

                </div>


                <p className="mt-1.5 text-[11px] text-slate-600">
                  Email address cannot be changed
                  from this page.
                </p>

              </div>


              {/* =================================
                  ACCOUNT TYPE
              ================================== */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-300">
                  Account type
                </label>


                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">

                  <div>

                    <p className="text-sm text-slate-300">

                      {user?.provider ===
                      "google"
                        ? "Google account"
                        : "COLLABSPHERE account"}

                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Authentication provider
                    </p>

                  </div>


                  <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-500">

                    {user?.provider ===
                    "google"
                      ? "Google"
                      : "Local"}

                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* ====================================
              FOOTER
          ===================================== */}

          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/30 px-6 py-4">

            <p className="hidden text-[11px] text-slate-600 sm:block">
              Changes are saved to your account.
            </p>


            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                !name.trim()
              }
              className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (

                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  Saving...
                </>

              ) : (

                <>
                  <Check size={14} />

                  Save changes
                </>

              )}

            </button>

          </div>

        </section>


        {/* ======================================
            FOOTER NOTE
        ======================================= */}

        <div className="mt-4 flex items-center gap-2 px-1">

          <ShieldCheck
            size={13}
            className="text-slate-600"
          />

          <p className="text-[11px] text-slate-600">
            Your profile information is securely
            stored by COLLABSPHERE.
          </p>

        </div>

      </div>

    </div>
  );
};


export default Settings;