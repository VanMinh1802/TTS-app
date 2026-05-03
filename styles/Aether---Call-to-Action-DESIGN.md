---
version: "alpha"
name: "Aether - Call to Action"
description: "Aether Call CTA Section is designed for building reusable UI components in modern web projects. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#6366F1"
  secondary: "#000000"
  tertiary: "#C968F7"
  neutral: "#000000"
  surface: "#000000"
  text-primary: "#F4F4F5"
  text-secondary: "#71717A"
  border: "#000000"
  accent: "#6366F1"
typography:
  display-lg:
    fontFamily: "System Font"
    fontSize: "60px"
    fontWeight: 400
    lineHeight: "60px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "System Font"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22.75px"
  label-md:
    fontFamily: "System Font"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  full: "9999px"
spacing:
  base: "4px"
  sm: "4px"
  md: "8px"
  lg: "10px"
  xl: "16px"
  gap: "8px"
  card-padding: "48px"
  section-padding: "48px"
components:
  button-primary:
    textColor: "#111111"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "10px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Open
  - Grid: Strong

## Colors

The color system uses dark mode with #6366F1 as the main accent and #000000 as the neutral foundation.

- **Primary (#6366F1):** Main accent and emphasis color.
- **Secondary (#000000):** Supporting accent for secondary emphasis.
- **Tertiary (#C968F7):** Reserved accent for supporting contrast moments.
- **Neutral (#000000):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Surface: #000000; Text Primary: #F4F4F5; Text Secondary: #71717A; Border: #000000; Accent: #6366F1

- **Gradients:** bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a], bg-gradient-to-b from-[#111111] to-[#000000], bg-gradient-to-b from-[#1e1e1e] to-[#0a0a0a], bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]

## Typography

Typography relies on System Font across display, body, and utility text.

- **Display (`display-lg`):** System Font, 60px, weight 400, line-height 60px, letter-spacing -0.025em.
- **Body (`body-md`):** System Font, 14px, weight 400, line-height 22.75px.
- **Labels (`label-md`):** System Font, 14px, weight 400, line-height 20px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, bounded structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / bounded composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 4px
- **Scale:** 4px, 8px, 10px, 16px, 24px, 32px, 48px
- **Section padding:** 48px
- **Card padding:** 48px
- **Gaps:** 8px, 12px, 16px, 48px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 1px #000000; 1px #333333; 1px #FFFFFF; 1px #555555
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.9) 0px 4px 8px 0px inset, rgba(255, 255, 255, 0.08) 0px 1px 1px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 0, 0) 0px 30px 60px -15px, rgba(255, 255, 255, 0.08) 0px 1px 2px 0px inset, rgba(0, 0, 0, 0.9) 0px -3px 12px 0px inset; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 2px 6px 0px inset, rgba(255, 255, 255, 0.05) 0px 1px 1px 0px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 32px radius. Drive the shell with linear-gradient(rgb(30, 30, 30), rgb(10, 10, 10)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 32px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 32px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** text #111111, radius 9999px, padding 10px, border 1px solid rgba(255, 255, 255, 0.6).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 32px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected minimal motion intensity without a deliberate reason.

## Motion

Motion stays restrained and interface-led across text, layout, and scroll transitions. Timing clusters around 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on color changes.

**Motion Level:** minimal

**Durations:** 150ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** color

## WebGL

Reconstruct the graphics as a centered hero field using webgl, custom shaders. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with monochrome contrast and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Centered hero field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Canvas Background -->
      <canvas id="glcanvas" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

      <!-- UI Overlay -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // WebGL Setup for the glowing wireframe torus effect
      const canvas = document.getElementById('glcanvas');
      const gl = canvas.getContext('webgl');

      if (!gl) {
          console.error('WebGL not supported');
      }
      ```
  - **Draw call:**
    - **Language:** js
    - **Snippet:**
      ```
      // Fragment Shader
      const fsSource = `
          precision highp float;
          uniform vec2 u_resolution;
          uniform float u_time;

          void main() {
              // Normalize pixel coordinates (from 0 to 1)
      ```
