"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Video,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface FileUploadZoneProps {
  type: "thumbnail" | "attachment" | "video";
  courseId?: string;
  lessonId?: string;
  currentUrl?: string;
  onUploadSuccess: (result: {
    url: string;
    key: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    attachment?: any;
  }) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
  helperText?: string;
}

export default function FileUploadZone({
  type,
  courseId,
  lessonId,
  currentUrl,
  onUploadSuccess,
  onRemove,
  className = "",
  label,
  helperText,
}: FileUploadZoneProps) {
  const { t, language } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isThumbnail = type === "thumbnail";
  const isVideo = type === "video";
  const defaultLabel = isThumbnail
    ? (t.admin.createCourse.thumbnailLabel || "Course Cover Image")
    : isVideo
    ? (t.admin.courses.videoUploadSuccess ? "Upload Lesson Video (S3)" : "Upload Lesson Video")
    : (t.admin.createCourse.uploadAttachmentBtn || "Upload Resource File");

  const defaultHelper = isThumbnail
    ? t.profile.avatar.uploadHint
    : isVideo
    ? t.admin.courses.videoUploadHelp
    : t.admin.createCourse.courseAttachmentsDesc;

  const handleFile = async (file: File) => {
    if (!file) return;

    // Client-side quick checks
    if (isThumbnail) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        toast.error(t.common.unsupportedFileFormat);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t.common.fileTooLarge);
        return;
      }
    } else if (isVideo) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["mp4", "webm", "mov", "mkv"].includes(ext || "")) {
        toast.error(t.common.unsupportedFileFormat);
        return;
      }
      if (file.size > 1024 * 1024 * 1024) {
        toast.error(t.common.fileTooLarge);
        return;
      }
    } else {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(t.common.fileTooLarge);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (courseId) formData.append("courseId", courseId);
    if (lessonId) formData.append("lessonId", lessonId);

    try {
      setUploadProgress(50);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t.common.uploadFailed);
        return;
      }

      setUploadProgress(100);
      toast.success(t.common.uploadSuccess);

      onUploadSuccess({
        url: data.url,
        key: data.key,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        attachment: data.attachment,
      });
    } catch (err: any) {
      toast.error(t.common.connectionError);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label !== undefined && (
        <label className="block text-xs font-semibold text-slate-300">
          {label || defaultLabel}
        </label>
      )}

      {/* If thumbnail mode and current image exists, show preview */}
      {isThumbnail && currentUrl ? (
        <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
            {/* Native img tag with fallback for external or S3 URLs */}
            <img
              src={currentUrl}
              alt="Course Thumbnail"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> S3 / R2 Ready
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-slate-800/90 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors"
                >
                  {t.common.changeImage}
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="rounded-lg bg-rose-500/80 hover:bg-rose-600 p-1.5 text-white transition-colors"
                    title={t.common.removeImage}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
            isDragging
              ? "border-brand-500 bg-brand-500/10"
              : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40"
          } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={
              isThumbnail
                ? "image/jpeg,image/png,image/webp"
                : isVideo
                ? "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.sql,.zip,.rar,.7z,image/*"
            }
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
                <p className="text-xs font-semibold text-white">
                  {t.common.uploading}
                </p>
                <div className="w-48 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-full bg-slate-900 p-3 text-brand-400 border border-slate-800">
                  {isThumbnail ? (
                    <ImageIcon className="h-6 w-6" />
                  ) : isVideo ? (
                    <Video className="h-6 w-6" />
                  ) : (
                    <UploadCloud className="h-6 w-6" />
                  )}
                </div>
                <div className="text-xs">
                  <span className="font-bold text-brand-400 hover:underline">
                    {t.common.clickToUpload}
                  </span>{" "}
                  <span className="text-slate-400">
                    {t.common.orDragDrop}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {helperText || defaultHelper}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
