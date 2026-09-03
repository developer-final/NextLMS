"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  MessageSquare,
  Paperclip,
  Download,
  PlayCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { formatDuration, getYouTubeEmbedUrl } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { validateCommentInput } from "@/lib/validation";
import CustomVideoPlayer from "@/components/learn/CustomVideoPlayer";

interface LessonPlayerClientProps {
  course: any;
  currentSection: any;
  currentLesson: any;
  allLessons: any[];
  prevLesson: any;
  nextLesson: any;
  canAccessLesson: boolean;
  isEnrolled: boolean;
  completedLessonIds: string[];
  userProgressPercent: number;
  certificateCode: string | null;
  userId?: string;
  userName?: string;
}

export default function LessonPlayerClient({
  course,
  currentSection,
  currentLesson,
  allLessons,
  prevLesson,
  nextLesson,
  canAccessLesson,
  isEnrolled,
  completedLessonIds,
  userProgressPercent,
  certificateCode: initialCertCode,
  userId,
  userName,
}: LessonPlayerClientProps) {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [completedIds, setCompletedIds] = useState<string[]>(completedLessonIds);
  const [progressPercent, setProgressPercent] = useState(userProgressPercent);
  const [certCode, setCertCode] = useState<string | null>(initialCertCode);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Tab: Content | Comments / QA | Attachments
  const [activeTab, setActiveTab] = useState<"content" | "qa" | "attachments">("content");

  // QA Comment State
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Mobile Curriculum Drawer State
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false);

  const isCurrentCompleted = completedIds.includes(currentLesson.id);

  const lessonAttachments = currentLesson.attachments || [];
  const courseAttachments = course.attachments || [];
  const totalAttachmentsCount = lessonAttachments.length + courseAttachments.length;

  // Handle Mark Complete
  const handleMarkComplete = async () => {
    if (!userId) {
      toast.error(t.common.unauthorized);
      return;
    }

    setMarkingComplete(true);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: currentLesson.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.common.somethingWentWrong);
        return;
      }

      if (!completedIds.includes(currentLesson.id)) {
        setCompletedIds([...completedIds, currentLesson.id]);
      }

      setProgressPercent(data.progressPercent);

      if (data.isCompleted100) {
        setCertCode(data.certificate?.certificateCode || "CERT-WTL-PRO");
        setShowCertModal(true);
        toast.success(t.learn.completed);
      } else {
        toast.success(t.learn.completed);
        // Auto navigate to next lesson if available
        if (nextLesson) {
          router.push(`/learn/${course.slug}/${nextLesson.slug}`);
        }
      }
    } catch (err) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setMarkingComplete(false);
    }
  };

  // Load QA Comments when switching tab
  const handleTabChange = async (tab: "content" | "qa" | "attachments") => {
    setActiveTab(tab);
    if (tab === "qa" && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/comments?lessonId=${currentLesson.id}`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Submit QA Comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateCommentInput({
      lessonId: currentLesson.id,
      content: newComment,
    });
    if (!validation.isValid) {
      toast.error(t.learn.emptyCommentError);
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          content: newComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.learn.commentSubmitFailed);
        return;
      }

      setComments([data.comment, ...comments]);
      setNewComment("");
      toast.success(t.learn.sendQuestion);
    } catch (err) {
      toast.error(t.learn.commentSubmitFailed);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* 1. LMS Top Navbar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.learn.backToCourse}</span>
          </Link>

          <h2 className="hidden md:block text-xs font-bold text-white max-w-md truncate">
            {course.title}
          </h2>
        </div>

        {/* Progress Bar & Mobile Curriculum Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{t.learn.progressLabel}</span>
            <div className="h-2 w-24 sm:w-28 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-brand-400">{progressPercent}%</span>
          </div>

          {(progressPercent >= 100 || certCode) && (
            <button
              onClick={() => setShowCertModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-colors"
            >
              <Award className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.learn.viewCertificate}</span>
            </button>
          )}

          {/* Mobile Curriculum Toggle */}
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:bg-slate-800 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t.learn.mobileLessons}
          </button>
        </div>
      </div>

      {/* 2. Main LMS Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Video & Lesson Content */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col p-4 sm:p-6 lg:p-8 border-r border-slate-800/80">
          {/* Content Gate: Check If Allowed */}
          {!canAccessLesson ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center my-auto">
              <Lock className="mx-auto h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t.learn.lessonLockedTitle}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                {t.learn.lessonLockedDesc}
              </p>
              <Link
                href={`/checkout/${course.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow"
              >
                {t.learn.enrollToUnlockBtn} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Media Player (Custom LMS Video Player with S3 Signed URL & YouTube Auto-detect) */}
              {currentLesson.videoUrl ? (
                <CustomVideoPlayer
                  src={currentLesson.videoUrl}
                  title={currentLesson.title}
                  lessonId={currentLesson.id}
                  poster={course.thumbnailUrl}
                  onEnded={() => {
                    if (isEnrolled && !isCurrentCompleted) {
                      handleMarkComplete();
                    }
                  }}
                />
              ) : null}

              {/* Lesson Title & Mark Completed Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                    {currentSection?.title}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {currentLesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isEnrolled && (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        isCurrentCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-brand-500 text-slate-950 hover:bg-brand-400 shadow-glow"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isCurrentCompleted ? t.learn.completed : t.learn.markCompleted}
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
                <button
                  onClick={() => handleTabChange("content")}
                  className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === "content"
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="h-4 w-4" /> {t.learn.lessonContentTab}
                </button>
                <button
                  onClick={() => handleTabChange("qa")}
                  className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === "qa"
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" /> {t.learn.qaDiscussionTab}
                </button>
                <button
                  onClick={() => handleTabChange("attachments")}
                  className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === "attachments"
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Paperclip className="h-4 w-4" /> {t.learn.attachmentsTab}
                  {totalAttachmentsCount > 0 && (
                    <span className="ml-1 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-400 font-bold border border-brand-500/30">
                      {totalAttachmentsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab 1: Content Body */}
              {activeTab === "content" && (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line py-2">
                  {currentLesson.contentBody || t.learn.contentUpdating}
                </div>
              )}

              {/* Tab 2: Q&A Comments */}
              {activeTab === "qa" && (
                <div className="space-y-6 py-2">
                  {/* Form add QA */}
                  <form onSubmit={handleSendComment} className="space-y-3">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t.learn.qaPlaceholder}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submittingComment ? t.learn.sendingQuestion : t.learn.sendQuestion}
                      </button>
                    </div>
                  </form>

                  {/* List comments */}
                  {loadingComments ? (
                    <p className="text-xs text-slate-500">{t.learn.loadingQuestions}</p>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-slate-500">{t.learn.noQuestions}</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comm) => (
                        <div
                          key={comm.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                              {comm.user.name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-white">{comm.user.name}</span>
                            {comm.user.role === "INSTRUCTOR" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800 font-bold">
                                {t.learn.instructorBadge}
                              </span>
                            )}
                            {(comm.user.role === "ADMIN" || comm.user.role === "SUPER_ADMIN") && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 font-bold">
                                {t.learn.adminBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300">{comm.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Attachments (Lesson & Course-wide) */}
              {activeTab === "attachments" && (
                <div className="space-y-6 py-2">
                  {/* Lesson-specific attachments */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4" />
                      {t.learn.lessonAttachmentsTitle}
                    </h4>

                    {lessonAttachments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic bg-slate-900/40 rounded-xl p-3 border border-slate-800/60">
                        {t.learn.noAttachments}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {lessonAttachments.map((att: any) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-900/90"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-400 border border-brand-500/20">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="truncate text-xs font-bold text-white max-w-xs sm:max-w-md">
                                  {att.fileName}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {att.fileSize
                                    ? `${(att.fileSize / 1024 / 1024).toFixed(2)} MB`
                                    : "Tài liệu đính kèm"}
                                </p>
                              </div>
                            </div>

                            <a
                              href={`/api/attachments/${att.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-glow transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>{t.learn.downloadAttachment}</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Course-wide shared attachments */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {t.learn.courseAttachmentsTitle}
                    </h4>

                    {courseAttachments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic bg-slate-900/40 rounded-xl p-3 border border-slate-800/60">
                        Chưa có tài liệu dùng chung toàn khóa học.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courseAttachments.map((att: any) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-900/90"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="truncate text-xs font-bold text-white max-w-xs sm:max-w-md">
                                  {att.fileName}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {att.fileSize
                                    ? `${(att.fileSize / 1024 / 1024).toFixed(2)} MB`
                                    : "Tài liệu toàn khóa học"}
                                </p>
                              </div>
                            </div>

                            <a
                              href={`/api/attachments/${att.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-glow transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>{t.learn.downloadAttachment}</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Prev / Next Lesson Navigation Buttons */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                {prevLesson ? (
                  <Link
                    href={`/learn/${course.slug}/${prevLesson.slug}`}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="truncate max-w-[140px] sm:max-w-xs">{t.learn.prevLesson}: {prevLesson.title}</span>
                  </Link>
                ) : (
                  <div />
                )}

                {nextLesson && (
                  <Link
                    href={`/learn/${course.slug}/${nextLesson.slug}`}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
                  >
                    <span className="truncate max-w-[140px] sm:max-w-xs">{t.learn.nextLesson}: {nextLesson.title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Curriculum Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 bg-slate-950/60 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-400" /> {t.learn.lessonList}
            </h3>
          </div>

          <div className="space-y-3">
            {course.sections.map((section: any) => (
              <div
                key={section.id}
                className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60"
              >
                <div className="bg-slate-900/90 px-3.5 py-2.5 text-xs font-bold text-white border-b border-slate-800/60">
                  {section.title}
                </div>

                <div className="divide-y divide-slate-800/40">
                  {section.lessons.map((lesson: any) => {
                    const isCurrent = lesson.id === currentLesson.id;
                    const isDone = completedIds.includes(lesson.id);
                    const canView = isEnrolled || lesson.isPreview;

                    return (
                      <Link
                        key={lesson.id}
                        href={
                          canView ? `/learn/${course.slug}/${lesson.slug}` : `#`
                        }
                        className={`flex items-center justify-between p-3 text-xs transition-colors ${
                          isCurrent
                            ? "bg-brand-950/60 border-l-4 border-brand-500 text-brand-300 font-bold"
                            : "hover:bg-slate-800/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          ) : canView ? (
                            <PlayCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 text-slate-600 flex-shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>

                        <span className="text-[10px] text-slate-500 ml-2 flex-shrink-0">
                          {formatDuration(lesson.videoDuration)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Curriculum Drawer (Overlay) */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-slate-900 border-l border-slate-800 p-4 space-y-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-brand-400" /> {t.learn.lessonList}
              </h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {course.sections.map((section: any) => (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60"
                >
                  <div className="bg-slate-950 px-3.5 py-2 text-xs font-bold text-white border-b border-slate-800/60">
                    {section.title}
                  </div>

                  <div className="divide-y divide-slate-800/40">
                    {section.lessons.map((lesson: any) => {
                      const isCurrent = lesson.id === currentLesson.id;
                      const isDone = completedIds.includes(lesson.id);
                      const canView = isEnrolled || lesson.isPreview;

                      return (
                        <Link
                          key={lesson.id}
                          href={canView ? `/learn/${course.slug}/${lesson.slug}` : `#`}
                          onClick={() => setShowMobileSidebar(false)}
                          className={`flex items-center justify-between p-3 text-xs transition-colors ${
                            isCurrent
                              ? "bg-brand-950/60 border-l-4 border-brand-500 text-brand-300 font-bold"
                              : "hover:bg-slate-800/40 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            ) : canView ? (
                              <PlayCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 ml-1.5 flex-shrink-0">
                            {formatDuration(lesson.videoDuration)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Certificate Completion Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-2xl text-center space-y-6">
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Medal Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-glow-gold">
              <Award className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {t.learn.certModalBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {t.learn.certModalTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.learn.certModalDesc}
              </p>
            </div>

            {/* Certificate Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-3 text-left">
              <p className="text-xs text-slate-400">{t.learn.certAwardedTo}</p>
              <h3 className="text-xl font-bold text-brand-400">
                {userName || t.learn.certDistinguishedStudent}
              </h3>
              <p className="text-xs text-slate-300">
                {t.learn.certCompletedCourse} <strong>{course.title}</strong>
              </p>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                <span>{t.learn.certVerifyCode} <strong className="text-amber-400">{certCode || "CERT-WTL-9988"}</strong></span>
                <span>{t.learn.certIssueDate} {new Date().toLocaleDateString(language)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/certificates/${certCode || "CERT-WTL-PRO"}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCertModal(false)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow-gold transition-all hover:scale-105"
              >
                <Download className="h-4 w-4" />
                {t.learn.certDownloadPdf}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

