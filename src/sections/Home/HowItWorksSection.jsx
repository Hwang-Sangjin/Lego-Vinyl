import React from "react";
import { useInView } from "../../hooks/useInView";

/* ── 디자인 토큰 (Hero와 동일한 팔레트) ── */
const T = {
  cream: "#f5ede0",
  creamDark: "#efe4d3",
  ink: "#141210",
  inkLight: "rgba(20,18,16,0.72)",
  inkSubtle: "rgba(20,18,16,0.45)",
  inkGhost: "rgba(20,18,16,0.12)",
  sand: "#e8d9c4",
  warm: "#c9a97a",
  accent: "#b85c38",
};

/* ── 데이터 ── */
const STEPS = [
  {
    num: "01",
    title: "Upload your album",
    body: "Drop any album art or personal photo. Our pixel engine slices it into an optimized 32×32 lego palette automatically.",
    palette: ["#c9a97a", "#e8d9c4", "#b85c38", "#f5ede0", "#8b6355"],
  },
  {
    num: "02",
    title: "Choose your palette",
    body: "Pick from warm muted tones, bold primaries, or classic monochrome. Every color maps to a real 1×1 brick.",
    palette: ["#4a6fa5", "#e8d9c4", "#f5ede0", "#88b04b", "#b85c38"],
  },
  {
    num: "03",
    title: "We build & ship",
    body: "Each mosaic arrives as a ready-to-place kit with a numbered placement guide. No glue. No guesswork.",
    palette: ["#141210", "#e8d9c4", "#c9a97a", "#f5ede0", "#3d3530"],
  },
];

/* ── 픽셀 모자이크 ── */
function PixelMosaic({ palette, rows = 8, cols = 8, size = 16, visible }) {
  // 최초 렌더 시 한 번만 랜덤 생성
  const grid = React.useMemo(
    () =>
      Array.from(
        { length: rows * cols },
        () => palette[Math.floor(Math.random() * palette.length)],
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap: "2px",
      }}
    >
      {grid.map((color, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            background: color,
            borderRadius: 2,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.5)",
            transition: `opacity 0.35s cubic-bezier(.34,1.56,.64,1) ${i * 9}ms,
                         transform 0.35s cubic-bezier(.34,1.56,.64,1) ${i * 9}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── 스텝 카드 ── */
function StepCard({ step, index, parentVisible }) {
  const [ref, vis] = useInView(0.2);
  const show = parentVisible && vis;

  return (
    <div
      ref={ref}
      style={{
        flex: "1 1 260px",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.6s cubic-bezier(.22,1,.36,1) ${index * 0.13}s,
                     transform 0.6s cubic-bezier(.22,1,.36,1) ${index * 0.13}s`,
      }}
    >
      {/* 픽셀 프리뷰 */}
      <div
        style={{
          display: "inline-block",
          background: T.creamDark,
          border: `1px solid ${T.inkGhost}`,
          borderRadius: 14,
          padding: 18,
          marginBottom: 22,
        }}
      >
        <PixelMosaic palette={step.palette} visible={show} />
      </div>

      {/* 번호 */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          color: T.accent,
          fontFamily: "'DM Mono', monospace",
          marginBottom: 10,
        }}
      >
        {step.num} ──
      </div>

      {/* 제목 */}
      <h3
        style={{
          fontSize: 22,
          fontFamily: "'DM Serif Display', Georgia, serif",
          lineHeight: 1.2,
          margin: "0 0 10px",
          color: T.ink,
        }}
      >
        {step.title}
      </h3>

      {/* 설명 */}
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.75,
          color: T.inkLight,
          margin: 0,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {step.body}
      </p>
    </div>
  );
}

/* ── 메인 섹션 ── */
export default function HowItWorksSection() {
  const [sRef, sVis] = useInView(0.1);

  return (
    <section
      ref={sRef}
      style={{
        padding: "120px 6vw",
        background: T.cream,
        borderTop: `1px solid ${T.inkGhost}`,
        position: "relative",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* 배경 스터드 도트 패턴 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, ${T.ink} 1.2px, transparent 1.2px)`,
          backgroundSize: "24px 24px",
          opacity: 0.025,
        }}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
        {/* 헤더 */}
        <div
          style={{
            marginBottom: 72,
            opacity: sVis ? 1 : 0,
            transform: sVis ? "translateY(0)" : "translateY(28px)",
            transition:
              "opacity 0.75s cubic-bezier(.22,1,.36,1), transform 0.75s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* 스터드 장식 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: T.inkGhost,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: T.inkSubtle,
            }}
          >
            Process
          </span>

          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.08,
              margin: "14px 0 0",
              letterSpacing: -0.5,
              color: T.ink,
            }}
          >
            Three steps from
            <br />
            <em style={{ color: T.accent }}>image to mosaic.</em>
          </h2>
        </div>

        {/* 스텝 카드 3개 */}
        <div
          style={{
            display: "flex",
            gap: "clamp(24px, 4vw, 56px)",
            flexWrap: "wrap",
          }}
        >
          {STEPS.map((step, i) => (
            <StepCard key={i} step={step} index={i} parentVisible={sVis} />
          ))}
        </div>
      </div>
    </section>
  );
}
