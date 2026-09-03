"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  Code,
  Eye,
  FileDown,
  FileText,
  Globe,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Paperclip,
  Quote,
  Save,
  Send,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { slugify } from "@/lib/utils";
import FileUploadZone from "@/components/ui/FileUploadZone";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";

interface CategoryOption {
  id: string;
  name: string;
}

interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
}

interface PostCreateFormProps {
  categories: CategoryOption[];
}

export default function PostCreateForm({ categories }: PostCreateFormProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  const [saving, setSaving] = useState(false);

  // Auto-generate slug from title if not manually edited
  useEffect(() => {
    if (!isSlugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, isSlugManual]);

  // Insert markdown helpers into textarea
  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("post-content-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || "văn bản"}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length
      );
    }, 50);
  };

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

  const handleUploadAttachmentSuccess = (res: any) => {
    if (res.attachment) {
      setAttachments([...attachments, res.attachment]);
    } else {
      // Fallback
      setAttachments([
        ...attachments,
        {
          id: res.key || `att-${Date.now()}`,
          fileName: res.fileName,
          fileSize: res.fileSize,
          fileType: res.fileType,
          fileUrl: res.url,
        },
      ]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      toast.error(t.admin.posts.titleLabel + " không được để trống");
      return;
    }

    if (!content.trim()) {
      toast.error(t.admin.posts.contentLabel + " không được để trống");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          summary,
          content,
          coverImageUrl: coverImageUrl || null,
          status: targetStatus,
          categoryId: categoryId || null,
          tagNames: tags,
          attachmentIds: attachments.map((a) => a.id),
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || summary,
          metaKeywords,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.admin.posts.saveFailed);
      }

      toast.success(t.admin.posts.createSuccess);
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t.admin.posts.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-brand-400" />
              {t.admin.posts.formTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{t.admin.posts.subtitle}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("DRAFT")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t.admin.posts.saveDraftBtn}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("PUBLISHED")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-black shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t.admin.posts.publishBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column (Title, Content, Editor) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.admin.posts.titleLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.admin.posts.titlePlaceholder}
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Slug URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-400">
                {t.admin.posts.slugLabel}
              </label>
              <button
                type="button"
                onClick={() => setIsSlugManual(!isSlugManual)}
                className="text-[11px] text-brand-400 hover:underline font-medium"
              >
                {isSlugManual ? "Tự động tạo theo tiêu đề" : "Chỉnh sửa URL tùy ý"}
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
              <span className="text-slate-500">/blog/</span>
              <input
                type="text"
                disabled={!isSlugManual}
                value={slug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder={t.admin.posts.slugPlaceholder}
                className="w-full bg-transparent text-slate-200 focus:outline-none disabled:text-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Excerpt / Summary */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t.admin.posts.summaryLabel}
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t.admin.posts.summaryPlaceholder}
              className="w-full p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Content Editor with Formatting Toolbar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.admin.posts.contentLabel} <span className="text-rose-400">*</span>
              </label>

              {/* Tabs: Editor vs Live Preview */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    activeTab === "edit"
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.admin.posts.editTab}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t.admin.posts.previewTab}
                </button>
              </div>
            </div>

            {activeTab === "edit" ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 text-slate-300 text-xs">
                  <button
                    type="button"
                    onClick={() => insertMarkdown("**", "**")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="In đậm (Bold)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("*", "*")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="In nghiêng (Italic)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-4 w-px bg-slate-800 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown("## ", "")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Tiêu đề H2"
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("### ", "")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Tiêu đề H3"
                  >
                    <Heading3 className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-4 w-px bg-slate-800 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown("- ", "")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Danh sách gạch đầu dòng"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("1. ", "")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Danh sách số thứ tự"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("> ", "")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Trích dẫn (Blockquote)"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("```javascript\n", "\n```")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Khối mã nguồn (Code Block)"
                  >
                    <Code className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("[Tiêu đề liên kết](", ")")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Chèn liên kết"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("![Mô tả ảnh](", ")")}
                    className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
                    title="Chèn hình ảnh Markdown"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  id="post-content-textarea"
                  rows={18}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.admin.posts.contentPlaceholder}
                  className="w-full p-4 bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y"
                />
              </div>
            ) : (
              <div className="min-h-[420px] p-6 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl overflow-y-auto max-h-[700px]">
                {content.trim() ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-center text-slate-500 italic py-12">
                    Chưa có nội dung để xem trước...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column (Cover, Category, Tags, Attachments, SEO) */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand-400" />
              {t.admin.posts.coverImageLabel}
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.admin.posts.coverImageHelp}
            </p>

            <FileUploadZone
              type="thumbnail"
              currentUrl={coverImageUrl}
              onUploadSuccess={(res) => setCoverImageUrl(res.url)}
              onRemove={() => setCoverImageUrl("")}
            />
          </div>

          {/* Category */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-white">
              {t.admin.posts.categoryLabel}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">{t.admin.posts.selectCategory}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags (Related Courses via Tags) */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-cyan-400" />
                {t.admin.posts.tagsLabel}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Gắn tags để tự động gợi ý các khóa học tương ứng ở cuối bài viết.
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
                placeholder={t.admin.posts.tagsPlaceholder}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                +
              </button>
            </div>

            {/* Tag Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Document Attachments */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-amber-400" />
              {t.admin.posts.attachmentsLabel}
            </h2>
            <p className="text-[11px] text-slate-400">
              {t.admin.posts.attachmentsHelp}
            </p>

            {/* Upload Zone for attachments */}
            <FileUploadZone
              type="attachment"
              label=""
              onUploadSuccess={handleUploadAttachmentSuccess}
            />

            {/* List of uploaded attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map((att, idx) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileDown className="h-4 w-4 text-brand-400 flex-shrink-0" />
                      <span className="truncate font-medium">{att.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO Meta Section & Google Preview */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-400" />
                {t.admin.posts.seoSectionTitle}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t.admin.posts.seoSectionDesc}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {t.admin.posts.metaTitleLabel}
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Tiêu đề chuẩn SEO (khoảng 60 ký tự)"}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {t.admin.posts.metaDescriptionLabel}
                </label>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={summary || "Mô tả SEO xuất hiện trên Google (khoảng 150-160 ký tự)..."}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {t.admin.posts.metaKeywordsLabel}
                </label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="price action, forex, crypto, kinh nghiem trading"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Google SERP Snippet Preview */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {t.admin.posts.googlePreview}
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 font-sans">
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <span>https://worldtradinglab.edu.vn/blog/{slug || "duong-dan"}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-blue-400 hover:underline line-clamp-1">
                    {metaTitle || title || "Tiêu đề bài viết hiển thị trên Google Search"} | World Trading Lab
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {metaDescription || summary || "Mô tả bài viết sẽ xuất hiện ở đây để thu hút người đọc bấm vào từ trang kết quả tìm kiếm..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
