---
version: "alpha"
name: "Aurora Engine"
description: "Aurora Engine Feature Section is designed for highlighting product capabilities and value points. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#2DD4BF"
  secondary: "#14B8A6"
  tertiary: "#9CA3AF"
  neutral: "#000000"
  background: "#000000"
  surface: "#FFFFFF"
  text-primary: "#9CA3AF"
  text-secondary: "#FFFFFF"
  border: "#FFFFFF"
  accent: "#2DD4BF"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "96px"
    fontWeight: 600
    lineHeight: "96px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  label-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  md: "0px"
  full: "9999px"
spacing:
  base: "6px"
  sm: "1px"
  md: "6px"
  lg: "8px"
  xl: "9.6px"
  gap: "8px"
  card-padding: "9px"
  section-padding: "112px"
components:
  button-primary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "8px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "14px"
  button-link:
    textColor: "{colors.tertiary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "0px"
---

## Overview

- **Composition cues:**
  - Layout: Flex
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Minimal

## Colors

The color system uses dark mode with #2DD4BF as the main accent and #000000 as the neutral foundation.

- **Primary (#2DD4BF):** Main accent and emphasis color.
- **Secondary (#14B8A6):** Supporting accent for secondary emphasis.
- **Tertiary (#9CA3AF):** Reserved accent for supporting contrast moments.
- **Neutral (#000000):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #000000; Surface: #FFFFFF; Text Primary: #9CA3AF; Text Secondary: #FFFFFF; Border: #FFFFFF; Accent: #2DD4BF

- **Gradients:** bg-gradient-to-b from-black/40 to-[#0a0a0a]/80 via-transparent, bg-gradient-to-br from-amber-400 to-teal-500, bg-gradient-to-r from-amber-500/20 to-amber-500/20 via-teal-500/40, bg-gradient-to-r from-amber-100 to-teal-100 via-white

## Typography

Typography relies on Inter across display, body, and utility text.

- **Display (`display-lg`):** Inter, 96px, weight 600, line-height 96px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 14px, weight 500, line-height 20px.
- **Labels (`label-md`):** Inter, 12px, weight 500, line-height 16px.

## Layout

Layout follows a flex composition with reusable spacing tokens. Preserve the flex, full bleed structural frame before changing ornament or component styling. Use 6px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a flex / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Flex
- **Content width:** Full Bleed
- **Base unit:** 6px
- **Scale:** 1px, 6px, 8px, 9.6px, 12px, 14px, 16px, 24px
- **Section padding:** 112px
- **Card padding:** 9px
- **Gaps:** 8px, 12px, 16px, 32px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 1px #FFFFFF
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(45, 212, 191, 0.3) 0px 0px 15px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.1) 0px 0px 40px 0px
- **Blur:** 12px, 24px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 0px radius. Drive the shell with linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0), rgba(10, 10, 10, 0.8)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 9999px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** background #FFFFFF, text #000000, radius 9999px, padding 8px, border 0px solid rgb(229, 231, 235).
- **Secondary:** background #FFFFFF, text #FFFFFF, radius 9999px, padding 14px, border 1px solid rgba(255, 255, 255, 0.1).
- **Links:** text #9CA3AF, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 6px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 150ms and 1000ms. Easing favors ease and 0. Hover behavior focuses on text and color changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 150ms, 1000ms

**Easings:** ease, 0, 0.2, 1), cubic-bezier(0.4, cubic-bezier(0

**Hover Patterns:** text, color, stroke

**Scroll Patterns:** gsap-scrolltrigger

## WebGL

Reconstruct the graphics as a full-bleed background field using alpha, dpr clamp, custom shaders. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve reduced motion + dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** alpha, DPR clamp, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- Background Canvas -->
      <canvas id="canvas" class="fixed inset-0 w-full h-full z-0 touch-none pointer-events-auto"></canvas>

      <!-- Subtle overlay to ensure text readability -->
      ```
