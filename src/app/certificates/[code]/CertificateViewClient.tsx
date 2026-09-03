"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Award,
  CheckCircle2,
  Copy,
  Download,
  GraduationCap,
  Printer,
  Share2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CertificateViewClientProps {
  certificate: {
    id: string;
    certificateCode: string;
    issuedAt: string;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    courseSlug: string;
    instructorName: string;
    instructorHeadline?: string | null;
  };
  siteName: string;
}

export default function CertificateViewClient({
  certificate,
  siteName,
}: CertificateViewClientProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString(
    language === "vi" ? "vi-VN" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t.certificate.linkCopied);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://worldtradinglab.edu.vn/certificates/${certificate.certificateCode}`;

  // QR Code URL using free QR server API pointing to the exact certificate link
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=0f172a&color=f59e0b&margin=6`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* 1. Action Toolbar (Hidden during print) */}
      <div className="mx-auto max-w-5xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link
          href={`/courses/${certificate.courseSlug}`}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.certificate.backToCourse}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
            {t.certificate.copyLinkBtn}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 px-5 py-2.5 text-xs font-black text-slate-950 shadow-glow-gold transition-all hover:scale-105 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            {t.certificate.printPdfBtn}
          </button>
        </div>
      </div>

      {/* 2. Certificate Frame - Optimized for Web Display & A4 Landscape Printing */}
      <div className="mx-auto max-w-5xl">
        <div
          id="certificate-printable"
          className="relative overflow-hidden rounded-3xl border-4 border-double border-amber-500/70 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-14 shadow-2xl backdrop-blur-2xl print:border-4 print:border-amber-600 print:bg-white print:text-slate-950 print:shadow-none print:m-0 print:p-8 print:w-full print:rounded-none"
        >
          {/* Decorative Corner Accents */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

          {/* Ambient Background Watermark Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] print:opacity-[0.06] pointer-events-none">
            <GraduationCap className="h-[450px] w-[450px] text-amber-400" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            {/* Top Brand & Badge */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-glow-gold print:border print:border-amber-600">
                <GraduationCap className="h-8 w-8 text-slate-950" />
              </div>

              <span className="text-sm font-extrabold tracking-widest text-slate-300 uppercase print:text-slate-700">
                {siteName}
              </span>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-bold text-emerald-400 print:border-emerald-600 print:text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.certificate.verifiedBadge}
              </div>
            </div>

            {/* Certificate Header */}
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase font-serif print:text-slate-950">
                {t.certificate.officialCertificate}
              </h1>
              <div className="mx-auto w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2" />
              <p className="text-xs sm:text-sm text-slate-400 print:text-slate-600">
                {t.certificate.issuedTo}
              </p>
            </div>

            {/* Student Name */}
            <div className="py-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wide font-serif print:text-amber-800">
                {certificate.studentName || t.certificate.studentNameFallback}
              </h2>
            </div>

            {/* Completion Description */}
            <div className="max-w-2xl space-y-2">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed print:text-slate-700">
                {t.certificate.completedCourseText}:
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-brand-400 tracking-tight print:text-brand-700">
                {certificate.courseTitle}
              </h3>
            </div>

            {/* Divider */}
            <div className="w-full max-w-3xl border-t border-slate-800/80 my-4 print:border-slate-300" />

            {/* Signatures & Seal Section */}
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 items-end gap-8 pt-4">
              {/* Instructor Signature */}
              <div className="text-center space-y-2">
                <div className="h-12 flex items-center justify-center">
                  <span className="font-serif italic text-lg text-amber-300/80 print:text-slate-800">
                    {certificate.instructorName}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-1.5 print:border-slate-400">
                  <p className="text-xs font-bold text-white print:text-slate-900">
                    {certificate.instructorName}
                  </p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">
                    {t.certificate.instructorLabel}
                  </p>
                </div>
              </div>

              {/* Center Digital Seal */}
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-amber-500/80 bg-amber-500/10 p-2 shadow-glow-gold print:border-amber-600 print:bg-amber-50">
                  <Award className="h-10 w-10 text-amber-400 print:text-amber-600" />
                </div>
                <span className="text-[9px] uppercase tracking-widest font-black text-amber-400 print:text-amber-700">
                  OFFICIAL SEAL
                </span>
              </div>

              {/* Academy Director Signature */}
              <div className="text-center space-y-2">
                <div className="h-12 flex items-center justify-center">
                  <span className="font-serif italic text-lg text-amber-300/80 print:text-slate-800">
                    World Trading Lab
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-1.5 print:border-slate-400">
                  <p className="text-xs font-bold text-white print:text-slate-900">
                    {t.certificate.directorSignature}
                  </p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">
                    {t.certificate.authorizedSignatory}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Verification & QR Metadata */}
            <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6 mt-4 text-[11px] text-slate-400 print:border-slate-300 print:text-slate-600">
              <div className="flex items-center gap-3">
                <img
                  src={qrCodeUrl}
                  alt="Certificate Verification QR"
                  className="h-16 w-16 rounded-lg border border-slate-800 bg-slate-900 p-1 print:border-slate-400"
                />
                <div className="text-left space-y-0.5">
                  <p className="font-mono font-bold text-amber-400 print:text-amber-700">
                    {t.certificate.certCodeLabel}: {certificate.certificateCode}
                  </p>
                  <p>
                    {t.certificate.issuedOn}: {formattedDate}
                  </p>
                  <p className="text-[10px] text-slate-500 print:text-slate-500">
                    {t.certificate.scanToVerify}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-500">
                  worldtradinglab.edu.vn/certificates/{certificate.certificateCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header,
          footer,
          nav {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
