import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

// S3 & Cloudflare R2 / Supabase Credentials & Configuration
const s3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT;
const s3Region = process.env.S3_REGION || process.env.AWS_S3_REGION || "auto";
const s3AccessKeyId =
  process.env.S3_ACCESS_KEY_ID || process.env.AWS_S3_ACCESS_KEY_ID || "";
const s3SecretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_S3_SECRET_ACCESS_KEY || "";
const s3BucketName =
  process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "";
const s3PublicUrl =
  process.env.S3_PUBLIC_URL || process.env.AWS_S3_PUBLIC_URL || "";
const s3ForcePathStyle =
  process.env.S3_FORCE_PATH_STYLE === "true" ||
  Boolean(
    s3Endpoint &&
      (s3Endpoint.includes("supabase.co") ||
        s3Endpoint.includes("127.0.0.1") ||
        s3Endpoint.includes("localhost"))
  );

/**
 * Checks if S3 / Cloudflare R2 / Supabase credentials are fully configured
 */
export function isS3Configured(): boolean {
  return Boolean(s3BucketName && s3AccessKeyId && s3SecretAccessKey);
}

/**
 * Get S3 Client instance (compatible with Supabase S3, Cloudflare R2 and AWS S3)
 */
export function getS3Client(): S3Client {
  const clientConfig: any = {
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
  };

  if (s3ForcePathStyle) {
    clientConfig.forcePathStyle = true;
  }

  // If custom endpoint is provided (e.g., Cloudflare R2, MinIO, Supabase)
  if (s3Endpoint && s3Endpoint.trim()) {
    clientConfig.endpoint = s3Endpoint.trim();
  }

  return new S3Client(clientConfig);
}

export interface UploadResult {
  key: string;
  url: string;
  storageProvider: "s3_r2" | "local_dev";
}

/**
 * Uploads a buffer directly to S3 / Cloudflare R2,
 * or safely falls back to local disk storage in development if S3 credentials are missing.
 */
export async function uploadFileToStorage({
  buffer,
  key,
  contentType,
  isPublic = false,
}: {
  buffer: Buffer;
  key: string;
  contentType: string;
  isPublic?: boolean;
}): Promise<UploadResult> {
  const cleanKey = key.replace(/^\/+/, "");

  if (isS3Configured()) {
    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    let finalUrl = "";
    if (s3PublicUrl && s3PublicUrl.trim()) {
      finalUrl = `${s3PublicUrl.replace(/\/+$/, "")}/${cleanKey}`;
    } else if (s3Endpoint && s3Endpoint.includes("r2.cloudflarestorage.com")) {
      finalUrl = `${s3Endpoint.replace(/\/+$/, "")}/${s3BucketName}/${cleanKey}`;
    } else if (s3Endpoint && s3Endpoint.includes("supabase.co")) {
      const match = s3Endpoint.match(/^https?:\/\/([^.]+)\./);
      const projRef = match ? match[1] : "";
      finalUrl = `https://${projRef}.supabase.co/storage/v1/object/public/${s3BucketName}/${cleanKey}`;
    } else {
      finalUrl = `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${cleanKey}`;
    }

    return {
      key: cleanKey,
      url: finalUrl,
      storageProvider: "s3_r2",
    };
  }

  // Development Fallback: Store locally in public/uploads if S3 is not configured yet
  const localUploadDir = path.join(process.cwd(), "public", "uploads");
  const localFilePath = path.join(localUploadDir, cleanKey);
  const localFileDir = path.dirname(localFilePath);

  await fs.mkdir(localFileDir, { recursive: true });
  await fs.writeFile(localFilePath, buffer);

  const localUrl = `/uploads/${cleanKey.replace(/\\/g, "/")}`;

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[STORAGE SIMULATION] S3 credentials not set. Saved to local: ${localUrl}`
    );
  }

  return {
    key: cleanKey,
    url: localUrl,
    storageProvider: "local_dev",
  };
}

/**
 * Deletes a file from S3 / Cloudflare R2 or local dev storage.
 */
export async function deleteFileFromStorage(key: string): Promise<boolean> {
  const cleanKey = key.replace(/^\/+/, "");

  if (isS3Configured()) {
    try {
      const s3 = getS3Client();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: cleanKey,
        })
      );
      return true;
    } catch (err) {
      console.error("Error deleting object from S3:", err);
      return false;
    }
  }

  // Fallback: delete local file
  try {
    const localFilePath = path.join(process.cwd(), "public", "uploads", cleanKey);
    await fs.unlink(localFilePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a presigned download URL with expiry time,
 * or returns local URL if in local development mode.
 */
export async function getSecureDownloadUrl({
  key,
  fileName,
  expiresInSeconds = 3600,
}: {
  key: string;
  fileName?: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const cleanKey = key.replace(/^\/+/, "");

  if (isS3Configured()) {
    const s3 = getS3Client();
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: cleanKey,
      ResponseContentDisposition: fileName
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : undefined,
    });

    return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  }

  // Local dev mode fallback
  return `/uploads/${cleanKey.replace(/\\/g, "/")}`;
}

/**
 * Detects whether a string or URL is an S3 / Cloudflare R2 resource,
 * and extracts the corresponding S3 object key.
 */
export function extractS3Key(urlOrKey: string): string | null {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;
  const trimmed = urlOrKey.trim();

  // If it's a relative path starting with /uploads/
  if (trimmed.startsWith("/uploads/")) {
    return trimmed.replace(/^\/uploads\//, "");
  }

  // If it is already a key
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    (trimmed.startsWith("courses/") ||
      trimmed.startsWith("attachments/") ||
      trimmed.startsWith("thumbnails/"))
  ) {
    return trimmed;
  }

  // If it's an external YouTube or Vimeo link, it is not S3
  if (
    trimmed.includes("youtube.com") ||
    trimmed.includes("youtu.be") ||
    trimmed.includes("vimeo.com")
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/^\/+/, "");

    // S3 Public URL matches custom domain, pub-xxx.r2.dev, or Supabase public storage URL
    const cleanPublicUrl = s3PublicUrl ? s3PublicUrl.replace(/\/+$/, "") : "";
    if (cleanPublicUrl && trimmed.startsWith(cleanPublicUrl)) {
      const relativePart = trimmed.slice(cleanPublicUrl.length).replace(/^\/+/, "");
      return relativePart.split("?")[0].split("#")[0];
    }

    // R2 storage URL with bucket name in path: <endpoint>/<bucket>/<key>
    if (s3BucketName && pathname.startsWith(`${s3BucketName}/`)) {
      return pathname.slice(s3BucketName.length + 1);
    }

    // AWS S3, Cloudflare R2, or Supabase storage domains
    if (
      parsed.hostname.includes(".amazonaws.com") ||
      parsed.hostname.includes(".r2.cloudflarestorage.com") ||
      parsed.hostname.includes(".r2.dev") ||
      parsed.hostname.includes(".supabase.co")
    ) {
      if (parsed.hostname.includes(".supabase.co")) {
        const parts = pathname.split("/");
        const pubIdx = parts.indexOf("public");
        if (pubIdx !== -1 && (!s3BucketName || parts[pubIdx + 1] === s3BucketName)) {
          return parts.slice(pubIdx + 2).join("/");
        }
        const s3Idx = parts.indexOf("s3");
        if (s3Idx !== -1 && (!s3BucketName || parts[s3Idx + 1] === s3BucketName)) {
          return parts.slice(s3Idx + 2).join("/");
        }
      }
      return pathname;
    }

    // Typical S3 directory structure
    if (
      pathname.startsWith("courses/") ||
      pathname.startsWith("attachments/") ||
      pathname.startsWith("thumbnails/")
    ) {
      return pathname;
    }

    return null;
  } catch {
    return null;
  }
}

const defaultVideoExpiry = parseInt(
  process.env.VIDEO_PRESIGNED_EXPIRES_SECONDS || "7200",
  10
);

/**
 * Generates a presigned streaming URL for video files stored on S3 / Cloudflare R2
 * with a secure expiration time (default 2 hours = 7200s).
 * If the input is not an S3 video (e.g. YouTube URL), it returns the original URL unchanged.
 */
export async function getSecureStreamUrl(
  urlOrKey: string,
  expiresInSeconds = defaultVideoExpiry
): Promise<string> {
  if (!urlOrKey || typeof urlOrKey !== "string") return urlOrKey;

  const key = extractS3Key(urlOrKey);
  if (!key) {
    // Not an S3/R2 resource, return unchanged (e.g. YouTube URL)
    return urlOrKey;
  }

  const cleanKey = key.replace(/^\/+/, "");

  if (isS3Configured()) {
    try {
      const s3 = getS3Client();
      const command = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: cleanKey,
        ResponseContentType: "video/mp4",
      });

      return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.error("Error generating presigned video stream URL:", err);
      return urlOrKey;
    }
  }

  // Local development fallback
  return `/uploads/${cleanKey.replace(/\\/g, "/")}`;
}
