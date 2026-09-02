import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  if (amount === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export function generateOrderCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `EL-${timestamp}-${random}`;
}

export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Handle youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1`
    : url;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface PaginationResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  skip: number;
  take: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export function calculatePagination(
  totalItems: number,
  page = 1,
  pageSize = 6
): PaginationResult {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const skip = (currentPage - 1) * safePageSize;

  return {
    currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    skip,
    take: safePageSize,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

