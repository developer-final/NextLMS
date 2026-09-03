import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://worldtradinglab.edu.vn";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/policy/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/policy/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/policy/payment`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  try {
    // Dynamic course routes
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Dynamic blog routes
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Dynamic category routes
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/courses?category=${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...courseRoutes, ...blogRoutes, ...categoryRoutes];
  } catch (error) {
    return staticRoutes;
  }
}
