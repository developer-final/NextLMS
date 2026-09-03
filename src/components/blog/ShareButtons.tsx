"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t.blog.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
        {t.blog.shareTitle}
      </span>

      <div className="flex items-center gap-1.5">
        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chia sẻ lên Facebook"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-800 hover:border-slate-700 transition-colors"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        {/* X (Twitter) */}
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chia sẻ lên X (Twitter)"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-colors"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chia sẻ qua Telegram"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 hover:border-slate-700 transition-colors"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          title={t.blog.copyLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800 hover:border-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-brand-400">{t.common.copied}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>{t.blog.copyLink}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
