"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  PlusCircle,
  Search,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface StudentsListClientProps {
  initialStudents: any[];
  courses: any[];
}

export default function StudentsListClient({
  initialStudents,
  courses,
}: StudentsListClientProps) {
  const { t } = useLanguage();
  const [students, setStudents] = useState<any[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [granting, setGranting] = useState(false);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleGrantAccess = async () => {
    if (!selectedStudent || !selectedCourseId) return;
    setGranting(true);
    try {
      const res = await fetch("/api/admin/enrollments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent.id,
          courseId: selectedCourseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error granting access");
        return;
      }

      toast.success("🎉 " + data.message);
      setSelectedStudent(null);
      // Update local state
      const targetCourse = courses.find((c) => c.id === selectedCourseId);
      setStudents(
        students.map((s) => {
          if (s.id === selectedStudent.id) {
            // avoid duplicate
            const exists = s.enrollments.some((e: any) => e.course?.id === selectedCourseId);
            if (exists) return s;
            return {
              ...s,
              enrollments: [
                ...s.enrollments,
                {
                  id: data.enrollment.id,
                  course: { id: selectedCourseId, title: targetCourse?.title },
                  progressPercent: 0,
                  status: "ACTIVE",
                },
              ],
            };
          }
          return s;
        })
      );
    } catch (err) {
      toast.error("Error granting access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeEnrollment = async (
    userId: string,
    courseId: string,
    courseTitle: string,
    enrollmentId: string
  ) => {
    if (!confirm(`${t.admin.students.revokeConfirm} (${courseTitle})`)) return;

    try {
      const res = await fetch(`/api/admin/enrollments/manual?id=${enrollmentId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi thu hồi quyền học");
        return;
      }

      toast.success(t.admin.students.revokeSuccess);
      setStudents(
        students.map((s) => {
          if (s.id === userId) {
            return {
              ...s,
              enrollments: s.enrollments.filter((e: any) => e.id !== enrollmentId),
            };
          }
          return s;
        })
      );
    } catch {
      toast.error("Lỗi thu hồi quyền học");
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    // Optimistic update
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );

    try {
      const res = await fetch("/api/admin/enrollments/manual", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: studentId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error();
      }
      toast.success(t.admin.students.statusUpdated);
    } catch {
      // Rollback
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: currentStatus } : s))
      );
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white">{t.admin.students.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.admin.students.subtitle} ({students.length})
        </p>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t.admin.students.nameHeader}, email...`}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">{t.admin.students.nameHeader}</th>
              <th className="px-5 py-3.5">{t.admin.students.joinedDateHeader}</th>
              <th className="px-5 py-3.5">{t.admin.students.enrolledCoursesHeader}</th>
              <th className="px-5 py-3.5">{t.admin.coupons.statusHeader}</th>
              <th className="px-5 py-3.5 text-right">{t.admin.courses.actionHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  -
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.email}</div>
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4">
                    {s.enrollments.length === 0 ? (
                      <span className="text-[11px] text-slate-500">-</span>
                    ) : (
                      <div className="space-y-1.5 max-w-sm">
                        {s.enrollments.map((enr: any) => (
                          <div
                            key={enr.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                              <span className="truncate text-slate-200">{enr.course?.title}</span>
                              <span className="text-brand-400 font-bold flex-shrink-0">
                                ({enr.progressPercent}%)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRevokeEnrollment(
                                  s.id,
                                  enr.course?.id,
                                  enr.course?.title,
                                  enr.id
                                )
                              }
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors flex-shrink-0"
                              title={t.admin.students.revokeBtn}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s.id, s.status || "ACTIVE")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        s.status === "BLOCKED"
                          ? "bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                      }`}
                      title={t.admin.students.toggleStatusBtn}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.status === "BLOCKED" ? "bg-rose-400" : "bg-emerald-400"
                        }`}
                      />
                      {s.status === "BLOCKED"
                        ? t.admin.students.statusBlocked
                        : t.admin.students.statusActive}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-brand-500 hover:text-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> {t.admin.students.grantBtn}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grant Access Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-brand-400" /> {t.admin.students.modalTitle}
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>
                {t.admin.students.nameHeader}: <strong className="text-white">{selectedStudent.name}</strong>
              </p>
              <p>
                {t.admin.students.emailHeader}: <strong className="text-white">{selectedStudent.email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.students.selectCourseLabel}:
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t.admin.students.cancelBtn}
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={granting}
                className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50"
              >
                {granting ? t.admin.students.grantingBtn : t.admin.students.grantBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
