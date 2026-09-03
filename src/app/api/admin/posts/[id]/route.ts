import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, calculateReadingTime } from "@/lib/utils";
import { sanitizePlainText, sanitizeMarkdown } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
        category: true,
        tags: true,
        attachments: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (user.role === "INSTRUCTOR" && post.authorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this post" },
        { status: 403 }
      );
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Admin Post GET Error:", error);
    return NextResponse.json({ error: "Error loading post" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, authorId: true, slug: true, publishedAt: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (user.role === "INSTRUCTOR" && existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this post" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      summary,
      content,
      coverImageUrl,
      status,
      isFeatured,
      categoryId,
      tagNames,
      attachmentIds,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = body;

    const cleanTitle = title !== undefined ? sanitizePlainText(title, 250) : undefined;
    if (cleanTitle !== undefined && (cleanTitle.length < 3 || cleanTitle.length > 250)) {
      return NextResponse.json({ error: "Title must be between 3 and 250 characters" }, { status: 400 });
    }

    const cleanContent = content !== undefined ? sanitizeMarkdown(content) : undefined;
    if (cleanContent !== undefined && cleanContent.length < 5) {
      return NextResponse.json({ error: "Content must have at least 5 characters" }, { status: 400 });
    }

    const cleanSummary =
      summary !== undefined ? (summary ? sanitizePlainText(summary, 500) || null : null) : undefined;
    const cleanMetaTitle =
      metaTitle !== undefined ? (metaTitle ? sanitizePlainText(metaTitle, 150) || null : null) : undefined;
    const cleanMetaDesc =
      metaDescription !== undefined
        ? metaDescription
          ? sanitizePlainText(metaDescription, 300) || null
          : null
        : undefined;
    const cleanMetaKeywords =
      metaKeywords !== undefined
        ? metaKeywords
          ? sanitizePlainText(metaKeywords, 200) || null
          : null
        : undefined;

    // Handle slug change if provided
    let finalSlug = existingPost.slug;
    if (customSlug && customSlug.trim()) {
      const candidateSlug = slugify(customSlug);
      if (candidateSlug !== existingPost.slug) {
        let slug = candidateSlug;
        let counter = 1;
        while (
          await prisma.blogPost.findFirst({
            where: { slug, id: { not: id } },
          })
        ) {
          slug = `${candidateSlug}-${counter}`;
          counter++;
        }
        finalSlug = slug;
      }
    } else if (cleanTitle && cleanTitle !== existingPost.slug) {
      // Keep existing slug unless customSlug is explicitly changed
    }

    const readingTime = cleanContent ? calculateReadingTime(cleanContent) : undefined;
    let publishedAt = existingPost.publishedAt;
    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }

    // Handle tag connections
    let tagUpdateData: any = undefined;
    if (Array.isArray(tagNames)) {
      const tagConnectOps: { id: string }[] = [];
      for (const rawName of tagNames) {
        const name = sanitizePlainText(String(rawName), 50);
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
      tagUpdateData = {
        set: tagConnectOps,
      };
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title: cleanTitle,
        slug: finalSlug,
        summary: cleanSummary,
        content: cleanContent,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl || null : undefined,
        status: status || undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        categoryId: categoryId !== undefined ? categoryId || null : undefined,
        readingTime,
        publishedAt,
        metaTitle: cleanMetaTitle,
        metaDescription: cleanMetaDesc,
        metaKeywords: cleanMetaKeywords,
        tags: tagUpdateData,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: true,
        attachments: true,
      },
    });

    // Update attachments if attachmentIds is passed
    if (Array.isArray(attachmentIds)) {
      // Unlink attachments not in the list
      await prisma.attachment.updateMany({
        where: { postId: id, id: { notIn: attachmentIds } },
        data: { postId: null },
      });
      // Link attachments in the list
      if (attachmentIds.length > 0) {
        await prisma.attachment.updateMany({
          where: { id: { in: attachmentIds } },
          data: { postId: id },
        });
      }
    }

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    console.error("Admin Post PUT Error:", error);
    return NextResponse.json({ error: "Error updating post" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (user.role === "INSTRUCTOR" && existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this post" },
        { status: 403 }
      );
    }

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (error: any) {
    console.error("Admin Post DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting post" }, { status: 500 });
  }
}
