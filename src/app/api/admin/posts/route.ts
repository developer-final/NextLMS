import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, calculateReadingTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const isStaff =
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "INSTRUCTOR";

    if (!isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10));
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId");

    const whereClause: any = {};

    // Instructor can only view their own authored posts
    if (user.role === "INSTRUCTOR") {
      whereClause.authorId = user.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (categoryId && categoryId !== "ALL") {
      whereClause.categoryId = categoryId;
    }

    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ];
    }

    const [totalPosts, posts] = await Promise.all([
      prisma.blogPost.count({ where: whereClause }),
      prisma.blogPost.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          tags: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

    return NextResponse.json({
      posts,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalPosts,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Admin Posts GET Error:", error);
    return NextResponse.json({ error: "Error loading posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const isStaff =
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "INSTRUCTOR";

    if (!isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      summary,
      content,
      coverImageUrl,
      status = "DRAFT",
      isFeatured = false,
      categoryId,
      tagNames = [],
      attachmentIds = [],
      metaTitle,
      metaDescription,
      metaKeywords,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Generate and ensure unique slug
    let baseSlug = customSlug?.trim() ? slugify(customSlug) : slugify(title);
    if (!baseSlug) {
      baseSlug = `post-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const readingTime = calculateReadingTime(content);
    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    // Upsert tags and prepare connect relation
    const tagConnectOps: { id: string }[] = [];
    if (Array.isArray(tagNames) && tagNames.length > 0) {
      for (const rawName of tagNames) {
        const name = String(rawName).trim();
        if (!name) continue;
        const tagSlug = slugify(name);
        const tag = await prisma.tag.upsert({
          where: { name },
          update: {},
          create: {
            name,
            slug: tagSlug || `tag-${Date.now()}`,
          },
        });
        tagConnectOps.push({ id: tag.id });
      }
    }

    // Create BlogPost
    const post = await prisma.blogPost.create({
      data: {
        authorId: user.id,
        categoryId: categoryId || null,
        title: title.trim(),
        slug,
        summary: summary?.trim() || null,
        content: content.trim(),
        coverImageUrl: coverImageUrl || null,
        status,
        isFeatured: Boolean(isFeatured),
        readingTime,
        publishedAt,
        metaTitle: metaTitle?.trim() || null,
        metaDescription: metaDescription?.trim() || null,
        metaKeywords: metaKeywords?.trim() || null,
        tags: {
          connect: tagConnectOps,
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: true,
      },
    });

    // Associate attachments if any
    if (Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { postId: post.id },
      });
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Admin Posts POST Error:", error);
    return NextResponse.json({ error: "Error creating post" }, { status: 500 });
  }
}
