import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadInterFont(): Promise<ArrayBuffer> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap",
    { cache: "force-cache" },
  ).then((res) => res.text());

  const fontUrl = css.match(
    /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/,
  )?.[1];

  if (!fontUrl) throw new Error("Could not resolve Inter font URL");

  return fetch(fontUrl, { cache: "force-cache" }).then((res) => res.arrayBuffer());
}

export default async function TwitterImage() {
  const fontData = await loadInterFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #6366f1 70%, #a78bfa 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 70%)",
          }}
        />
        <span
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: "white",
            letterSpacing: "-0.03em",
            zIndex: 1,
          }}
        >
          Type2Vibe
        </span>
        <span
          style={{
            fontSize: 28,
            color: "#c4b5fd",
            marginTop: 12,
            letterSpacing: "0.02em",
            zIndex: 1,
          }}
        >
          AI Text-to-Speech for Vietnamese
        </span>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: "#a5b4fc",
              padding: "6px 16px",
              borderRadius: 999,
              border: "1px solid rgba(165, 180, 252, 0.3)",
            }}
          >
            TTS API
          </span>
          <span
            style={{
              fontSize: 16,
              color: "#a5b4fc",
              padding: "6px 16px",
              borderRadius: 999,
              border: "1px solid rgba(165, 180, 252, 0.3)",
            }}
          >
            Low Latency
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
