"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Video,
  Layers,
  ArrowRight,
  Paperclip,
  FileText,
  UploadCloud,
  FileUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { validateCourseInput } from "@/lib/validation";
import FileUploadZone from "@/components/ui/FileUploadZone";

interface CourseCreateFormProps {
  categories: any[];
}

export default function CourseCreateForm({ categories }: CourseCreateFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);

  // General course info
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [level, setLevel] = useState("ALL_LEVELS");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [manualThumbnail, setManualThumbnail] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  // Course-level shared attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showCourseUpload, setShowCourseUpload] = useState(false);
  const [openLessonUploadKey, setOpenLessonUploadKey] = useState<string | null>(null);
  const [openLessonVideoUploadKey, setOpenLessonVideoUploadKey] = useState<string | null>(null);

  // Sections & Lessons structure
  const [sections, setSections] = useState<any[]>([
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
          attachments: [],
        },
      ],
    },
  ]);

  const addCourseAttachment = (att: any) => {
    setAttachments((prev) => [...prev, att]);
  };

  const removeCourseAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addLessonAttachment = (sIdx: number, lIdx: number, att: any) => {
    const updated = [...sections];
    if (!updated[sIdx].lessons[lIdx].attachments) {
      updated[sIdx].lessons[lIdx].attachments = [];
    }
    updated[sIdx].lessons[lIdx].attachments.push(att);
    setSections(updated);
  };

  const removeLessonAttachment = (sIdx: number, lIdx: number, aIdx: number) => {
    const updated = [...sections];
    updated[sIdx].lessons[lIdx].attachments = updated[sIdx].lessons[lIdx].attachments.filter(
      (_: any, idx: number) => idx !== aIdx
    );
    setSections(updated);
  };

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
            attachments: [],
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
      const res = await fetch("/api/admin/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          categoryId,
          level,
          price,
          salePrice,
          isFree,
          isFeatured,
          thumbnailUrl,
          introVideoUrl,
          shortDescription,
          description,
          attachments,
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.createCourse.createError);
        return;
      }

      toast.success(`🎉 ${t.admin.createCourse.createSuccess}`);
      router.push(`/courses/${data.course.slug}`);
      router.refresh();
    } catch (err) {
      toast.error(t.admin.createCourse.createError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      <div className="border-b border-slate-800 pb-4 space-y-1">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t.admin.editCourse.backToCourses}
        </Link>
        <h1 className="text-2xl font-extrabold text-white">{t.admin.createCourse.title}</h1>
        <p className="text-xs text-slate-400">
          {t.admin.createCourse.subtitle}
        </p>
      </div>

      {/* 1. Basic Info */}
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
              placeholder={t.admin.createCourse.courseTitlePlaceholder}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
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
              placeholder="1200000"
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
              placeholder="790000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none disabled:opacity-40"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
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
                placeholder={t.admin.createCourse.thumbnailPlaceholder}
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
              placeholder={t.admin.createCourse.introVideoPlaceholder}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">{t.admin.createCourse.shortDescLabel}</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder={t.admin.createCourse.shortDescPlaceholder}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {t.admin.createCourse.descLabel}
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.admin.createCourse.descPlaceholder}
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
              onUploadSuccess={(res) => {
                addCourseAttachment(res);
              }}
              helperText="Hỗ trợ PDF, Word, Excel, PowerPoint, ZIP, RAR, CSV,... (Tối đa 50MB)"
            />
          </div>
        )}

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="space-y-2 pt-1">
            {attachments.map((att, idx) => (
              <div
                key={idx}
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
                    onClick={() => removeCourseAttachment(idx)}
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
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-brand-400 border border-slate-700"
          >
            <Plus className="h-4 w-4" /> {t.admin.createCourse.addSectionBtn}
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((sec, sIdx) => (
            <div
              key={sIdx}
              className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                  className="flex-1 font-bold text-sm text-white bg-transparent border-b border-slate-800 pb-1 focus:border-brand-500 focus:outline-none"
                  placeholder={t.admin.createCourse.sectionTitlePlaceholder}
                />
                <button
                  type="button"
                  onClick={() => removeSection(sIdx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                  title={t.admin.createCourse.deleteSectionBtn}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Lessons inside section */}
              <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                {sec.lessons.map((les: any, lIdx: number) => (
                  <div
                    key={lIdx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={les.title}
                        onChange={(e) =>
                          updateLessonField(sIdx, lIdx, "title", e.target.value)
                        }
                        className="flex-1 font-semibold text-white bg-transparent border-b border-slate-800 pb-0.5 focus:border-brand-500 focus:outline-none"
                        placeholder={t.admin.createCourse.lessonTitlePlaceholder}
                      />
                      <button
                        type="button"
                        onClick={() => removeLesson(sIdx, lIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
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

                      {/* Small Upload Zone for Lesson - Only open when clicked */}
                      {openLessonUploadKey === `${sIdx}-${lIdx}` && (
                        <div className="pt-1">
                          <FileUploadZone
                            type="attachment"
                            onUploadSuccess={(res) => addLessonAttachment(sIdx, lIdx, res)}
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
                              key={aIdx}
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
                                onClick={() => removeLessonAttachment(sIdx, lIdx, aIdx)}
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
                  className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 pt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> {t.admin.createCourse.addLessonBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-400 px-8 py-4 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-105 disabled:opacity-50"
        >
          {loading ? t.admin.createCourse.submittingBtn : t.admin.createCourse.submitBtn}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

