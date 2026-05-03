---
version: "alpha"
name: "FlowMind - Intelligent Automation"
description: "Flowmind Intelligent Login Section is designed for authenticating users through a focused access flow. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for authentication screens in web products."
colors:
  primary: "#00F5D4"
  secondary: "#1E2A35"
  tertiary: "#94A3B8"
  neutral: "#0A1219"
  background: "#00F5D4"
  surface: "#0A1219"
  text-primary: "#94A3B8"
  text-secondary: "#FFFFFF"
  border: "#00F5D4"
  accent: "#00F5D4"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "60px"
    fontWeight: 500
    lineHeight: "60px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: "24px"
  label-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  md: "8px"
spacing:
  base: "6px"
  sm: "1px"
  md: "2px"
  lg: "6px"
  xl: "10px"
  gap: "8px"
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "#E2E8F0"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "1px"
  button-link:
    textColor: "{colors.tertiary}"
    rounded: "0px"
    padding: "0px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Open
  - Grid: Strong

## Colors

The color system uses dark mode with #00F5D4 as the main accent and #0A1219 as the neutral foundation.

- **Primary (#00F5D4):** Main accent and emphasis color.
- **Secondary (#1E2A35):** Supporting accent for secondary emphasis.
- **Tertiary (#94A3B8):** Reserved accent for supporting contrast moments.
- **Neutral (#0A1219):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #00F5D4; Surface: #0A1219; Text Primary: #94A3B8; Text Secondary: #FFFFFF; Border: #00F5D4; Accent: #00F5D4

- **Gradients:** bg-gradient-to-br from-brand-border to-black, bg-gradient-to-r from-brand-cyan to-blue-500, bg-gradient-to-br from-brand-cyan to-emerald-400, bg-gradient-to-b from-white/10 to-transparent

## Typography

Typography relies on Inter across display, body, and utility text.

- **Display (`display-lg`):** Inter, 60px, weight 500, line-height 60px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 16px, weight 300, line-height 24px.
- **Labels (`label-md`):** Inter, 16px, weight 400, line-height 24px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, bounded structural frame before changing ornament or component styling. Use 6px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / bounded composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 6px
- **Scale:** 1px, 2px, 6px, 10px, 14px, 16px, 24px, 32px
- **Gaps:** 8px, 12px, 16px, 24px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 1px #00F5D4; 1px #1E2A35
- **Shadows:** rgba(0, 0, 0, 0.8) 0px 10px 30px 0px, rgba(255, 255, 255, 0.05) 0px 2px 10px 0px inset; rgba(0, 245, 212, 0.3) 0px 0px 0px 1px inset; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 245, 212) 0px 0px 8px 0px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 8px radius. Drive the shell with none so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 6px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 6px, 7px, 8px, 12px, 16px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** background #1E2A35, text #E2E8F0, radius 8px, padding 1px, border 0px solid rgb(229, 231, 235).
- **Links:** text #94A3B8, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 6px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 6px, 7px, 8px, 12px, 16px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and color changes. Scroll choreography uses GSAP ScrollTrigger and Parallax for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 300ms, 150ms, 700ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** text, color

**Scroll Patterns:** gsap-scrolltrigger, parallax
