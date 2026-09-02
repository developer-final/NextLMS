"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  Plus,
  Save,
  Trash2,
  Video,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CourseEditFormProps {
  course: any;
  categories: any[];
}

export default function CourseEditForm({ course, categories }: CourseEditFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // General course info
  const [title, setTitle] = useState(course.title || "");
  const [slug, setSlug] = useState(course.slug || "");
  const [categoryId, setCategoryId] = useState(course.categoryId || categories[0]?.id || "");
  const [level, setLevel] = useState(course.level || "ALL_LEVELS");
  const [status, setStatus] = useState(course.status || "PUBLISHED");
  const [price, setPrice] = useState(course.price ? String(course.price) : "0");
  const [salePrice, setSalePrice] = useState(course.salePrice ? String(course.salePrice) : "");
  const [isFree, setIsFree] = useState(Boolean(course.isFree));
  const [isFeatured, setIsFeatured] = useState(Boolean(course.isFeatured));
  const [certificateEnabled, setCertificateEnabled] = useState(
    course.certificateEnabled !== undefined ? Boolean(course.certificateEnabled) : true
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl || "");
  const [introVideoUrl, setIntroVideoUrl] = useState(course.introVideoUrl || "");
  const [shortDescription, setShortDescription] = useState(course.shortDescription || "");
  const [description, setDescription] = useState(course.description || "");

  // Sections & Lessons structure
  const [sections, setSections] = useState<any[]>(
    course.sections?.length > 0
      ? course.sections.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          lessons: s.lessons?.length > 0
            ? s.lessons.map((l: any) => ({
                id: l.id,
                title: l.title,
                slug: l.slug,
                videoUrl: l.videoUrl || "",
                videoDuration: l.videoDuration || 600,
                contentType: l.contentType || "VIDEO_YOUTUBE",
                isPreview: Boolean(l.isPreview),
                contentBody: l.contentBody || "",
              }))
            : [
                {
                  title: "Bài 1: Tổng quan",
                  videoUrl: "",
                  videoDuration: 600,
                  contentType: "VIDEO_YOUTUBE",
                  isPreview: true,
                  contentBody: "",
                },
              ],
        }))
      : [
          {
            title: "Chương 1: Khởi động & Nền tảng",
            lessons: [
              {
                title: "Bài 1: Giới thiệu & Lộ trình học",
                videoUrl: "",
                videoDuration: 600,
                contentType: "VIDEO_YOUTUBE",
                isPreview: true,
                contentBody: "",
              },
            ],
          },
        ]
  );

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Chương ${sections.length + 1}: Nội dung tiếp theo`,
        lessons: [
          {
            title: `Bài 1: Tổng quan chương ${sections.length + 1}`,
            videoUrl: "",
            videoDuration: 900,
            contentType: "VIDEO_YOUTUBE",
            isPreview: false,
            contentBody: "",
          },
        ],
      },
    ]);
  };

  const removeSection = (sIdx: number) => {
    if (sections.length <= 1) {
      toast.error("Khóa học cần có ít nhất 1 chương");
      return;
    }
    setSections(sections.filter((_, idx) => idx !== sIdx));
  };

  const addLesson = (sIdx: number) => {
    const updated = [...sections];
    updated[sIdx].lessons.push({
      title: `Bài ${updated[sIdx].lessons.length + 1}`,
      videoUrl: "",
      videoDuration: 1200,
      contentType: "VIDEO_YOUTUBE",
      isPreview: false,
      contentBody: "",
    });
    setSections(updated);
  };

  const removeLesson = (sIdx: number, lIdx: number) => {
    const updated = [...sections];
    if (updated[sIdx].lessons.length <= 1) {
      toast.error("Mỗi chương cần có ít nhất 1 bài học");
      return;
    }
    updated[sIdx].lessons = updated[sIdx].lessons.filter((_: any, idx: number) => idx !== lIdx);
    setSections(updated);
  };

  const updateSectionTitle = (sIdx: number, val: string) => {
    const updated = [...sections];
    updated[sIdx].title = val;
    setSections(updated);
  };

  const updateLessonField = (sIdx: number, lIdx: number, field: string, val: any) => {
    const updated = [...sections];
    updated[sIdx].lessons[lIdx][field] = val;
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t.admin.createCourse.courseTitleLabel);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          categoryId,
          level,
          status,
          price: isFree ? 0 : price,
          salePrice: isFree ? 0 : salePrice,
          isFree,
          isFeatured,
          certificateEnabled,
          thumbnailUrl,
          introVideoUrl,
          shortDescription,
          description,
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.editCourse.saveError);
        return;
      }

      toast.success(`🎉 ${t.admin.editCourse.saveSuccess}`);
      router.refresh();
    } catch (err) {
      toast.error(t.admin.editCourse.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.courses.deleteError);
        return;
      }

      toast.success(t.admin.courses.deleteSuccess);
      setShowDeleteModal(false);
      router.push("/admin/courses");
      router.refresh();
    } catch (err) {
      toast.error(t.admin.courses.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t.admin.editCourse.backToCourses}
          </Link>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            {t.admin.editCourse.title}
          </h1>
          <p className="text-xs text-slate-400">ID: {course.id}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-brand-400" /> {t.admin.courses.viewPage}
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 px-3.5 py-2.5 text-xs font-semibold text-rose-400 border border-rose-800/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t.admin.courses.deleteBtn}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? t.admin.editCourse.savingChangesBtn : t.admin.editCourse.saveChangesBtn}
          </button>
        </div>
      </div>

      {/* 1. Basic Info & Pricing */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> 1. {t.admin.createCourse.basicInfo}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.courseTitleLabel} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Slug URL</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.editCourse.statusLabel}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-semibold focus:border-brand-500 focus:outline-none"
            >
              <option value="PUBLISHED">{t.admin.editCourse.publishedOption}</option>
              <option value="DRAFT">{t.admin.editCourse.draftOption}</option>
              <option value="ARCHIVED">{t.admin.editCourse.archivedOption}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">{t.admin.createCourse.categoryLabel}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">{t.admin.createCourse.levelLabel}</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL_LEVELS">{t.common.allLevels}</option>
              <option value="BEGINNER">{t.common.beginner}</option>
              <option value="INTERMEDIATE">{t.common.intermediate}</option>
              <option value="ADVANCED">{t.common.advanced}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.originalPriceLabel}
            </label>
            <input
              type="number"
              disabled={isFree}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.salePriceLabel}
            </label>
            <input
              type="number"
              disabled={isFree}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none disabled:opacity-40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="rounded border-slate-700 text-brand-500 focus:ring-brand-500 h-4 w-4 bg-slate-950"
              />
              <span>{t.admin.createCourse.freeCheckbox}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-amber-400">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-950"
              />
              <span>{t.admin.createCourse.featuredCheckbox}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-emerald-400">
              <input
                type="checkbox"
                checked={certificateEnabled}
                onChange={(e) => setCertificateEnabled(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-slate-950"
              />
              <span>{t.admin.editCourse.certificateCheckbox}</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Media & Descriptions */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
          <Video className="h-4 w-4" /> 2. {t.admin.createCourse.thumbnailLabel} & {t.admin.createCourse.descLabel}
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.thumbnailLabel}
            </label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.introVideoLabel}
            </label>
            <input
              type="text"
              value={introVideoUrl}
              onChange={(e) => setIntroVideoUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">{t.admin.createCourse.shortDescLabel}</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.descLabel} (Markdown / Rich Text)
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Curriculum Sections & Lessons */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
              <Layers className="h-4 w-4" /> 3. {t.admin.createCourse.curriculum}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sections.length} {t.admin.courses.chaptersLessons.split("•")[0]} •{" "}
              {sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)}{" "}
              {t.admin.courses.chaptersLessons.split("•")[1] || "lessons"}
            </p>
          </div>

          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-brand-400 border border-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> {t.admin.createCourse.addSectionBtn}
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((sec, sIdx) => (
            <div
              key={sec.id || sIdx}
              className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold text-xs text-brand-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Chương {sIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                    className="flex-1 font-bold text-sm text-white bg-transparent border-b border-slate-800 pb-1 focus:border-brand-500 focus:outline-none"
                    placeholder={t.admin.createCourse.sectionTitlePlaceholder}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSection(sIdx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title={t.admin.createCourse.deleteSectionBtn}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Lessons inside section */}
              <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                {sec.lessons.map((les: any, lIdx: number) => (
                  <div
                    key={les.id || lIdx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-semibold text-slate-400">
                          #{lIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={les.title}
                          onChange={(e) =>
                            updateLessonField(sIdx, lIdx, "title", e.target.value)
                          }
                          className="flex-1 font-semibold text-white bg-transparent border-b border-slate-800 pb-0.5 focus:border-brand-500 focus:outline-none"
                          placeholder={t.admin.createCourse.lessonTitlePlaceholder}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLesson(sIdx, lIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={les.videoUrl || ""}
                          onChange={(e) =>
                            updateLessonField(sIdx, lIdx, "videoUrl", e.target.value)
                          }
                          placeholder={t.admin.createCourse.videoUrlPlaceholder}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={les.videoDuration || 600}
                          onChange={(e) =>
                            updateLessonField(sIdx, lIdx, "videoDuration", e.target.value)
                          }
                          placeholder={t.admin.createCourse.durationSecondsLabel}
                          className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-brand-400 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={les.isPreview}
                            onChange={(e) =>
                              updateLessonField(sIdx, lIdx, "isPreview", e.target.checked)
                            }
                            className="rounded border-slate-700 text-brand-500 h-3.5 w-3.5 bg-slate-950"
                          />
                          <span>{t.admin.createCourse.freePreviewCheckbox}</span>
                        </label>
                      </div>
                    </div>

                    {/* Lesson Content Body */}
                    <div>
                      <input
                        type="text"
                        value={les.contentBody || ""}
                        onChange={(e) =>
                          updateLessonField(sIdx, lIdx, "contentBody", e.target.value)
                        }
                        placeholder={t.admin.createCourse.lessonContentPlaceholder}
                        className="w-full rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addLesson(sIdx)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 pt-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> {t.admin.createCourse.addLessonBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 shadow-2xl">
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 px-4 py-2.5 text-xs font-semibold text-rose-400 border border-rose-800/40 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> {t.admin.editCourse.deleteCourseBtn}
        </button>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {t.admin.editCourse.backToCourses}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? t.admin.editCourse.savingChangesBtn : t.admin.editCourse.saveChangesBtn}
          </button>
        </div>
      </div>

      {/* Modal Confirm Delete Course */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-md w-full rounded-3xl border border-rose-900/60 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-2xl bg-rose-950 flex items-center justify-center border border-rose-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.admin.editCourse.deleteCourseBtn}</h3>
                <p className="text-[11px] text-slate-400">{course.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.admin.courses.deleteConfirm}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                {t.admin.categories.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-all"
              >
                {deleting ? "Đang xóa..." : t.admin.courses.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
