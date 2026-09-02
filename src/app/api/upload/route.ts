import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to upload files" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided for upload" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Please upload PNG, JPG, or WEBP images.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed limit of 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Try saving locally to public/uploads/receipts if directory is writable
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
      await fs.mkdir(uploadDir, { recursive: true });

      const fileExt = file.name.split(".").pop() || "jpg";
      const cleanFileName = `receipt-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}.${fileExt}`;
      const filePath = path.join(uploadDir, cleanFileName);

      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/receipts/${cleanFileName}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName: cleanFileName,
      });
    } catch (fsError) {
      // In serverless / read-only filesystem environments, fallback to Base64 Data URL
      console.warn(
        "[Upload API] Local disk write failed, fallback to base64 Data URL:",
        fsError
      );
      const base64Data = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64Data}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
      });
    }
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading file. Please try again." },
      { status: 500 }
    );
  }
}
