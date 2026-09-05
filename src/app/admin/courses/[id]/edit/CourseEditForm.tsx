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
  Paperclip,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { validateCourseInput } from "@/lib/validation";
import FileUploadZone from "@/components/ui/FileUploadZone";
import AICopilotDrawer from "@/components/admin/ai/AICopilotDrawer";
import CourseAIGeneratorModal from "@/components/admin/ai/CourseAIGeneratorModal";

interface CourseEditFormProps {
  course: any;
  categories: any[];
}

export default function CourseEditForm({ course, categories }: CourseEditFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedText, setSelectedText] = useState("");

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
  const [manualThumbnail, setManualThumbnail] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState(course.introVideoUrl || "");
  const [shortDescription, setShortDescription] = useState(course.shortDescription || "");
  const [description, setDescription] = useState(course.description || "");

  // Course tags
  const [tags, setTags] = useState<string[]>(
    course.tags ? course.tags.map((tg: any) => tg.name) : []
  );
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (e) e.preventDefault();

    const clean = tagInput.trim().replace(/,/g, "");
    if (!clean) return;

    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Course-level shared attachments
  const [attachments, setAttachments] = useState<any[]>(course.attachments || []);
  const [showCourseUpload, setShowCourseUpload] = useState(false);
  const [openLessonUploadKey, setOpenLessonUploadKey] = useState<string | null>(null);
  const [openLessonVideoUploadKey, setOpenLessonVideoUploadKey] = useState<string | null>(null);

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
                attachments: l.attachments || [],
              }))
            : [
                {
                  title: "Bài 1: Tổng quan",
                  videoUrl: "",
                  videoDuration: 600,
                  contentType: "VIDEO_YOUTUBE",
                  isPreview: true,
                  contentBody: "",
                  attachments: [],
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
      toast.error(t.admin.courses.minSectionsRequired);
      return;
    }
    setSections(sections.filter((_, idx) => idx !== sIdx));
  };

  const addCourseAttachment = (att: any) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveCourseAttachment = async (idx: number, att: any) => {
    if (att.id) {
      try {
        const res = await fetch(`/api/admin/courses/attachments/${att.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          toast.error(t.admin.courses.attachmentDeleteFailed);
          return;
        }
      } catch {
        toast.error(t.admin.courses.attachmentDeleteFailed);
        return;
      }
    }
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    toast.success(t.admin.courses.attachmentDeleted);
  };

  const addLessonAttachment = (sIdx: number, lIdx: number, att: any) => {
    const updated = [...sections];
    if (!updated[sIdx].lessons[lIdx].attachments) {
      updated[sIdx].lessons[lIdx].attachments = [];
    }
    updated[sIdx].lessons[lIdx].attachments.push(att);
    setSections(updated);
  };

  const handleRemoveLessonAttachment = async (
    sIdx: number,
    lIdx: number,
    aIdx: number,
    att: any
  ) => {
    if (att.id) {
      try {
        const res = await fetch(`/api/admin/courses/attachments/${att.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          toast.error(t.admin.courses.attachmentDeleteFailed);
          return;
        }
      } catch {
        toast.error(t.admin.courses.attachmentDeleteFailed);
        return;
      }
    }
    const updated = [...sections];
    updated[sIdx].lessons[lIdx].attachments = updated[sIdx].lessons[lIdx].attachments.filter(
      (_: any, idx: number) => idx !== aIdx
    );
    setSections(updated);
    toast.success(t.admin.courses.attachmentDeleted);
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
      attachments: [],
    });
    setSections(updated);
  };


  const removeLesson = (sIdx: number, lIdx: number) => {
    const updated = [...sections];
    if (updated[sIdx].lessons.length <= 1) {
      toast.error(t.admin.courses.minLessonsRequired);
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

    const validation = validateCourseInput({
      title,
      price,
      salePrice,
      isFree,
      sections,
    });
    if (!validation.isValid) {
      toast.error(
        validation.error?.includes("giá gốc")
          ? t.admin.courses.salePriceInvalid
          : validation.error?.includes("tiêu đề")
          ? t.admin.courses.courseTitleRequired
          : validation.error?.includes("chương")
          ? t.admin.courses.minSectionsRequired
          : (t.admin.courses.courseValidationFailed || validation.error)
      );
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
          attachments,
          sections,
          tagNames: tags,
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

          {/* Tags */}
          <div className="md:col-span-2 pt-3 border-t border-slate-800/80">
            <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-cyan-400" />
              {t.admin.courses.tagsLabel}
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              {t.admin.courses.tagsHelpText}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t.admin.courses.tagsPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:text-rose-400 transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-300 font-semibold">
                {t.admin.createCourse.coverImageLabel || t.admin.createCourse.thumbnailLabel}
              </label>
              <button
                type="button"
                onClick={() => setManualThumbnail(!manualThumbnail)}
                className="text-[11px] text-brand-400 hover:underline"
              >
                {manualThumbnail ? "Tải ảnh từ máy tính (S3)" : "Nhập URL thủ công"}
              </button>
            </div>

            {manualThumbnail ? (
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            ) : (
              <FileUploadZone
                type="thumbnail"
                currentUrl={thumbnailUrl}
                onUploadSuccess={(res) => setThumbnailUrl(res.url)}
                onRemove={() => setThumbnailUrl("")}
              />
            )}
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
              id="course-description-textarea"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onSelect={(e) => {
                const target = e.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                setSelectedText(start !== end ? target.value.substring(start, end) : "");
              }}
              onKeyUp={(e) => {
                const target = e.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                setSelectedText(start !== end ? target.value.substring(start, end) : "");
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                setSelectedText(start !== end ? target.value.substring(start, end) : "");
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Course-wide Shared Attachments (Collapsible) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> 3. {t.admin.createCourse.courseAttachmentsLabel}
              <span className="text-xs font-normal text-slate-400 normal-case">
                ({attachments.length} tệp)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t.admin.createCourse.courseAttachmentsDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCourseUpload(!showCourseUpload)}
            className="flex items-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 px-3.5 py-1.5 text-xs font-bold text-brand-400 transition-all"
          >
            {showCourseUpload ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Thu gọn khung tải lên
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> + Tải lên tài liệu mới
              </>
            )}
          </button>
        </div>

        {/* Collapsible Upload Zone */}
        {showCourseUpload && (
          <div className="pt-2">
            <FileUploadZone
              type="attachment"
              courseId={course.id}
              onUploadSuccess={(res) => addCourseAttachment(res.attachment || res)}
              helperText="Hỗ trợ PDF, Word, Excel, PowerPoint, ZIP, RAR, CSV,... (Tối đa 50MB)"
            />
          </div>
        )}

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="space-y-2 pt-1">
            {attachments.map((att, idx) => (
              <div
                key={att.id || idx}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="rounded-lg bg-slate-800 p-2 text-brand-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate font-semibold text-white max-w-sm">
                      {att.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {att.fileSize ? `${(att.fileSize / 1024 / 1024).toFixed(2)} MB` : "Tệp đính kèm"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveCourseAttachment(idx, att)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Xóa tài liệu này"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Curriculum Sections & Lessons */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
            <Layers className="h-4 w-4" /> 4. {t.admin.createCourse.curriculum}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500/20 to-emerald-500/20 hover:from-brand-500/30 hover:to-emerald-500/30 px-3 py-1.5 text-xs font-bold text-brand-400 border border-brand-500/40 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4 animate-pulse" /> {t.admin.ai.generateCourseBtn}
            </button>
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-brand-400 border border-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> {t.admin.createCourse.addSectionBtn}
            </button>
          </div>
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
                      <div className="sm:col-span-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Video bài giảng
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const key = `${sIdx}-${lIdx}`;
                              setOpenLessonVideoUploadKey(
                                openLessonVideoUploadKey === key ? null : key
                              );
                            }}
                            className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Video className="h-3 w-3" />
                            {openLessonVideoUploadKey === `${sIdx}-${lIdx}`
                              ? "Nhập link thủ công"
                              : "Tải video lên S3 (1GB)"}
                          </button>
                        </div>

                        {openLessonVideoUploadKey === `${sIdx}-${lIdx}` ? (
                          <FileUploadZone
                            type="video"
                            lessonId={les.id}
                            onUploadSuccess={(res) => {
                              updateLessonField(sIdx, lIdx, "videoUrl", res.url);
                              updateLessonField(sIdx, lIdx, "contentType", "VIDEO_CDN");
                              setOpenLessonVideoUploadKey(null);
                              toast.success(t.admin.courses.videoUploadSuccess);
                            }}
                            helperText={t.admin.courses.videoUploadHelp}
                            className="py-1"
                          />
                        ) : (
                          <input
                            type="text"
                            value={les.videoUrl || ""}
                            onChange={(e) =>
                              updateLessonField(sIdx, lIdx, "videoUrl", e.target.value)
                            }
                            placeholder={t.admin.createCourse.videoUrlPlaceholder}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                          />
                        )}
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

                    {/* Lesson Attachments Box (Collapsible) */}
                    <div className="pt-2 border-t border-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5 text-brand-400" />
                          {t.admin.createCourse.lessonAttachmentsLabel} ({les.attachments?.length || 0})
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const key = `${sIdx}-${lIdx}`;
                            setOpenLessonUploadKey(openLessonUploadKey === key ? null : key);
                          }}
                          className="text-[11px] font-semibold text-brand-400 hover:underline flex items-center gap-1"
                        >
                          {openLessonUploadKey === `${sIdx}-${lIdx}` ? (
                            <>
                              <ChevronUp className="h-3 w-3" /> Thu gọn
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Đính kèm tệp
                            </>
                          )}
                        </button>
                      </div>

                      {/* Small Upload Zone for Lesson - Only shown when expanded */}
                      {openLessonUploadKey === `${sIdx}-${lIdx}` && (
                        <div className="pt-1">
                          <FileUploadZone
                            type="attachment"
                            lessonId={les.id}
                            onUploadSuccess={(res) =>
                              addLessonAttachment(sIdx, lIdx, res.attachment || res)
                            }
                            helperText="Tải file bài tập, slide hoặc dữ liệu riêng cho bài này"
                            className="py-1"
                          />
                        </div>
                      )}

                      {/* Lesson Attachment Items */}
                      {les.attachments && les.attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {les.attachments.map((att: any, aIdx: number) => (
                            <div
                              key={att.id || aIdx}
                              className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-[11px] border border-slate-800/80"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                                <span className="truncate text-slate-200">{att.fileName}</span>
                                {att.fileSize && (
                                  <span className="text-slate-500 text-[10px]">
                                    ({(att.fileSize / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveLessonAttachment(sIdx, lIdx, aIdx, att)
                                }
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Xóa tài liệu bài học này"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        mode="course"
        courseId={course.id}
        defaultTopic={title}
        currentSelectedText={selectedText}
        onInsertText={(text) => {
          setDescription((prev: string) => (prev ? `${prev}\n\n${text}` : text));
          toast.success("Đã chèn nội dung vào mô tả khóa học!");
        }}
        onReplaceText={(text) => {
          const textarea = document.getElementById("course-description-textarea") as HTMLTextAreaElement;
          if (!textarea) {
            setDescription(text);
            return;
          }
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          if (start === end) {
            setDescription((prev: string) => (prev ? `${prev}\n\n${text}` : text));
          } else {
            const newContent = description.substring(0, start) + text + description.substring(end);
            setDescription(newContent);
          }
          setSelectedText("");
        }}
        onApplyTitle={(newTitle) => {
          setTitle(newTitle);
        }}
      />

      {/* Course AI Generator Modal */}
      <CourseAIGeneratorModal
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        courseId={course.id}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </form>
  );
}
