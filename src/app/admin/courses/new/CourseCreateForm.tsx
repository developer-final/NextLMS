"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Video,
  FileText,
  DollarSign,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

interface CourseCreateFormProps {
  categories: any[];
}

export default function CourseCreateForm({ categories }: CourseCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // General course info
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [level, setLevel] = useState("ALL_LEVELS");
  const [price, setPrice] = useState("1200000");
  const [salePrice, setSalePrice] = useState("790000");
  const [isFree, setIsFree] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80"
  );
  const [introVideoUrl, setIntroVideoUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  // Sections & Lessons structure
  const [sections, setSections] = useState<any[]>([
    {
      title: "Chương 1: Khởi động & Nền tảng",
      lessons: [
        {
          title: "Bài 1: Giới thiệu & Lộ trình học",
          videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
          videoDuration: 600,
          contentType: "VIDEO_YOUTUBE",
          isPreview: true,
          contentBody: "Tóm tắt bài học số 1 và các lưu ý.",
        },
      ],
    },
  ]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Chương ${sections.length + 1}: Nội dung nâng cao`,
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
      title: `Bài ${updated[sIdx].lessons.length + 1}: Thực hành chuyên sâu`,
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
      toast.error("Vui lòng nhập tên khóa học");
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
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi tạo khóa học");
        return;
      }

      toast.success("🎉 Tạo khóa học thành công!");
      router.push(`/courses/${data.course.slug}`);
      router.refresh();
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi tạo khóa học");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* 1. Basic Info */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> 1. Thông tin Chung Khóa học
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">
              Tiêu đề Khóa học *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Khóa học Phân tích Kỹ thuật Nâng cao SMC..."
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Danh mục Chủ đề</label>
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
            <label className="block text-slate-300 font-semibold mb-1">Trình độ</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL_LEVELS">Mọi trình độ (All Levels)</option>
              <option value="BEGINNER">Cơ bản (Beginner)</option>
              <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
              <option value="ADVANCED">Nâng cao (Advanced)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Giá niêm yết (VND)
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
              Giá khuyến mãi Sale (VND)
            </label>
            <input
              type="number"
              disabled={isFree}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
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
              <span>Khóa học Miễn phí (Free 100%)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-amber-400">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-950"
              />
              <span>Khóa học Nổi bật (Featured)</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Media & Descriptions */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
          <Video className="h-4 w-4" /> 2. Hình ảnh, Video & Soạn thảo Mô tả
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              URL Ảnh Thumbnail Khóa học
            </label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              URL Video Giới thiệu (YouTube Embed / Intro)
            </label>
            <input
              type="text"
              value={introVideoUrl}
              onChange={(e) => setIntroVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Mô tả ngắn</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Tóm tắt điểm cốt lõi của khóa học trong 1-2 câu..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Mô tả chi tiết bài giảng (Rich Text / Markdown)
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập nội dung chi tiết, mục tiêu khóa học, các giá trị học viên nhận được..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Curriculum Sections & Lessons */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
            <Layers className="h-4 w-4" /> 3. Đề cương Giáo trình (Chương & Bài học)
          </h3>
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-brand-400 border border-slate-700"
          >
            <Plus className="h-4 w-4" /> Thêm Chương mới
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
                  placeholder="Tên chương học..."
                />
                <button
                  type="button"
                  onClick={() => removeSection(sIdx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                  title="Xóa chương"
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
                        placeholder="Tên bài học..."
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
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={les.videoUrl || ""}
                          onChange={(e) =>
                            updateLessonField(sIdx, lIdx, "videoUrl", e.target.value)
                          }
                          placeholder="URL Video YouTube hoặc CDN..."
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
                          placeholder="Thời lượng (giây)"
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
                          <span>Xem thử</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addLesson(sIdx)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 pt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm bài học vào chương này
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
          {loading ? "Đang xuất bản khóa học..." : "Xuất bản Khóa học Ngay"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
