"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  buildPageUrl?: (page: number) => string;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  buildPageUrl,
  onPageChange,
}: PaginationProps) {
  const { language } = useLanguage();

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const renderPageItem = (p: number | string, index: number) => {
    if (typeof p === "string") {
      return (
        <span
          key={`ellipsis-${index}`}
          className="px-3 py-2 text-xs font-semibold text-slate-500 select-none"
        >
          ...
        </span>
      );
    }

    const isActive = p === currentPage;

    const className = `inline-flex items-center justify-center min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? "bg-brand-500 text-slate-950 shadow-glow"
        : "bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
    }`;

    if (buildPageUrl) {
      return (
        <Link
          key={p}
          href={buildPageUrl(p)}
          className={className}
          aria-current={isActive ? "page" : undefined}
        >
          {p}
        </Link>
      );
    }

    return (
      <button
        key={p}
        type="button"
        onClick={() => onPageChange?.(p)}
        className={className}
        aria-current={isActive ? "page" : undefined}
      >
        {p}
      </button>
    );
  };

  const renderPrevBtn = () => {
    const disabled = currentPage <= 1;
    const prevPage = Math.max(1, currentPage - 1);
    const className = `inline-flex items-center gap-1 h-9 px-3.5 rounded-xl text-xs font-semibold transition-all ${
      disabled
        ? "opacity-40 cursor-not-allowed text-slate-600 bg-slate-950 border border-slate-900"
        : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
    }`;

    if (disabled || !buildPageUrl) {
      return (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onPageChange?.(prevPage)}
          className={className}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {language === "en" ? "Previous" : "Trước"}
          </span>
        </button>
      );
    }

    return (
      <Link
        href={buildPageUrl(prevPage)}
        className={className}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">
          {language === "en" ? "Previous" : "Trước"}
        </span>
      </Link>
    );
  };

  const renderNextBtn = () => {
    const disabled = currentPage >= totalPages;
    const nextPage = Math.min(totalPages, currentPage + 1);
    const className = `inline-flex items-center gap-1 h-9 px-3.5 rounded-xl text-xs font-semibold transition-all ${
      disabled
        ? "opacity-40 cursor-not-allowed text-slate-600 bg-slate-950 border border-slate-900"
        : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
    }`;

    if (disabled || !buildPageUrl) {
      return (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onPageChange?.(nextPage)}
          className={className}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">
            {language === "en" ? "Next" : "Sau"}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      );
    }

    return (
      <Link
        href={buildPageUrl(nextPage)}
        className={className}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">
          {language === "en" ? "Next" : "Sau"}
        </span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-slate-800/80">
      <div className="text-xs text-slate-400">
        {language === "en" ? (
          <>
            Showing <strong className="text-white">{startItem}</strong> to{" "}
            <strong className="text-white">{endItem}</strong> of{" "}
            <strong className="text-brand-400">{totalItems}</strong> results
          </>
        ) : (
          <>
            Hiển thị <strong className="text-white">{startItem}</strong> -{" "}
            <strong className="text-white">{endItem}</strong> trên tổng số{" "}
            <strong className="text-brand-400">{totalItems}</strong> kết quả
          </>
        )}
      </div>

      <nav
        role="navigation"
        aria-label="Pagination Navigation"
        className="flex items-center gap-1.5"
      >
        {renderPrevBtn()}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => renderPageItem(p, idx))}
        </div>
        {renderNextBtn()}
      </nav>
    </div>
  );
}
