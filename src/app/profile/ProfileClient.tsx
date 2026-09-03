"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  User as UserIcon, 
  ShieldCheck, 
  Key, 
  Camera, 
  Loader2, 
  Trash2, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Award, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  headline: string;
  bio: string;
  role: string;
  status: string;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
  stats: {
    enrolledCourses: number;
    certificates: number;
    reviews: number;
  };
}

interface ProfileClientProps {
  initialProfile: UserProfileData;
}

export default function ProfileClient({ initialProfile }: ProfileClientProps) {
  const { t, language } = useLanguage();
  const { update: updateSession } = useSession();

  const [activeTab, setActiveTab] = useState<"details" | "security" | "overview">("details");
  const [profile, setProfile] = useState<UserProfileData>(initialProfile);

  // Form Details State
  const [name, setName] = useState(initialProfile.name);
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [bio, setBio] = useState(initialProfile.bio);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Handle Avatar Selection & Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.common.fileTooLarge);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t.profile.messages.unsupportedAvatarFormat);
      return;
    }

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "avatar");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.profile.messages.avatarUploadFailed);
      }

      const newAvatarUrl = data.url;
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));

      // Sync with NextAuth session immediately
      await updateSession({ avatarUrl: newAvatarUrl });

      toast.success(t.profile.messages.avatarSuccess);
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err.message || t.profile.messages.avatarUploadFailed);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Reset / Remove Avatar to Default
  const handleResetAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio,
          avatarUrl: null, // Signals backend to fallback to DiceBear SVG
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.profile.messages.avatarResetFailed);
      }

      const defaultAvatarUrl = data.user.avatarUrl;
      setProfile((prev) => ({ ...prev, avatarUrl: defaultAvatarUrl }));

      await updateSession({ avatarUrl: defaultAvatarUrl });
      toast.success(t.profile.messages.avatarResetSuccess);
    } catch (err: any) {
      toast.error(err.message || t.profile.messages.avatarResetFailed);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Save Profile Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t.profile.messages.detailsSaveFailed);
      return;
    }

    setIsSavingDetails(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.profile.messages.detailsSaveFailed);
      }

      setProfile((prev) => ({
        ...prev,
        name: data.user.name,
        headline: data.user.headline || "",
        bio: data.user.bio || "",
      }));

      // Update NextAuth session so Navbar updates immediately
      await updateSession({ name: data.user.name });

      toast.success(t.profile.messages.detailsSaveSuccess);
    } catch (err: any) {
      toast.error(err.message || t.profile.messages.detailsSaveFailed);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile.hasPassword && !currentPassword) {
      toast.error(t.profile.messages.currentPasswordIncorrect);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error(t.auth.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.auth.passwordMismatch);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: profile.hasPassword ? currentPassword : undefined,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.profile.messages.passwordChangeFailed);
      }

      setProfile((prev) => ({ ...prev, hasPassword: true }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(t.profile.messages.passwordChangeSuccess);
    } catch (err: any) {
      toast.error(err.message || t.profile.messages.passwordChangeFailed);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format creation date
  const formattedDate = new Date(profile.createdAt).toLocaleDateString(
    language,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 z-10">
          {/* Avatar Container with Edit Action */}
          <div className="relative group">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full ring-4 ring-brand-500/30 overflow-hidden bg-slate-800 flex items-center justify-center shadow-glow">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-extrabold text-brand-400">
                  {profile.name?.charAt(0) || "U"}
                </span>
              )}

              {/* Uploading Overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
                  <span className="text-[10px] text-slate-300 font-medium mt-1">
                    {t.profile.avatar.uploading}
                  </span>
                </div>
              )}
            </div>

            {/* Change Avatar Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-xl transition-all transform hover:scale-110 active:scale-95 border-2 border-slate-900"
              title={t.profile.avatar.changeAvatar}
            >
              <Camera className="h-4 w-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* User Info & Quick Badges */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {profile.name}
              </h1>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-950 text-brand-400 border border-brand-800/80">
                {profile.role === "ADMIN" || profile.role === "SUPER_ADMIN"
                  ? t.profile.roles.admin
                  : profile.role === "INSTRUCTOR"
                  ? t.profile.roles.instructor
                  : t.profile.roles.student}
              </span>

              {profile.status === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.profile.overview.statusActive}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/50">
                  <AlertCircle className="h-3 w-3" />
                  {t.profile.overview.statusBlocked}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-400 mb-2">{profile.email}</p>

            {profile.headline ? (
              <p className="text-sm text-slate-300 font-medium mb-3">
                {profile.headline}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic mb-3">
                {t.profile.noHeadline}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {t.profile.fields.joinedDate}: {formattedDate}
              </span>

              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  disabled={isUploadingAvatar}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  {t.profile.avatar.removeAvatar}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "details"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          {t.profile.tabs.details}
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "security"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="h-4 w-4" />
          {t.profile.tabs.security}
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          {t.profile.tabs.overview}
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === "details" && (
        <form
          onSubmit={handleSaveDetails}
          className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              {t.profile.tabs.details}
            </h2>
            <p className="text-xs text-slate-400">
              {t.profile.detailsDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t.profile.fields.name} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.profile.fields.namePlaceholder}
                required
                maxLength={100}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t.profile.fields.email}
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400 cursor-not-allowed select-none"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {t.profile.fields.emailNote}
              </p>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.profile.fields.headline}
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={t.profile.fields.headlinePlaceholder}
              maxLength={150}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <div className="mt-1 flex justify-end text-[11px] text-slate-500">
              {headline.length}/150
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.profile.fields.bio}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.profile.fields.bioPlaceholder}
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
            />
            <div className="mt-1 flex justify-end text-[11px] text-slate-500">
              {bio.length}/1000
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingDetails}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingDetails ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.profile.buttons.saving}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t.profile.buttons.saveChanges}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <form
          onSubmit={handleChangePassword}
          className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6 max-w-2xl"
        >
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              {t.profile.tabs.security}
            </h2>
            <p className="text-xs text-slate-400">
              {profile.hasPassword
                ? t.profile.securityDescPassword
                : t.profile.securityDescOAuth}
            </p>
          </div>

          {/* Current Password (only if account already has password) */}
          {profile.hasPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t.profile.fields.currentPassword}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.profile.fields.newPassword}{" "}
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                maxLength={128}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.profile.fields.confirmPassword}{" "}
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                maxLength={128}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.profile.buttons.changingPassword}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  {t.profile.buttons.changePassword}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Learning Overview & Account Stats */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Enrolled Courses */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.profile.overview.enrolledCourses}
                </h3>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {profile.stats.enrolledCourses}
                </p>
              </div>

              <Link
                href="/my-courses"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
              >
                {t.myCourses.pageTitle}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Certificates */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.profile.overview.certificates}
                </h3>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {profile.stats.certificates}
                </p>
              </div>

              <span className="mt-6 text-xs text-slate-500">
                {t.profile.certIssuedHint}
              </span>
            </div>

            {/* Reviews */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.profile.overview.reviews}
                </h3>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {profile.stats.reviews}
                </p>
              </div>

              <span className="mt-6 text-xs text-slate-500">
                {t.profile.reviewsHint}
              </span>
            </div>
          </div>

          {/* Account Security & Verification Summary */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-400" />
              {t.profile.verificationSummary}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200">{profile.email}</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                <span className="text-slate-400">
                  {t.profile.emailVerifiedLabel}
                </span>
                {profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.profile.verified}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t.profile.unverified}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                <span className="text-slate-400">
                  {t.profile.overview.accountStatus}:
                </span>
                <span className="font-semibold text-emerald-400">
                  {profile.status === "ACTIVE"
                    ? t.profile.overview.statusActive
                    : t.profile.overview.statusBlocked}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                <span className="text-slate-400">
                  {t.profile.fields.joinedDate}:
                </span>
                <span className="font-medium text-slate-200">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
