import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const n = 180;
  const font = Math.round(n * 0.32);
  const pad = Math.round(n * 0.16);
  const border = Math.max(4, Math.round(n * 0.02));

  return new ImageResponse(
    (
      <div
        style={{
          width: n,
          height: n,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fdfbf7 0%, #e4ebe4 45%, #ffe4e6 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: Math.round(n * 0.7),
            height: Math.round(n * 0.7),
            borderRadius: pad,
            background: "rgba(255,255,255,0.94)",
            border: `${border}px solid #7d9a7d`,
            color: "#304230",
            fontSize: font,
            fontWeight: 700,
            letterSpacing: "-0.05em",
          }}
        >
          MM
        </div>
      </div>
    ),
    { ...size }
  );
}
