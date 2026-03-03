import React, { useMemo } from "react";
import { useInView } from "../../hooks/useInView";

const T = {
  cream: "#f5ede0",
  ink: "#141210",
  inkLight: "rgba(20,18,16,0.72)",
  inkSubtle: "rgba(20,18,16,0.45)",
  inkGhost: "rgba(20,18,16,0.12)",
  sand: "#e8d9c4",
  accent: "#b85c38",
};

const MARQUEE_ITEMS = [
  "1×1 Brick Mosaic",
  "Vinyl-Ready Artwork",
  "32×32 · 48×48 · 64×64",
  "Ships as a Kit",
  "Muted Palette",
  "Any Album Art",
];

const PERKS = [
  "Ships in 3–5 days",
  "Includes build guide",
  "100% authentic bricks",
];

function PixelStrip({ visible }) {
  const grid = useMemo(
    () =>
      Array.from({ length: 64 }, () => {
        const palettes = [
          "#b85c38",
          "#c9a97a",
          "#e8d9c4",
          "#141210",
          "#f5ede0",
          "#8b6355",
        ];
        return palettes[Math.floor(Math.random() * palettes.length)];
      }),
    [],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(16, 12px)",
        gap: "2px",
      }}
    >
      {grid.map((color, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            background: color,
            borderRadius: 2,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.5)",
            transition: `opacity 0.3s cubic-bezier(.34,1.56,.64,1) ${i * 18}ms,
                       transform 0.3s cubic-bezier(.34,1.56,.64,1) ${i * 18}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function CTABannerSection() {
  const [sRef, sVis] = useInView(0.15);

  return (
    <section
      ref={sRef}
      style={{
        borderTop: `1px solid ${T.inkGhost}`,
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* ── 마퀴 배너 ── */}
      <div
        style={{
          background: T.ink,
          padding: "14px 0",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes marqueeScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marqueeScroll 22s linear infinite;
          }
        `}</style>

        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                letterSpacing: "0.22em",
                color: T.cream,
                opacity: 0.7,
                textTransform: "uppercase",
                padding: "0 32px",
                display: "flex",
                alignItems: "center",
                gap: 28,
                whiteSpace: "nowrap",
              }}
            >
              {item}
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: T.accent,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* ── 메인 CTA ── */}
      <div
        style={{
          padding: "100px 6vw",
          textAlign: "center",
          background: T.cream,
          position: "relative",
        }}
      >
        {/* 배경 스터드 패턴 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(circle, ${T.ink} 1.2px, transparent 1.2px)`,
            backgroundSize: "24px 24px",
            opacity: 0.022,
          }}
        />

        <div style={{ position: "relative" }}>
          {/* 픽셀 스트립 */}
          <div
            style={{
              display: "inline-block",
              marginBottom: 28,
              opacity: sVis ? 1 : 0,
              transform: sVis ? "translateY(0)" : "translateY(20px)",
              transition:
                "opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <PixelStrip visible={sVis} />
          </div>

          {/* 타이틀 */}
          <h2
            style={{
              fontSize: "clamp(40px, 7vw, 80px)",
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.0,
              margin: "0 0 20px",
              letterSpacing: -1,
              color: T.ink,
              opacity: sVis ? 1 : 0,
              transform: sVis ? "translateY(0)" : "translateY(28px)",
              transition:
                "opacity 0.7s cubic-bezier(.22,1,.36,1) 0.1s, transform 0.7s cubic-bezier(.22,1,.36,1) 0.1s",
            }}
          >
            Your album.
            <br />
            <em style={{ color: T.accent }}>1×1 brick at a time.</em>
          </h2>

          {/* 서브텍스트 */}
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: T.inkLight,
              maxWidth: 460,
              margin: "0 auto 40px",
              opacity: sVis ? 1 : 0,
              transform: sVis ? "translateY(0)" : "translateY(20px)",
              transition:
                "opacity 0.7s cubic-bezier(.22,1,.36,1) 0.2s, transform 0.7s cubic-bezier(.22,1,.36,1) 0.2s",
            }}
          >
            Turn your favourite record into a permanent piece of craft. Ships
            ready to build, no tools required.
          </p>

          {/* 버튼 2개 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              opacity: sVis ? 1 : 0,
              transform: sVis ? "translateY(0)" : "translateY(20px)",
              transition:
                "opacity 0.7s cubic-bezier(.22,1,.36,1) 0.3s, transform 0.7s cubic-bezier(.22,1,.36,1) 0.3s",
            }}
          >
            <a
              href="/custom"
              style={{
                padding: "14px 28px",
                background: T.ink,
                color: T.cream,
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                letterSpacing: "0.06em",
                fontFamily: "'DM Mono', monospace",
                textDecoration: "none",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#2a2520";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = T.ink;
                e.target.style.transform = "translateY(0)";
              }}
            >
              Start customizing →
            </a>
            <a
              href="/about"
              style={{
                padding: "14px 28px",
                background: "rgba(255,255,255,0.4)",
                border: `1px solid ${T.inkGhost}`,
                borderRadius: 12,
                color: T.ink,
                fontSize: 14,
                letterSpacing: "0.06em",
                fontFamily: "'DM Mono', monospace",
                textDecoration: "none",
                backdropFilter: "blur(6px)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "rgba(255,255,255,0.65)")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "rgba(255,255,255,0.4)")
              }
            >
              Learn more
            </a>
          </div>

          {/* 특징 목록 */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 32,
              justifyContent: "center",
              flexWrap: "wrap",
              fontSize: 12,
              color: T.inkSubtle,
              opacity: sVis ? 1 : 0,
              transition: "opacity 0.7s cubic-bezier(.22,1,.36,1) 0.4s",
            }}
          >
            {PERKS.map((item, i) => (
              <span
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span style={{ color: T.accent }}>✓</span> {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
