"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Settings,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface AdminSidebarClientProps {
  userRole: string;
}

export default function AdminSidebarClient({ userRole }: AdminSidebarClientProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      href: "/admin",
      label: t.admin.sidebar.dashboard,
      icon: LayoutDashboard,
      color: "text-brand-400",
      exact: true,
    },
    {
      href: "/admin/orders",
      label: t.admin.sidebar.orders,
      icon: Receipt,
      color: "text-emerald-400",
    },
    {
      href: "/admin/courses",
      label: t.admin.sidebar.courses,
      icon: BookOpen,
      color: "text-blue-400",
      exact: true,
    },
    {
      href: "/admin/courses/new",
      label: t.admin.sidebar.createCourse,
      icon: PlusCircle,
      color: "text-amber-400",
    },
    {
      href: "/admin/categories",
      label: t.admin.sidebar.categories,
      icon: BookOpen,
      color: "text-indigo-400",
    },
    {
      href: "/admin/coupons",
      label: t.admin.sidebar.coupons,
      icon: Tag,
      color: "text-rose-400",
    },
    {
      href: "/admin/students",
      label: t.admin.sidebar.students,
      icon: Users,
      color: "text-purple-400",
    },
    {
      href: "/admin/settings",
      label: t.admin.sidebar.settings,
      icon: Settings,
      color: "text-teal-400",
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-5 hidden md:flex flex-col justify-between flex-shrink-0">
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.admin.sidebar.adminCenter}
            </h2>
            <span className="text-[10px] text-amber-400 font-semibold">{userRole}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-xs">
          {navItems
            .filter((item) => {
              if (userRole === "INSTRUCTOR") {
                return ["/admin", "/admin/courses", "/admin/courses/new"].includes(item.href);
              }
              return true;
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${item.color}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4 px-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {t.admin.sidebar.backToHome}
        </Link>
      </div>
    </aside>
  );
}
