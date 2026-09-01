import {
  Camera,
  Check,
  Mail,
  User as UserIcon,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// ==========================================
// SETTINGS
// ==========================================

const Settings = () => {
  const { user } = useAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [name, setName] =
    useState(user?.name || "");

  const [avatarPreview, setAvatarPreview] =
    useState(user?.avatar || "");

  const [isSaving, setIsSaving] =
    useState(false);


  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("");
  };


  const initials =
    getInitials(name) || "U";


  // ==========================================
  // AVATAR CHANGE
  // ==========================================

  const handleAvatarChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // ----------------------------------------
    // Validate file type
    // ----------------------------------------

    if (!file.type.startsWith("image/")) {
      return;
    }

    // ----------------------------------------
    // Validate file size
    // ----------------------------------------

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // ----------------------------------------
    // Preview
    // ----------------------------------------

    const previewUrl =
      URL.createObjectURL(file);

    setAvatarPreview(previewUrl);
  };


  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setIsSaving(true);

    // Backend integration will be added later.

    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-full bg-slate-950 px-5 py-6 sm:px-8 lg:px-10">

      {/* ======================================
          PAGE HEADER
      ======================================= */}

      <div className="mx-auto max-w-4xl">

        <div className="mb-8">

          <div className="mb-2 flex items-center gap-2">

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
            Manage your account information and
            profile details.
          </p>

        </div>


        {/* ====================================
            PROFILE CARD
        ===================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">

          {/* ----------------------------------
              CARD HEADER
          ---------------------------------- */}

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


          {/* ----------------------------------
              CARD CONTENT
          ---------------------------------- */}

          <div className="px-6 py-7">

            {/* ==================================
                AVATAR
            =================================== */}

            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">

              <div className="relative">

                {avatarPreview ? (

                  <img
                    src={avatarPreview}
                    alt={name || "Profile"}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-800"
                  />

                ) : (

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/15 text-xl font-semibold text-indigo-400 ring-2 ring-indigo-500/20">

                    {initials}

                  </div>

                )}

                {/* Camera badge */}

                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 shadow-lg transition hover:bg-slate-800 hover:text-indigo-400"
                >

                  <Camera size={14} />

                </label>

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

              </div>


              <div>

                <p className="text-sm font-medium text-slate-200">
                  Profile photo
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG or WEBP. Maximum
                  file size 5 MB.
                </p>

                <label
                  htmlFor="avatar-upload"
                  className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                >
                  <Camera size={13} />
                  Change photo
                </label>

              </div>

            </div>


            {/* ==================================
                FORM
            =================================== */}

            <div className="space-y-6">

              {/* --------------------------------
                  NAME
              --------------------------------- */}

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
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Enter your name"
                    maxLength={50}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                  />

                </div>

                <p className="mt-1.5 text-[11px] text-slate-600">
                  This name will be visible to
                  other workspace and project members.
                </p>

              </div>


              {/* --------------------------------
                  EMAIL
              --------------------------------- */}

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
                    value={user?.email || ""}
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


              {/* --------------------------------
                  ACCOUNT TYPE
              --------------------------------- */}

              <div>

                <label className="mb-2 block text-xs font-medium text-slate-300">
                  Account type
                </label>

                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">

                  <div>

                    <p className="text-sm text-slate-300">
                      {user?.provider === "google"
                        ? "Google account"
                        : "COLLABSPHERE account"}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Authentication provider
                    </p>

                  </div>

                  <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                    {user?.provider === "google"
                      ? "Google"
                      : "Local"}
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* ----------------------------------
              CARD FOOTER
          ---------------------------------- */}

          <div className="flex items-center justify-end border-t border-slate-800 bg-slate-950/30 px-6 py-4">

            <button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                !name.trim()
              }
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

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


        {/* ====================================
            ACCOUNT INFO
        ===================================== */}

        <div className="mt-4 flex items-center gap-2 px-1">

          <ShieldCheck
            size={13}
            className="text-slate-600"
          />

          <p className="text-[11px] text-slate-600">
            Your account information is securely
            stored by COLLABSPHERE.
          </p>

        </div>

      </div>

    </div>
  );
};

export default Settings;