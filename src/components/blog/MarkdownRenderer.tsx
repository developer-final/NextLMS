"use client";

import { useMemo } from "react";
import { slugify } from "@/lib/utils";
import { isValidSafeUrl } from "@/lib/validation";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    const lines = content.split("\n");
    const output: string[] = [];
    let inCodeBlock = false;
    let codeBlockLang = "";
    let codeBlockContent: string[] = [];
    let inList = false;
    let listType: "ul" | "ol" = "ul";

    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const formatInline = (text: string) => {
      // Escape HTML first
      let res = escapeHtml(text);

      // Inline code: `code`
      res = res.replace(
        /`([^`]+)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-brand-300 font-mono text-xs border border-slate-700/60">$1</code>'
      );

      // Bold: **text**
      res = res.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong class="font-bold text-white">$1</strong>'
      );

      // Italic: *text*
      res = res.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-300">$1</em>');

      // Images: ![alt](url)
      res = res.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        (_match, alt, url) => {
          const cleanUrl = url.trim();
          if (!isValidSafeUrl(cleanUrl)) return "";
          return `<figure class="my-6"><img src="${cleanUrl}" alt="${alt}" class="w-full max-h-[500px] object-cover rounded-2xl border border-slate-800 shadow-2xl" /><figcaption class="text-center text-xs text-slate-400 mt-2 italic">${alt}</figcaption></figure>`;
        }
      );

      // Links: [text](url)
      res = res.replace(
        /\[(.*?)\]\((.*?)\)/g,
        (_match, text, url) => {
          const cleanUrl = url.trim();
          const safeHref = isValidSafeUrl(cleanUrl) ? cleanUrl : "#";
          return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 underline underline-offset-4 decoration-brand-500/40 hover:decoration-brand-400 font-medium transition-colors">${text}</a>`;
        }
      );

      return res;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Fenced Code Block start/end
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          // Close code block
          const codeString = codeBlockContent.map(escapeHtml).join("\n");
          output.push(
            `<div class="my-6 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              ${codeBlockLang ? `<div class="px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between"><span>${escapeHtml(codeBlockLang)}</span></div>` : ""}
              <pre class="p-4 overflow-x-auto text-xs font-mono text-brand-300 leading-relaxed"><code>${codeString}</code></pre>
            </div>`
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLang = "";
        } else {
          // Open code block
          inCodeBlock = true;
          codeBlockLang = trimmed.replace("```", "").trim();
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Close list if current line is not list item
      if (inList && !trimmed.startsWith("- ") && !trimmed.startsWith("* ") && !/^\d+\.\s/.test(trimmed)) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        const titleText = trimmed.replace("### ", "");
        const id = slugify(titleText);
        output.push(
          `<h3 id="${id}" class="text-lg md:text-xl font-bold text-white mt-8 mb-3 scroll-mt-24 flex items-center gap-2 group">
            <span>${formatInline(titleText)}</span>
            <a href="#${id}" class="opacity-0 group-hover:opacity-60 text-brand-400 text-sm">#</a>
          </h3>`
        );
        continue;
      }

      if (trimmed.startsWith("## ")) {
        const titleText = trimmed.replace("## ", "");
        const id = slugify(titleText);
        output.push(
          `<h2 id="${id}" class="text-xl md:text-2xl font-black text-white mt-10 mb-4 pb-2 border-b border-slate-800/80 scroll-mt-24 flex items-center gap-2 group">
            <span>${formatInline(titleText)}</span>
            <a href="#${id}" class="opacity-0 group-hover:opacity-60 text-brand-400 text-base">#</a>
          </h2>`
        );
        continue;
      }

      if (trimmed.startsWith("# ")) {
        const titleText = trimmed.replace("# ", "");
        const id = slugify(titleText);
        output.push(
          `<h1 id="${id}" class="text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 scroll-mt-24">${formatInline(titleText)}</h1>`
        );
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        const quoteText = trimmed.replace("> ", "");
        output.push(
          `<blockquote class="my-6 border-l-4 border-brand-500 bg-brand-500/5 px-4 py-3 rounded-r-xl text-slate-300 italic text-sm md:text-base">${formatInline(quoteText)}</blockquote>`
        );
        continue;
      }

      // Unordered List (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          inList = true;
          listType = "ul";
          output.push('<ul class="my-4 space-y-2 list-disc list-inside text-slate-300 text-sm md:text-base">');
        }
        const itemText = trimmed.substring(2);
        output.push(`<li class="leading-relaxed pl-1">${formatInline(itemText)}</li>`);
        continue;
      }

      // Ordered List (1. 2. etc)
      if (/^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          inList = true;
          listType = "ol";
          output.push('<ol class="my-4 space-y-2 list-decimal list-inside text-slate-300 text-sm md:text-base">');
        }
        const itemText = trimmed.replace(/^\d+\.\s/, "");
        output.push(`<li class="leading-relaxed pl-1">${formatInline(itemText)}</li>`);
        continue;
      }

      // Horizontal rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        output.push('<hr class="my-8 border-slate-800" />');
        continue;
      }

      // Empty line
      if (!trimmed) {
        continue;
      }

      // Standard Paragraph
      output.push(
        `<p class="my-4 text-slate-300 text-sm md:text-base leading-relaxed tracking-normal">${formatInline(line)}</p>`
      );
    }

    if (inList) {
      output.push(listType === "ul" ? "</ul>" : "</ol>");
    }

    if (inCodeBlock) {
      output.push("</code></pre></div>");
    }

    return output.join("\n");
  }, [content]);

  return (
    <div
      className={`prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
