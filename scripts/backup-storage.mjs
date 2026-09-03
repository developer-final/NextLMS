import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Destination directory for downloaded files
const outputDir = path.resolve(process.cwd(), "Storage", "S3");

async function runBackup() {
  console.log("=================================================");
  console.log("📦 S3 / SUPABASE STORAGE BUCKET BACKUP TOOL");
  console.log("=================================================");

  if (!s3BucketName || !s3AccessKeyId || !s3SecretAccessKey) {
    console.error("❌ Error: Missing S3 credentials in environment variables.");
    console.error("Please verify S3_BUCKET_NAME, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.");
    process.exit(1);
  }

  console.log(`- Bucket:    ${s3BucketName}`);
  console.log(`- Endpoint:  ${s3Endpoint || "AWS S3 Default"}`);
  console.log(`- Region:    ${s3Region}`);
  console.log(`- PathStyle: ${s3ForcePathStyle}`);
  console.log(`- Output:    ${outputDir}`);
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
    // 1. Fetch list of all objects in bucket (supporting pagination)
    console.log("🔍 Scanning objects in bucket...");
    let continuationToken = undefined;
    const allObjects = [];

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: s3BucketName,
        ContinuationToken: continuationToken,
      });

      const res = await s3.send(listCommand);
      if (res.Contents && res.Contents.length > 0) {
        allObjects.push(...res.Contents);
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    if (allObjects.length === 0) {
      console.log("ℹ️  The bucket is currently empty. Nothing to download.");
      console.log("=================================================");
      return;
    }

    console.log(`✅ Found ${allObjects.length} object(s) in bucket.`);
    console.log("⬇️  Starting download...");

    await fs.mkdir(outputDir, { recursive: true });

    let downloadedCount = 0;
    let skippedCount = 0;
    let totalBytes = 0;

    for (const item of allObjects) {
      const key = item.Key;
      if (!key) continue;

      const cleanKey = key.replace(/^\/+/, "");
      const destPath = path.join(outputDir, cleanKey);
      const destDir = path.dirname(destPath);

      // Check if file already exists with identical size (incremental skip)
      if (fsSync.existsSync(destPath)) {
        const stats = fsSync.statSync(destPath);
        if (stats.size === item.Size) {
          skippedCount++;
          console.log(`  [SKIPPED] ${cleanKey} (already up-to-date)`);
          continue;
        }
      }

      await fs.mkdir(destDir, { recursive: true });

      const getCmd = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: cleanKey,
      });

      const response = await s3.send(getCmd);
      if (response.Body) {
        const byteArray = await response.Body.transformToByteArray();
        await fs.writeFile(destPath, byteArray);
        downloadedCount++;
        totalBytes += item.Size || 0;
        console.log(`  [SAVED]   ${cleanKey} (${((item.Size || 0) / 1024).toFixed(1)} KB)`);
      }
    }

    console.log("-------------------------------------------------");
    console.log(`🎉 Backup completed successfully!`);
    console.log(`- Newly downloaded: ${downloadedCount} file(s)`);
    console.log(`- Already existing: ${skippedCount} file(s)`);
    console.log(`- Total data size:  ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`- Saved location:   ${outputDir}`);
    console.log("=================================================");
  } catch (err) {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  }
}

runBackup();
