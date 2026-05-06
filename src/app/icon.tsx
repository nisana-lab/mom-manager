import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const n = 32;
  const font = 11;
  const pad = 6;
  const border = 2;

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
            width: 23,
            height: 23,
            borderRadius: pad,
            background: "rgba(255,255,255,0.94)",
            border: `${border}px solid #7d9a7d`,
            color: "#304230",
            fontSize: font,
            fontWeight: 700,
            letterSpacing: "-0.06em",
          }}
        >
          MM
        </div>
      </div>
    ),
    { ...size }
  );
}
