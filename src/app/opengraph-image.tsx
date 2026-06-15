import { ImageResponse } from "next/og";

export const alt = "AI SEO Employee — Your highest-impact SEO action, every day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        {/* Bot icon */}
        <div
          style={{
            width: "96px",
            height: "96px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "24px",
            border: "3px solid rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
            fontSize: "52px",
          }}
        >
          🤖
        </div>

        <div
          style={{
            fontSize: "72px",
            fontWeight: "800",
            color: "white",
            textAlign: "center",
            lineHeight: "1.1",
            letterSpacing: "-2px",
            marginBottom: "24px",
          }}
        >
          AI SEO Employee
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            fontWeight: "400",
          }}
        >
          Your highest-impact SEO action, every day
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "100px",
            padding: "12px 28px",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.9)",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            ai-quick-seo.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
