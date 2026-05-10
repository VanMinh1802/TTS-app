import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366F1, #C968F7)",
          borderRadius: "8px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.5px",
          }}
        >
          T2V
        </span>
      </div>
    ),
    { ...size }
  );
}
