import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://type2vibe.online";
  const lastModified = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly";
  }> = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/voices", priority: 0.8, changeFrequency: "weekly" },
    { path: "/dictionary", priority: 0.6, changeFrequency: "weekly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
