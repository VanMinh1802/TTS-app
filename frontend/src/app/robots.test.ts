import { describe, test, expect } from "vitest";
import robots from "./robots";

describe("robots.ts", () => {
  test("returns allow for root path", () => {
    const result = robots();

    expect(result.rules).toBeDefined();
    expect(result.rules!.allow).toBe("/");
  });

  test("disallows authenticated and API paths", () => {
    const result = robots();

    expect(result.rules!.disallow).toEqual([
      "/api/",
      "/dashboard/",
      "/studio/",
      "/admin/",
      "/settings/",
      "/api-keys/",
    ]);
  });

  test("points to sitemap.xml", () => {
    const result = robots();

    expect(result.sitemap).toBe("https://type2vibe.com/sitemap.xml");
  });
});
