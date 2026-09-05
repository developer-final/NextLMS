"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Loader2,
  BookOpen,
  CheckCircle2,
  ListOrdered,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { CourseOutline } from "@/lib/ai/types";

interface KnowledgeDocItem {
  id: string;
  title: string;
  fileName: string;
  chunkCount: number;
  status: string;
}

interface CourseAIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess?: () => void;
}

export default function CourseAIGeneratorModal({
  isOpen,
  onClose,
  courseId,
  onSuccess,
}: CourseAIGeneratorModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<
    "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS"
  >("ALL_LEVELS");
  const [targetAudience, setTargetAudience] = useState("Học viên mọi trình độ");

  // RAG Knowledge Docs Selection
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Step 2 Syllabus Plan
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  // Step 3 Progressive Execution
  const [isExecuting, setIsExecuting] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLessonsToGenerate, setTotalLessonsToGenerate] = useState(0);

  // Fetch available knowledge documents when opening modal
  useEffect(() => {
    if (isOpen) {
      setLoadingDocs(true);
      const url = courseId
        ? `/api/admin/ai/knowledge/upload?courseId=${courseId}`
        : `/api/admin/ai/knowledge/upload`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.documents && Array.isArray(data.documents)) {
            setKnowledgeDocs(data.documents);
            setSelectedDocIds(
              data.documents
                .filter((d: KnowledgeDocItem) => d.status === "READY")
                .map((d: KnowledgeDocItem) => d.id)
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDocs(false));
    }
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      toast.error("Vui lòng nhập chủ đề khóa học");
      return;
    }

    setIsPlanning(true);
    try {
      const res = await fetch("/api/admin/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "plan",
          topic,
          level,
          targetAudience,
          knowledgeDocIds: selectedDocIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.outline) {
        setOutline(data.outline);
        setStep(2);
        toast.success(t.admin.ai.planReadyDesc);
      } else {
        toast.error(data.error || "Lỗi khi sinh đề cương");
      }
    } catch {
      toast.error("Lỗi kết nối khi sinh đề cương");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleExecuteCurriculum = async () => {
    if (!outline) return;

    setStep(3);
    setIsExecuting(true);
    setProgressPercent(5);
    setProgressStatus("Đang thiết lập cấu trúc chương & bài học...");

    try {
      // Step 3a: Fast Structure Initialization (~100ms)
      const initRes = await fetch("/api/admin/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init-structure",
          courseId,
          outline,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success || !Array.isArray(initData.lessons)) {
        throw new Error(initData.error || "Lỗi thiết lập cấu trúc giáo trình");
      }

      const createdLessons = initData.lessons;
      const total = createdLessons.length;
      setTotalLessonsToGenerate(total);

      // Step 3b: Progressive lesson content generation
      for (let i = 0; i < total; i++) {
        const les = createdLessons[i];
        const currentIdx = i + 1;
        const percent = Math.round((currentIdx / total) * 90) + 5;
        setProgressPercent(percent);
        setCompletedCount(currentIdx);
        setProgressStatus(
          `Đang tạo nội dung cho "${les.lessonTitle}" (${currentIdx}/${total})...`
        );

        try {
          await fetch("/api/admin/ai/generate-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generate-lesson",
              lessonId: les.lessonId,
              courseTitle: initData.courseTitle || outline.title,
              sectionTitle: les.sectionTitle,
              lessonTitle: les.lessonTitle,
              contentType: les.contentType,
              knowledgeDocIds: selectedDocIds,
            }),
          });
        } catch (lesErr) {
          console.warn(`Lesson generation error for "${les.lessonTitle}":`, lesErr);
        }
      }

      setProgressPercent(100);
      setProgressStatus("Hoàn tất toàn bộ khóa học!");
      toast.success(
        `Khởi tạo thành công ${initData.sectionsCreated} chương và ${total} bài học!`
      );
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khởi tạo bài học");
      setStep(2);
    } finally {
      setIsExecuting(false);
    }
  };

  // Syllabus Editing helpers
  const handleRemoveLesson = (secIdx: number, lesIdx: number) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[secIdx].lessons.splice(lesIdx, 1);
    setOutline({ ...outline, sections: newSections });
  };

  const handleAddLesson = (secIdx: number) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[secIdx].lessons.push({
      title: "Bài học mới",
      description: "Mô tả mục tiêu bài học",
      contentType: "ARTICLE",
    });
    setOutline({ ...outline, sections: newSections });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t.admin.ai.courseWizardTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                Bước {step}/3:{" "}
                {step === 1
                  ? "Nhập ý tưởng & tài liệu khóa học"
                  : step === 2
                  ? "Duyệt & chỉnh sửa đề cương giáo trình"
                  : "Khởi tạo nội dung chi tiết"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: INPUT IDEA & REFERENCE DOCS */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.admin.ai.courseTopicLabel} *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Phân tích Kỹ thuật & Quản trị Vốn Chuyên sâu"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.admin.ai.courseLevelLabel}
                  </label>
                  <select
                    value={level}
                    onChange={(e: any) => setLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="ALL_LEVELS">Tất cả trình độ</option>
                    <option value="BEGINNER">Người mới bắt đầu (Beginner)</option>
                    <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
                    <option value="ADVANCED">Nâng cao (Advanced)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.admin.ai.courseTargetAudienceLabel}
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Nhà đầu tư cá nhân, sinh viên..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reference Knowledge Docs Selector */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <BookOpen className="h-4 w-4 text-brand-400" />
                    <span>Tài liệu tham khảo RAG (Tùy chọn)</span>
                  </div>
                  <span className="text-[10px] text-brand-400 font-semibold">
                    Đã chọn {selectedDocIds.length}/{knowledgeDocs.length}
                  </span>
                </div>

                {loadingDocs ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Đang tải danh sách tài liệu...
                  </p>
                ) : knowledgeDocs.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Chưa có tài liệu tải lên cho khóa học này. AI sẽ nghiên cứu dựa trên tri thức mở.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {knowledgeDocs.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-500/50 bg-brand-500/10 text-white"
                              : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds((prev) => [...prev, doc.id]);
                                } else {
                                  setSelectedDocIds((prev) =>
                                    prev.filter((id) => id !== doc.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-700 text-brand-500 focus:ring-0"
                            />
                            <span className="font-medium truncate">{doc.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {doc.chunkCount} đoạn cắt
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
                  <GraduationCap className="h-4 w-4" />
                  Quy trình Tạo bằng AI (Agent Plan-and-Execute)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  AI sẽ nghiên cứu và lên đề cương khung chương trình (Sections & Lessons). Chú có thể xem trước, thay đổi tiêu đề hoặc thêm/bớt bài học trước khi hệ thống bắt đầu sinh nội dung chi tiết.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW SYLLABUS (HUMAN IN THE LOOP) */}
          {step === 2 && outline && (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-3.5">
                <h4 className="text-xs font-bold text-brand-400">{outline.title}</h4>
                <p className="text-[11px] text-slate-300 mt-1">{outline.description}</p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Khung Giáo trình Đề xuất ({outline.sections.length} Chương)</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Chú có thể chỉnh sửa trực tiếp bên dưới
                  </span>
                </div>

                {outline.sections.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const newSections = [...outline.sections];
                          newSections[sIdx].title = e.target.value;
                          setOutline({ ...outline, sections: newSections });
                        }}
                        className="flex-1 bg-transparent text-xs font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddLesson(sIdx)}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-semibold text-brand-400 hover:bg-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Thêm bài</span>
                      </button>
                    </div>

                    {/* Lessons list */}
                    <div className="space-y-1.5 pl-3 border-l-2 border-slate-800">
                      {sec.lessons.map((les, lIdx) => (
                        <div
                          key={lIdx}
                          className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/60 p-2 text-xs border border-slate-800/60"
                        >
                          <input
                            type="text"
                            value={les.title}
                            onChange={(e) => {
                              const newSections = [...outline.sections];
                              newSections[sIdx].lessons[lIdx].title = e.target.value;
                              setOutline({ ...outline, sections: newSections });
                            }}
                            className="flex-1 bg-transparent text-slate-200 border-none focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                              {les.contentType}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(sIdx, lIdx)}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PROGRESSIVE BATCHING EXECUTION */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
                <Loader2 className="h-10 w-10 animate-spin" />
                <span className="absolute text-[11px] font-bold text-white">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full max-w-md space-y-3">
                <h4 className="text-sm font-bold text-white">
                  Đang khởi tạo và sinh nội dung bài học...
                </h4>
                {/* Progress Bar Container */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[280px]">{progressStatus}</span>
                  <span className="font-semibold text-brand-400 shrink-0">
                    {completedCount}/{totalLessonsToGenerate} bài
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/40 px-6 py-3.5">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isExecuting}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </button>
          )}

          {step === 1 && (
            <div className="text-[11px] text-slate-400">
              Nhấn Tiếp tục để AI soạn đề cương
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {step === 1 && (
              <button
                type="button"
                disabled={isPlanning || !topic.trim()}
                onClick={handleGeneratePlan}
                className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all disabled:opacity-50"
              >
                {isPlanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>
                  {isPlanning ? t.admin.ai.generatingPlan : t.admin.ai.startGenerationBtn}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleExecuteCurriculum}
                className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t.admin.ai.applyCourseBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
