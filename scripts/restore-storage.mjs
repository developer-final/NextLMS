import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import dotenv from "dotenv";

// Automatically load local env if not already loaded
if (!process.env.S3_BUCKET_NAME) {
  if (fsSync.existsSync(".env.development.local")) {
    dotenv.config({ path: ".env.development.local" });
  } else if (fsSync.existsSync(".env.production.local")) {
    dotenv.config({ path: ".env.production.local" });
  } else {
    dotenv.config();
  }
}

// Read credentials from environment variables
const s3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT;
const s3Region = process.env.S3_REGION || process.env.AWS_S3_REGION || "auto";
const s3AccessKeyId =
  process.env.S3_ACCESS_KEY_ID || process.env.AWS_S3_ACCESS_KEY_ID || "";
const s3SecretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_S3_SECRET_ACCESS_KEY || "";
const s3BucketName =
  process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "";
const s3ForcePathStyle =
  process.env.S3_FORCE_PATH_STYLE === "true" ||
  Boolean(
    s3Endpoint &&
      (s3Endpoint.includes("supabase.co") ||
        s3Endpoint.includes("127.0.0.1") ||
        s3Endpoint.includes("localhost"))
  );

// Source directory containing local backup files
const sourceDir = path.resolve(process.cwd(), "Storage", "S3");

// MIME type detection helper
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".json": "application/json",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Recursively traverse source directory to find all files
async function getFilesRecursively(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursively(fullPath, baseDir)));
    } else if (entry.isFile()) {
      const relativeKey = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      files.push({ fullPath, relativeKey });
    }
  }

  return files;
}

async function runUpload() {
  console.log("=================================================");
  console.log("🚀 S3 / CLOUD STORAGE RESTORE & UPLOAD TOOL");
  console.log("=================================================");

  if (!s3BucketName || !s3AccessKeyId || !s3SecretAccessKey) {
    console.error("❌ Error: Missing destination S3 credentials in environment variables.");
    console.error("Please ensure S3_BUCKET_NAME, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are set.");
    process.exit(1);
  }

  if (!fsSync.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory does not exist: ${sourceDir}`);
    console.error("Please place backup files into Storage/S3 or run 'npm run storage:backup' first.");
    process.exit(1);
  }

  console.log(`- Source:    ${sourceDir}`);
  console.log(`- Target:    Bucket '${s3BucketName}'`);
  console.log(`- Endpoint:  ${s3Endpoint || "AWS S3 Default"}`);
  console.log(`- Region:    ${s3Region}`);
  console.log(`- PathStyle: ${s3ForcePathStyle}`);
  console.log("-------------------------------------------------");

  const clientConfig = {
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
  };

  if (s3ForcePathStyle) {
    clientConfig.forcePathStyle = true;
  }

  if (s3Endpoint && s3Endpoint.trim()) {
    clientConfig.endpoint = s3Endpoint.trim();
  }

  const s3 = new S3Client(clientConfig);

  try {
    console.log("🔍 Scanning local backup files in Storage/S3...");
    const localFiles = await getFilesRecursively(sourceDir);

    if (localFiles.length === 0) {
      console.log("ℹ️  No files found in Storage/S3 to upload.");
      console.log("=================================================");
      return;
    }

    console.log(`✅ Found ${localFiles.length} local file(s) to upload.`);
    console.log("⬆️  Starting upload to target bucket...");

    let uploadedCount = 0;
    let skippedCount = 0;
    let totalBytes = 0;

    for (const file of localFiles) {
      const stat = await fs.stat(file.fullPath);
      const contentType = getContentType(file.fullPath);

      // Check if file already exists in destination bucket with exact same size
      try {
        const headCmd = new HeadObjectCommand({
          Bucket: s3BucketName,
          Key: file.relativeKey,
        });
        const headRes = await s3.send(headCmd);
        if (headRes.ContentLength === stat.size) {
          skippedCount++;
          console.log(`  [SKIPPED] ${file.relativeKey} (already exists with matching size)`);
          continue;
        }
      } catch {
        // Object not found in bucket, proceed with upload
      }

      const fileBuffer = await fs.readFile(file.fullPath);
      const putCmd = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: file.relativeKey,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await s3.send(putCmd);
      uploadedCount++;
      totalBytes += stat.size;
      console.log(`  [UPLOADED] ${file.relativeKey} (${(stat.size / 1024).toFixed(1)} KB - ${contentType})`);
    }

    console.log("-------------------------------------------------");
    console.log("🎉 Restore & Upload completed successfully!");
    console.log(`- Newly uploaded:  ${uploadedCount} file(s)`);
    console.log(`- Already existed: ${skippedCount} file(s)`);
    console.log(`- Total data size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`- Target bucket:   ${s3BucketName}`);
    console.log("=================================================");
  } catch (err) {
    console.error("❌ Upload process failed:", err);
    process.exit(1);
  }
}

runUpload();
