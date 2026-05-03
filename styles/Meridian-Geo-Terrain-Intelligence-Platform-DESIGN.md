---
version: "alpha"
name: "Meridian Geo — Terrain Intelligence Platform"
description: "Meridian Geo Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#7A9A6E"
  secondary: "#C4B99A"
  tertiary: "#6DA585"
  neutral: "#E8EFE2"
  background: "#7A9A6E"
  surface: "#0D100A"
  text-primary: "#C4B99A"
  text-secondary: "#E8EFE2"
  accent: "#7A9A6E"
typography:
  display-lg:
    fontFamily: "System Font"
    fontSize: "72px"
    fontWeight: 100
    lineHeight: "72px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "System Font"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: "24px"
  label-md:
    fontFamily: "System Font"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "16px"
    letterSpacing: "0.3px"
rounded:
  md: "0px"
spacing:
  base: "8px"
  sm: "1px"
  md: "8px"
  lg: "14px"
  xl: "20px"
  gap: "6px"
  card-padding: "24px"
  section-padding: "24px"
components:
  button-link:
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    rounded: "17px"
    padding: "24px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses light mode with #7A9A6E as the main accent and #E8EFE2 as the neutral foundation.

- **Primary (#7A9A6E):** Main accent and emphasis color.
- **Secondary (#C4B99A):** Supporting accent for secondary emphasis.
- **Tertiary (#6DA585):** Reserved accent for supporting contrast moments.
- **Neutral (#E8EFE2):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #7A9A6E; Surface: #0D100A; Text Primary: #C4B99A; Text Secondary: #E8EFE2; Accent: #7A9A6E

- **Gradients:** bg-gradient-to-b from-[#0a0d08]/60 to-[#0a0d08]/90 via-transparent, bg-gradient-to-r from-[#e8efe2] to-[#c4b99a], bg-gradient-to-br from-[#7a9a6e] to-[#5c7a4a], bg-gradient-to-br from-[#7a9a6e] to-[#a8c89a]

## Typography

Typography relies on System Font across display, body, and utility text.

- **Display (`display-lg`):** System Font, 72px, weight 100, line-height 72px, letter-spacing -0.025em.
- **Body (`body-md`):** System Font, 16px, weight 300, line-height 24px.
- **Labels (`label-md`):** System Font, 12px, weight 300, line-height 16px, letter-spacing 0.3px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 8px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 8px
- **Scale:** 1px, 8px, 14px, 20px, 24px, 28px, 32px, 40px
- **Section padding:** 24px
- **Card padding:** 24px
- **Gaps:** 6px, 8px, 12px, 24px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 1px #FFFFFF
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(122, 154, 110, 0.05) 0px 0px 20px 0px inset; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.6) 0px 20px 60px -10px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(122, 154, 110, 0.6) 0px 0px 10px 0px
- **Blur:** 24px, 40px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 18px radius. Drive the shell with linear-gradient(rgba(122, 154, 110, 0.4), rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 12px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 12px, 17px, 18px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Links:** text #C4B99A, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background rgba(13, 16, 10, 0.8), border 0px solid rgb(229, 231, 235), radius 17px, padding 24px, shadow none, blur 40px.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 8px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 12px, 17px, 18px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 150ms. Easing favors ease and 0. Hover behavior focuses on text and shadow changes.

**Motion Level:** moderate

**Durations:** 300ms, 150ms, 500ms, 4000ms, 700ms

**Easings:** ease, 0, 0.2, 1), cubic-bezier(0.4, linear

**Hover Patterns:** text, shadow

## WebGL

Reconstruct the graphics as a full-bleed background field using alpha, dpr clamp, custom shaders. The effect should read as technical, meditative, and atmospheric: noise haze with black and sparse spacing. Build it from shader field so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Noise haze
  - **Primitives:**
    - **Value:** Shader field
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** alpha, DPR clamp, custom shaders

**Techniques:** Breathing pulse, Pointer parallax, Shader gradients, Noise fields, DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Background -->
      <canvas id="heroCanvas" class="absolute inset-0 z-0 w-full h-full"></canvas>

      <!-- Ambient Gradient Overlay -->
      ```
