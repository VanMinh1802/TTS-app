import { describe, test, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap.ts", () => {
  test("includes all public routes", () => {
    const result = sitemap();

    const urls = result.map((entry) => entry.url);
    expect(urls).toContain("https://type2vibe.com");
    expect(urls).toContain("https://type2vibe.com/pricing");
    expect(urls).toContain("https://type2vibe.com/voices");
    expect(urls).toContain("https://type2vibe.com/dictionary");
    expect(urls).toContain("https://type2vibe.com/login");
  });

  test("excludes authenticated routes", () => {
    const result = sitemap();

    const urls = result.map((entry) => entry.url);
    expect(urls).not.toContain("https://type2vibe.com/dashboard");
    expect(urls).not.toContain("https://type2vibe.com/studio");
    expect(urls).not.toContain("https://type2vibe.com/admin");
    expect(urls).not.toContain("https://type2vibe.com/settings");
    expect(urls).not.toContain("https://type2vibe.com/api-keys");
    expect(urls).not.toContain("https://type2vibe.com/library");
    expect(urls).not.toContain("https://type2vibe.com/activate");
  });

  test("home page has highest priority", () => {
    const result = sitemap();

    const home = result.find((entry) => entry.url === "https://type2vibe.com");
    expect(home?.priority).toBe(1.0);
  });

  test("pricing and voices have high priority", () => {
    const result = sitemap();

    const pricing = result.find((entry) => entry.url === "https://type2vibe.com/pricing");
    const voices = result.find((entry) => entry.url === "https://type2vibe.com/voices");

    expect(pricing?.priority).toBe(0.9);
    expect(voices?.priority).toBe(0.8);
  });

  test("all entries have lastModified and changeFrequency", () => {
    const result = sitemap();

    for (const entry of result) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBeDefined();
    }
  });
});
