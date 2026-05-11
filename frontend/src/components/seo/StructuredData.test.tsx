import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { StructuredData } from "./StructuredData";

describe("StructuredData", () => {
  test("renders a JSON-LD script tag", () => {
    const { container } = render(<StructuredData />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  test("contains WebSite schema with SearchAction", () => {
    const { container } = render(<StructuredData />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "[]");

    const website = data.find((item: { "@type": string }) => item["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website.name).toBe("Type2Vibe");
    expect(website.url).toBe("https://type2vibe.online");
    expect(website.potentialAction["@type"]).toBe("SearchAction");
    expect(website.potentialAction.target).toBe(
      "https://type2vibe.online/dictionary?q={search_term_string}"
    );
  });

  test("contains Organization schema", () => {
    const { container } = render(<StructuredData />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "[]");

    const org = data.find((item: { "@type": string }) => item["@type"] === "Organization");
    expect(org).toBeDefined();
    expect(org.name).toBe("Type2Vibe");
    expect(org.url).toBe("https://type2vibe.online");
    expect(org.logo).toBe("https://type2vibe.online/logo.svg");
  });

  test("contains WebApplication schema", () => {
    const { container } = render(<StructuredData />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "[]");

    const webApp = data.find(
      (item: { "@type": string }) => item["@type"] === "WebApplication"
    );
    expect(webApp).toBeDefined();
    expect(webApp.name).toBe("Type2Vibe");
    expect(webApp.applicationCategory).toBe("MultimediaApplication");
    expect(webApp.operatingSystem).toBe("All");
  });
});
