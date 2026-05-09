import { describe, test, expect } from "vitest";
import type { MetadataRoute } from "next";
import robots from "./robots";

type Rules = NonNullable<MetadataRoute.Robots["rules"]>;

describe("robots.ts", () => {
  test("returns allow for root path", () => {
    const result = robots();

    const rules = result.rules as Rules;
    expect(rules).toBeDefined();
    if (!Array.isArray(rules)) {
      expect(rules.allow).toBe("/");
    }
  });

  test("disallows authenticated and API paths", () => {
    const result = robots();

    const rules = result.rules as Rules;
    if (!Array.isArray(rules)) {
      expect(rules.disallow).toEqual([
        "/api/",
        "/dashboard/",
        "/studio/",
        "/admin/",
        "/settings/",
        "/api-keys/",
      ]);
    }
  });

  test("points to sitemap.xml", () => {
    const result = robots();

    expect(result.sitemap).toBe("https://type2vibe.com/sitemap.xml");
  });
});
