import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import CertificateViewClient from "./CertificateViewClient";

interface CertificatePageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({
  params,
}: CertificatePageProps): Promise<Metadata> {
  const { code } = await params;
  const cleanCode = code ? decodeURIComponent(code).trim().toUpperCase() : "";

  const cert = await prisma.certificate.findUnique({
    where: { certificateCode: cleanCode },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  const siteName = process.env.APP_NAME || "NextLMS";

  if (!cert) {
    return {
      title: `Certificate Not Found | ${siteName}`,
    };
  }

  return {
    title: `Certificate - ${cert.user.name} - ${cert.course.title} | ${siteName}`,
    description: `Official Certificate of Completion awarded to ${cert.user.name} for completing ${cert.course.title}.`,
  };
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { code } = await params;
  const cleanCode = code ? decodeURIComponent(code).trim().toUpperCase() : "";

  const [cert, settings] = await Promise.all([
    prisma.certificate.findUnique({
      where: { certificateCode: cleanCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          include: {
            instructor: {
              select: {
                name: true,
                headline: true,
              },
            },
          },
        },
      },
    }),
    getSystemSettings(),
  ]);

  if (!cert) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Không tìm thấy chứng chỉ</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mã chứng chỉ <strong className="text-amber-400 font-mono">{cleanCode || "N/A"}</strong> không tồn tại hoặc đã bị thu hồi khỏi hệ thống đào tạo.
          </p>
          <div className="pt-2">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Khám phá các khóa học khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const certificateData = {
    id: cert.id,
    certificateCode: cert.certificateCode,
    issuedAt: cert.issueDate.toISOString(),
    studentName: cert.user.name,
    studentEmail: cert.user.email,
    courseTitle: cert.course.title,
    courseSlug: cert.course.slug,
    instructorName: cert.course.instructor.name,
    instructorHeadline: cert.course.instructor.headline,
  };

  return (
    <CertificateViewClient
      certificate={certificateData}
      siteName={settings.appName || "NextLMS"}
    />
  );
}
