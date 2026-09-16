import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://worldtradinglab.edu.vn";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/courses",
          "/courses/*",
          "/blog",
          "/blog/*",
          "/categories",
          "/about",
          "/affiliate",
          "/certificates/*",
          "/policy/*",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/learn",
          "/learn/*",
          "/checkout/*",
          "/api/*",
          "/my-courses",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
