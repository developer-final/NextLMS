"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { 
  BookOpen, 
  Compass, 
  FileText, 
  GraduationCap, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  User as UserIcon, 
  X, 
  Share2,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";

interface NavbarClientProps {
  brandName?: string;
  slogan?: string;
}

export default function NavbarClient({
  brandName,
  slogan,
}: NavbarClientProps) {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isInstructor = user?.role === "INSTRUCTOR" || isAdmin;

  const displayName = brandName?.trim() || "NextLMS";
  const displaySlogan = slogan?.trim() || t.common.appSlogan;

  const renderBrandName = () => {
    const words = displayName.split(/\s+/);
    if (words.length <= 1) {
      return <span className="text-white">{displayName}</span>;
    }
    const lastWord = words.pop();
    const leadingWords = words.join(" ");
    return (
      <>
        <span>{leadingWords}</span> <span className="text-brand-400">{lastWord}</span>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold shadow-glow group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
              {renderBrandName()}
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider">{displaySlogan}</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/courses"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors"
          >
            <Compass className="h-4 w-4" />
            {t.nav.allCourses}
          </Link>
          <Link
            href="/categories"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {t.nav.categories}
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors"
          >
            <FileText className="h-4 w-4" />
            {t.nav.blog}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors"
          >
            {t.nav.aboutUs}
          </Link>
        </nav>

        {/* Right CTA / User Area */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Switcher */}
          <ThemeSwitcher variant="navbar" />

          {/* Language Switcher */}
          <LanguageSwitcher variant="navbar" />

          {status === "loading" ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800"></div>
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-900/80 p-1.5 pr-3 text-sm font-medium text-slate-200 hover:border-brand-500/50 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs uppercase border border-brand-500/30 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || "U"
                  )}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">{t.nav.loggedInAs}</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                      {user?.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      {t.nav.profile}
                    </Link>

                    <Link
                      href="/my-courses"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 transition-colors"
                    >
                      <GraduationCap className="h-4 w-4" />
                      {t.nav.myCourses}
                    </Link>

                    <Link
                      href="/affiliate"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                    >
                      <Share2 className="h-4 w-4 text-amber-400" />
                      <span>{t.affiliate.title}</span>
                    </Link>

                    {isInstructor && (
                      <>
                        <Link
                          href="/admin/courses"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 transition-colors"
                        >
                          <BookOpen className="h-4 w-4" />
                          {t.nav.manageCourses}
                        </Link>
                        <Link
                          href="/admin/posts"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-brand-400 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          {t.admin.sidebar.posts}
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-300 hover:bg-amber-950/40 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t.nav.adminDashboard}
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.nav.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition-all hover:scale-105"
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher variant="navbar" />
          <LanguageSwitcher variant="navbar" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {t.nav.allCourses}
          </Link>
          <Link
            href="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {t.nav.categories}
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {t.nav.blog}
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {t.nav.aboutUs}
          </Link>

          {session ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-brand-400"
              >
                {t.nav.profile}
              </Link>
              <Link
                href="/my-courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-brand-400 hover:bg-slate-800"
              >
                {t.nav.myCourses}
              </Link>
              <Link
                href="/affiliate"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-slate-800"
              >
                {t.affiliate.title}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-slate-800"
                >
                  {t.nav.adminDashboard}
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-950/20"
              >
                {t.nav.logout} ({user?.name})
              </button>
            </>
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border border-slate-700 text-sm font-medium text-white"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-brand-500 font-semibold text-sm text-slate-950 shadow-glow"
              >
                {t.nav.register}
              </Link>
            </div>
          )}

          <LanguageSwitcher variant="mobile" />
          <ThemeSwitcher variant="mobile" />
        </div>
      )}
    </header>
  );
}
