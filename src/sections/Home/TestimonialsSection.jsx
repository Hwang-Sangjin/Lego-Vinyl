import React, { useMemo } from "react";
import { useInView } from "../../hooks/useInView";

const T = {
  cream: "#f5ede0",
  creamDark: "#efe4d3",
  ink: "#141210",
  inkLight: "rgba(20,18,16,0.72)",
  inkSubtle: "rgba(20,18,16,0.45)",
  inkGhost: "rgba(20,18,16,0.12)",
  sand: "#e8d9c4",
  accent: "#b85c38",
};

const TESTIMONIALS = [
  {
    quote:
      "Hung it in my studio. Every single person who walks in asks about it. It's the most impressive thing on my wall.",
    name: "Marcus L.",
    role: "Music producer, Berlin",
    palette: ["#b85c38", "#c9a97a", "#f5ede0"],
  },
  {
    quote:
      "I thought 32×32 would be too small to recognize. It was perfect. You could tell exactly what album it was from across the room.",
    name: "Erin T.",
    role: "Collector, NYC",
    palette: ["#4a6fa5", "#88b04b", "#e8d9c4"],
  },
  {
    quote:
      "The kit arrived with a perfectly labeled guide. I built it with my daughter in an afternoon. Now it lives above her record player.",
    name: "Tomás R.",
    role: "Parent & vinyl head, Madrid",
    palette: ["#141210", "#c9a97a", "#8b6355"],
  },
];

function PixelAccent({ palette, visible }) {
  const grid = useMemo(
    () =>
      Array.from(
        { length: 18 },
        () => palette[Math.floor(Math.random() * palette.length)],
      ),
    [palette],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 10px)",
        gap: "2px",
      }}
    >
      {grid.map((color, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            background: color,
            borderRadius: 2,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.5)",
            transition: `opacity 0.3s cubic-bezier(.34,1.56,.64,1) ${i * 30}ms,
                       transform 0.3s cubic-bezier(.34,1.56,.64,1) ${i * 30}ms`,
          }}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ t, index, parentVisible }) {
  return (
    <div
      style={{
        flex: "1 1 280px",
        background: T.cream,
        border: `1px solid ${T.sand}`,
        borderRadius: 16,
        padding: 28,
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${index * 0.12}s,
                   transform 0.7s cubic-bezier(.22,1,.36,1) ${index * 0.12}s`,
      }}
    >
      {/* 픽셀 액센트 */}
      <PixelAccent palette={t.palette} visible={parentVisible} />

      <div style={{ height: 20 }} />

      {/* 따옴표 */}
      <div
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 64,
          lineHeight: 0.6,
          color: T.sand,
          marginBottom: 16,
          userSelect: "none",
        }}
      >
        "
      </div>

      {/* 본문 */}
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: T.inkLight,
          margin: "0 0 24px",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {t.quote}
      </p>

      {/* 작성자 */}
      <div style={{ borderTop: `1px solid ${T.sand}`, paddingTop: 16 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: T.ink,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {t.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: T.inkSubtle,
            marginTop: 2,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {t.role}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [sRef, sVis] = useInView(0.1);

  return (
    <section
      ref={sRef}
      style={{
        padding: "120px 6vw",
        background: T.creamDark,
        borderTop: `1px solid ${T.inkGhost}`,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* 헤더 */}
        <div
          style={{
            marginBottom: 72,
            textAlign: "center",
            opacity: sVis ? 1 : 0,
            transform: sVis ? "translateY(0)" : "translateY(28px)",
            transition:
              "opacity 0.75s cubic-bezier(.22,1,.36,1), transform 0.75s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: T.inkSubtle,
            }}
          >
            From the community
          </span>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 50px)",
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.1,
              margin: "14px 0 0",
              color: T.ink,
            }}
          >
            Built with hands.
            <br />
            <em style={{ color: T.accent }}>Remembered forever.</em>
          </h2>
        </div>

        {/* 카드 3개 */}
        <div
          style={{
            display: "flex",
            gap: "clamp(16px, 3vw, 32px)",
            flexWrap: "wrap",
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} parentVisible={sVis} />
          ))}
        </div>
      </div>
    </section>
  );
}
