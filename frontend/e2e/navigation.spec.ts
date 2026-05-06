import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Type2Vibe/);
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1")).toContainText("Bảng giá");
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Sign in with Google")).toBeVisible();
  });

  test("studio redirects to login with callbackUrl when not authenticated", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForURL("**/login?callbackUrl=%2Fstudio");
  });

  test("navbar shows on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("public nav links visible when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });
});
