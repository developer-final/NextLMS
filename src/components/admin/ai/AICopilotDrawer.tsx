"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  FileText,
  Upload,
  BookOpen,
  HelpCircle,
  Wand2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface KnowledgeDocItem {
  id: string;
  title: string;
  fileName: string;
  chunkCount: number;
  status: string;
}

export interface ExtractedArticleData {
  title?: string;
  summary?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  content: string;
}

interface AICopilotDrawerProps {
  courseId?: string;
  onInsertText?: (text: string) => void;
  onReplaceText?: (text: string) => void;
  onApplySEO?: (seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    summary: string;
    readingTime: number;
  }) => void;
  onApplyTitle?: (title: string) => void;
  onApplyFullArticle?: (data: ExtractedArticleData) => void;
  currentSelectedText?: string;
  defaultTopic?: string;
  mode?: "course" | "post";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Intelligent extractor of structured fields (Title, Summary, SEO, Content) from AI text
 */
function extractPostData(rawText: string): ExtractedArticleData {
  let title: string | undefined;
  let summary: string | undefined;
  let metaKeywords: string | undefined;
  let tags: string[] = [];
  let content = rawText;

  // Extract Title
  const titleMatch =
    rawText.match(/(?:Tiêu đề(?:\s+gợi\s+ý|\s+đề\s+xuất)?|Title):\s*["“']?([^"\n\r”']+)["”']?/i) ||
    rawText.match(/^#\s+([^\n\r]+)/m);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].replace(/^[#*\s"']+|[#*\s"']+$/g, "").trim();
  }

  // Extract Summary / Excerpt
  const summaryMatch =
    rawText.match(/(?:Tóm tắt(?:\s+ngắn|\s+bài\s+viết)?|Summary|Mô tả):\s*["“']?([^"\n\r”']+)["”']?/i) ||
    rawText.match(/^>\s*\*\*Tóm tắt(?:\s+bài\s+viết)?\*\*:\s*([^\n\r]+)/m);
  if (summaryMatch && summaryMatch[1]) {
    summary = summaryMatch[1].replace(/^[>*\s"']+|[>*\s"']+$/g, "").trim();
  }

  // Extract Keywords / Tags
  const keywordsMatch = rawText.match(
    /(?:Từ khóa(?:\s+SEO)?|Thẻ(?:\s+tags)?|Keywords|Tags):\s*([^\n\r]+)/i
  );
  if (keywordsMatch && keywordsMatch[1]) {
    metaKeywords = keywordsMatch[1].replace(/^[#*\s"']+|[#*\s"']+$/g, "").trim();
    tags = metaKeywords
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // Extract clean content: if markdown starts with `# ` or `## `, use that portion
  const firstHeadingIdx = rawText.search(/(?:^|\n)#[#]?\s+/);
  if (firstHeadingIdx !== -1) {
    let cleanBody = rawText.slice(firstHeadingIdx).trim();
    // Remove conversational closing note if present after the final separator
    const lastDividerIdx = cleanBody.lastIndexOf("\n---\n");
    if (lastDividerIdx > 150) {
      const closingSnippet = cleanBody.slice(lastDividerIdx);
      if (/chú|bạn|bấm|áp dụng|đồng ý|hoàn thiện|hãy cho cháu biết/i.test(closingSnippet)) {
        cleanBody = cleanBody.slice(0, lastDividerIdx).trim();
      }
    }
    content = cleanBody;
  }

  return {
    title,
    summary,
    metaTitle: title,
    metaDescription: summary,
    metaKeywords,
    tags: tags.length > 0 ? tags : undefined,
    content,
  };
}

export default function AICopilotDrawer({
  courseId,
  onInsertText,
  onReplaceText,
  onApplySEO,
  onApplyTitle,
  onApplyFullArticle,
  currentSelectedText,
  defaultTopic,
  mode = "course",
}: AICopilotDrawerProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "rag" | "tools">("chat");

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        mode === "post"
          ? "Xin chào! Cháu là Trợ lý AI sáng tạo nội dung. Chú có thể nhờ cháu viết bài hoàn chỉnh, gợi ý tiêu đề, sửa văn phong hoặc tối ưu SEO cho bài viết này nhé!"
          : "Xin chào! Cháu là Trợ lý AI hỗ trợ giáo trình. Chú có thể yêu cầu cháu soạn bài giảng chi tiết, tạo kịch bản video hoặc trích xuất câu hỏi trắc nghiệm ôn tập.",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // RAG Knowledge State
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Blog / Quick Tools State
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, activeTab]);

  const fetchKnowledgeDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const url = courseId
        ? `/api/admin/ai/knowledge/upload?courseId=${courseId}`
        : `/api/admin/ai/knowledge/upload`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.documents) {
        setKnowledgeDocs(data.documents);
        // Default select all ready docs
        setSelectedDocIds(
          data.documents
            .filter((d: KnowledgeDocItem) => d.status === "READY")
            .map((d: KnowledgeDocItem) => d.id)
        );
      }
    } catch {
      // Silent error
    } finally {
      setLoadingDocs(false);
    }
  }, [courseId]);

  // Load knowledge docs when opening RAG tab or drawer
  useEffect(() => {
    if (isOpen) {
      fetchKnowledgeDocs();
    }
  }, [isOpen, fetchKnowledgeDocs]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (courseId) formData.append("courseId", courseId);

      const res = await fetch("/api/admin/ai/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Đã tải lên và phân đoạn thành công: ${data.document.title}`);
        fetchKnowledgeDocs();
      } else {
        toast.error(data.error || "Tải lên tài liệu thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối khi tải lên tài liệu");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: promptToSend,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt("");
    setIsStreaming(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          documentIds: selectedDocIds,
          courseId,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") break;

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                accumulated += data.chunk;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulated } : m
                  )
                );
              } else if (data.error) {
                toast.error(data.error);
              }
            } catch {
              // chunk json parse pass
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi tạo phản hồi AI");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t.admin.ai.copiedToClipboard);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateBlogArticle = async () => {
    const topic = defaultTopic || "Chiến lược đầu tư thông minh";
    setIsGeneratingBlog(true);
    try {
      const res = await fetch("/api/admin/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone: "Professional",
          knowledgeDocIds: selectedDocIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onInsertText) {
          onInsertText(data.content);
        }
        if (onApplySEO && data.seo) {
          onApplySEO(data.seo);
        }
        toast.success("Đã sinh bài viết và cấu hình SEO hoàn tất!");
        setIsOpen(false);
      } else {
        toast.error(data.error || "Lỗi tạo bài viết");
      }
    } catch {
      toast.error("Lỗi kết nối khi tạo bài viết");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 via-emerald-400 to-teal-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-glow transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span>AI Copilot</span>
        {selectedDocIds.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/80 text-[10px] text-brand-300">
            {selectedDocIds.length}
          </span>
        )}
      </button>

      {/* Slide-over Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity">
          <div className="flex h-full w-full max-w-lg flex-col bg-slate-950 border-l border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {t.admin.ai.copilotTitle}
                    <span className="rounded-full bg-brand-500/10 px-2 py-0.2 text-[10px] text-brand-400 font-semibold border border-brand-500/20">
                      v2.0
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t.admin.ai.copilotSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/40 px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`pb-2.5 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === "chat"
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Trò chuyện & Hỗ trợ
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("rag")}
                className={`pb-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === "rag"
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Tài liệu RAG ({knowledgeDocs.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tools")}
                className={`pb-2.5 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === "tools"
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Công cụ nhanh
              </button>
            </div>

            {/* TAB 1: CHAT */}
            {activeTab === "chat" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          m.role === "user"
                            ? "bg-brand-500 text-slate-950 font-medium"
                            : "bg-slate-900 text-slate-200 border border-slate-800/80 shadow-md"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>

                      {/* Action buttons for assistant messages */}
                      {m.role === "assistant" && m.content && (
                        <div className="mt-2 w-full space-y-1.5">
                          {/* Post Mode: One-Click Apply to Form */}
                          {mode === "post" && m.id !== "welcome" && (() => {
                            const postData = extractPostData(m.content);
                            return (
                              <div className="rounded-xl bg-brand-500/10 border border-brand-500/25 p-2.5 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-brand-400">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Điền tự động vào bài viết
                                  </span>
                                  {postData.title && (
                                    <span className="text-[10px] text-slate-400 font-normal truncate max-w-[170px]">
                                      &quot;{postData.title}&quot;
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {onApplyFullArticle && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onApplyFullArticle(postData);
                                        toast.success("Đã tự động áp dụng toàn bộ vào bài viết!");
                                      }}
                                      className="rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Đồng ý áp dụng vào bài viết</span>
                                    </button>
                                  )}

                                  {onApplyTitle && postData.title && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onApplyTitle(postData.title!);
                                        toast.success("Đã đặt tiêu đề bài viết!");
                                      }}
                                      className="rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold flex items-center gap-1"
                                    >
                                      <span>Đặt Tiêu đề</span>
                                    </button>
                                  )}

                                  {onApplySEO && (postData.summary || postData.metaKeywords) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onApplySEO({
                                          metaTitle: postData.metaTitle || postData.title || "",
                                          metaDescription: postData.metaDescription || postData.summary || "",
                                          metaKeywords: postData.metaKeywords || "",
                                          summary: postData.summary || "",
                                          readingTime: 5,
                                        });
                                        toast.success("Đã điền thông số SEO & Tóm tắt!");
                                      }}
                                      className="rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold flex items-center gap-1"
                                    >
                                      <span>Điền SEO</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Common editor actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(m.content, m.id)}
                              className="rounded-lg px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-900 hover:text-white flex items-center gap-1"
                            >
                              {copiedId === m.id ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>{copiedId === m.id ? "Đã chép" : "Chép"}</span>
                            </button>

                            {onInsertText && (
                              <button
                                type="button"
                                onClick={() => {
                                  onInsertText(m.content);
                                  toast.success("Đã chèn nội dung vào Editor!");
                                }}
                                className="rounded-lg px-2 py-1 text-[11px] text-brand-400 hover:bg-brand-500/10 flex items-center gap-1 font-semibold"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Chèn vào nội dung</span>
                              </button>
                            )}

                            {onReplaceText && currentSelectedText && (
                              <button
                                type="button"
                                onClick={() => {
                                  onReplaceText(m.content);
                                  toast.success("Đã thay thế đoạn chọn!");
                                }}
                                className="rounded-lg px-2 py-1 text-[11px] text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 font-semibold"
                              >
                                <span>Thay thế đoạn chọn</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isStreaming && (
                    <div className="flex items-center gap-2 text-xs text-brand-400 italic">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{t.admin.ai.thinking}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="border-t border-slate-800/80 bg-slate-900/30 p-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          currentSelectedText
                            ? `Sửa chính tả, ngữ pháp và tinh chỉnh văn phong cho đoạn này: "${currentSelectedText}"`
                            : "Hãy góp ý cách viết mở bài hấp dẫn và cuốn hút hơn cho chủ đề này."
                        )
                      }
                      className="whitespace-nowrap rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 hover:border-brand-500 hover:text-brand-400"
                    >
                      ✨ {t.admin.ai.promptFixSpelling}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          "Mở rộng bài học này với các ví dụ thực tế và bước thực hành chi tiết."
                        )
                      }
                      className="whitespace-nowrap rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 hover:border-brand-500 hover:text-brand-400"
                    >
                      📖 {t.admin.ai.promptExpandLesson}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          "Tạo 5 câu hỏi trắc nghiệm kèm đáp án và giải thích chi tiết cho nội dung này."
                        )
                      }
                      className="whitespace-nowrap rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 hover:border-brand-500 hover:text-brand-400"
                    >
                      📝 {t.admin.ai.promptMakeQuiz}
                    </button>
                  </div>

                  {/* Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="mt-2 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      placeholder={t.admin.ai.chatPlaceholder}
                      disabled={isStreaming}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={!inputPrompt.trim() || isStreaming}
                      className="rounded-xl bg-brand-500 p-2.5 text-slate-950 hover:bg-brand-400 disabled:opacity-40 transition-all"
                    >
                      {isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: RAG KNOWLEDGE BASE */}
            {activeTab === "rag" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Tài liệu Ngữ cảnh (pgvector RAG)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Tích chọn tài liệu để AI trích xuất kiến thức khi trả lời
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDocUpload}
                    accept=".txt,.md,.json,.pdf,.doc,.docx"
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploadingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 px-3 py-1.5 text-xs font-bold text-brand-400 hover:bg-brand-500/20 disabled:opacity-50"
                  >
                    {uploadingDoc ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>Tải lên</span>
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="flex items-center justify-center py-10 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải danh sách tài liệu...
                  </div>
                ) : knowledgeDocs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-2">
                    <Paperclip className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="text-xs text-slate-400">{t.admin.ai.noDocsYet}</p>
                    <p className="text-[11px] text-slate-500">
                      Hỗ trợ file .txt, .md, .pdf để AI học theo giáo trình riêng.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {knowledgeDocs.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== doc.id)
                                : [...prev, doc.id]
                            );
                          }}
                          className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-500/50 bg-brand-500/5"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-700 text-brand-500 focus:ring-0"
                            />
                            <div>
                              <div className="text-xs font-semibold text-white">
                                {doc.title}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {doc.fileName} · {doc.chunkCount} đoạn cắt (chunks)
                              </div>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              doc.status === "READY"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUICK TOOLS */}
            {activeTab === "tools" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-brand-400" />
                    <h4 className="text-xs font-bold text-white">
                      Sinh Trọn vẹn Bài viết & Thẻ SEO
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tự động tạo nội dung bài blog hoàn chỉnh theo tiêu đề và tự động điền Meta Title, Meta Description, Thẻ Keywords.
                  </p>
                  <button
                    type="button"
                    disabled={isGeneratingBlog}
                    onClick={handleGenerateBlogArticle}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                  >
                    {isGeneratingBlog ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>{t.admin.ai.generateBlogBtn}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
