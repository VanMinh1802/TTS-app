import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/studio/", "/admin/", "/settings/", "/api-keys/"],
    },
    sitemap: "https://type2vibe.com/sitemap.xml",
  };
}
