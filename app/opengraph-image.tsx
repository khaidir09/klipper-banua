import { ImageResponse } from "next/og";
import { publicEnv } from "@/lib/env";

export const alt = `${publicEnv.NEXT_PUBLIC_APP_NAME} — kliper lokal Kalimantan`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card for the public pages (FR-M15-05). Colours are written as hex on
 * purpose: this renders to a PNG outside the browser, so the CSS variables of
 * the design system are not available. The values are the fixed brand panel
 * from design system §11 (`--brand-panel`, its foreground and muted text).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#1E3A5F",
        color: "#FFFFFF",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>
        {publicEnv.NEXT_PUBLIC_APP_NAME}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1.5 }}>
          Bisa edit video? Posting klip, dapat honor dari views.
        </div>
        <div style={{ fontSize: 30, color: "#C3D3E8" }}>
          Daftar gratis · Dibayar per 1.000 views · Kliper Kalimantan
        </div>
      </div>
    </div>,
    { ...size },
  );
}
