import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fsSync from "fs";

// Automatically load local env if not already loaded by dotenv-cli
if (!process.env.DATABASE_URL) {
  if (fsSync.existsSync(".env.development.local")) {
    dotenv.config({ path: ".env.development.local" });
  } else if (fsSync.existsSync(".env.production.local")) {
    dotenv.config({ path: ".env.production.local" });
  } else {
    dotenv.config();
  }
}

const prisma = new PrismaClient();

// Parse command line arguments: e.g. --from="..." --to="..." --confirm --dry-run
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    from: "",
    to: process.env.S3_PUBLIC_URL || "",
    confirm: false,
    dryRun: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--from=")) {
      options.from = arg.slice("--from=".length).trim();
    } else if (arg.startsWith("--to=")) {
      options.to = arg.slice("--to=".length).trim();
    } else if (arg === "--confirm") {
      options.confirm = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

// Extract hostname or origin from URL safely
function getOrigin(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.origin;
  } catch {
    return null;
  }
}

async function scanExistingDomains() {
  console.log("🔍 Scanning database for existing storage URL domains...");
  const origins = new Set();

  const users = await prisma.user.findMany({ select: { avatarUrl: true }, where: { avatarUrl: { not: null } } });
  const courses = await prisma.course.findMany({ select: { thumbnailUrl: true, introVideoUrl: true } });
  const lessons = await prisma.lesson.findMany({ select: { videoUrl: true }, where: { videoUrl: { not: null } } });
  const attachments = await prisma.attachment.findMany({ select: { fileUrl: true } });
  const posts = await prisma.blogPost.findMany({ select: { coverImageUrl: true }, where: { coverImageUrl: { not: null } } });
  const orders = await prisma.order.findMany({ select: { proofImageUrl: true }, where: { proofImageUrl: { not: null } } });

  const allUrls = [
    ...users.map((u) => u.avatarUrl),
    ...courses.map((c) => c.thumbnailUrl),
    ...courses.map((c) => c.introVideoUrl),
    ...lessons.map((l) => l.videoUrl),
    ...attachments.map((a) => a.fileUrl),
    ...posts.map((p) => p.coverImageUrl),
    ...orders.map((o) => o.proofImageUrl),
  ].filter(Boolean);

  for (const url of allUrls) {
    const origin = getOrigin(url);
    if (origin && !origin.includes("youtube.com") && !origin.includes("youtu.be") && !origin.includes("vimeo.com")) {
      origins.add(origin);
    }
  }

  return Array.from(origins);
}

async function main() {
  console.log("=================================================");
  console.log("🔄 DATABASE STORAGE URL MIGRATION TOOL");
  console.log("=================================================");

  const { from, to, confirm, dryRun } = parseArgs();

  if (!from) {
    console.log("⚠️  Missing required argument: --from=<OLD_URL_PREFIX>");
    console.log("");
    const detectedOrigins = await scanExistingDomains();
    if (detectedOrigins.length > 0) {
      console.log("Found the following media origins currently in database:");
      detectedOrigins.forEach((orig) => console.log(`  - ${orig}`));
    }
    console.log("");
    console.log("Usage Example:");
    console.log('  npm run storage:migrate-urls -- --from="https://old-supabase-project.supabase.co/storage/v1/object/public/my-bucket" --to="https://pub-r2hash.r2.dev" --confirm');
    console.log("");
    console.log("Flags:");
    console.log("  --from=<URL>   Old storage URL prefix to replace (Required)");
    console.log("  --to=<URL>     New storage URL prefix (Defaults to S3_PUBLIC_URL in .env)");
    console.log("  --confirm      Execute database updates (Without this, runs in preview mode)");
    console.log("  --dry-run      Only display what would change without modifying database");
    console.log("=================================================");
    await prisma.$disconnect();
    process.exit(0);
  }

  if (!to) {
    console.error("❌ Error: Target URL (--to) is not specified and S3_PUBLIC_URL is empty in .env.");
    console.error("Please supply --to=\"https://new-storage-domain.com\" or configure S3_PUBLIC_URL in .env.");
    await prisma.$disconnect();
    process.exit(1);
  }

  const cleanFrom = from.replace(/\/+$/, "");
  const cleanTo = to.replace(/\/+$/, "");
  const isDryRun = dryRun || !confirm;

  console.log(`- Old URL prefix: ${cleanFrom}`);
  console.log(`- New URL prefix: ${cleanTo}`);
  console.log(`- Mode:           ${isDryRun ? "🔎 PREVIEW / DRY RUN (No changes will be saved)" : "⚡ LIVE UPDATE"}`);
  console.log("-------------------------------------------------");

  let totalUpdated = 0;

  // 1. Migrate Course thumbnails and intro videos
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { thumbnailUrl: { contains: cleanFrom } },
        { introVideoUrl: { contains: cleanFrom } },
      ],
    },
  });

  for (const course of courses) {
    const newThumb = course.thumbnailUrl?.includes(cleanFrom)
      ? course.thumbnailUrl.replaceAll(cleanFrom, cleanTo)
      : course.thumbnailUrl;
    const newIntro = course.introVideoUrl?.includes(cleanFrom)
      ? course.introVideoUrl.replaceAll(cleanFrom, cleanTo)
      : course.introVideoUrl;

    console.log(`  [COURSE] "${course.title}"`);
    if (newThumb !== course.thumbnailUrl) console.log(`    Thumb: ${course.thumbnailUrl} -> ${newThumb}`);
    if (newIntro !== course.introVideoUrl) console.log(`    Video: ${course.introVideoUrl} -> ${newIntro}`);

    if (!isDryRun) {
      await prisma.course.update({
        where: { id: course.id },
        data: { thumbnailUrl: newThumb, introVideoUrl: newIntro },
      });
    }
    totalUpdated++;
  }

  // 2. Migrate Lessons videoUrl
  const lessons = await prisma.lesson.findMany({
    where: { videoUrl: { contains: cleanFrom } },
  });

  for (const lesson of lessons) {
    const newVideo = lesson.videoUrl.replaceAll(cleanFrom, cleanTo);
    console.log(`  [LESSON] "${lesson.title}": ${lesson.videoUrl} -> ${newVideo}`);

    if (!isDryRun) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { videoUrl: newVideo },
      });
    }
    totalUpdated++;
  }

  // 3. Migrate Attachments fileUrl
  const attachments = await prisma.attachment.findMany({
    where: { fileUrl: { contains: cleanFrom } },
  });

  for (const att of attachments) {
    const newFileUrl = att.fileUrl.replaceAll(cleanFrom, cleanTo);
    console.log(`  [ATTACHMENT] "${att.fileName}": ${att.fileUrl} -> ${newFileUrl}`);

    if (!isDryRun) {
      await prisma.attachment.update({
        where: { id: att.id },
        data: { fileUrl: newFileUrl },
      });
    }
    totalUpdated++;
  }

  // 4. Migrate Blog Posts coverImageUrl
  const posts = await prisma.blogPost.findMany({
    where: { coverImageUrl: { contains: cleanFrom } },
  });

  for (const post of posts) {
    const newCover = post.coverImageUrl.replaceAll(cleanFrom, cleanTo);
    console.log(`  [BLOG POST] "${post.title}": ${post.coverImageUrl} -> ${newCover}`);

    if (!isDryRun) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { coverImageUrl: newCover },
      });
    }
    totalUpdated++;
  }

  // 5. Migrate User avatarUrl
  const users = await prisma.user.findMany({
    where: { avatarUrl: { contains: cleanFrom } },
  });

  for (const user of users) {
    const newAvatar = user.avatarUrl.replaceAll(cleanFrom, cleanTo);
    console.log(`  [USER] "${user.email}": ${user.avatarUrl} -> ${newAvatar}`);

    if (!isDryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: newAvatar },
      });
    }
    totalUpdated++;
  }

  // 6. Migrate Order proofImageUrl
  const orders = await prisma.order.findMany({
    where: { proofImageUrl: { contains: cleanFrom } },
  });

  for (const order of orders) {
    const newProof = order.proofImageUrl.replaceAll(cleanFrom, cleanTo);
    console.log(`  [ORDER] "#${order.orderCode}": ${order.proofImageUrl} -> ${newProof}`);

    if (!isDryRun) {
      await prisma.order.update({
        where: { id: order.id },
        data: { proofImageUrl: newProof },
      });
    }
    totalUpdated++;
  }

  console.log("-------------------------------------------------");
  if (isDryRun) {
    console.log(`🔎 Dry Run finished! Found ${totalUpdated} record(s) matching the prefix.`);
    if (totalUpdated > 0) {
      console.log(`To apply these changes permanently, re-run with '--confirm':`);
      console.log(`  npm run storage:migrate-urls -- --from="${cleanFrom}" --to="${cleanTo}" --confirm`);
    }
  } else {
    console.log(`🎉 Success! Permanently updated ${totalUpdated} record(s) in database.`);
  }
  console.log("=================================================");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
