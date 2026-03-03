import React, { useRef, useMemo } from "react";
import { useScrollRatio } from "../../hooks/useScrollRatio";

const T = {
  cream: "#f5ede0",
  creamDark: "#efe4d3",
  ink: "#141210",
  inkSubtle: "rgba(20,18,16,0.45)",
  inkGhost: "rgba(20,18,16,0.12)",
  sand: "#e8d9c4",
  warm: "#c9a97a",
  accent: "#b85c38",
};

/* ── 상수 ── */
const COLS = 22;
const ROWS = 22;
const TOTAL = COLS * ROWS;

/* ── 바이닐 레코드 패턴 색상 배열 (22×22) ── */
const VINYL_COLORS = (() => {
  const arr = [];
  const cx = COLS / 2;
  const cy = ROWS / 2;
  const maxR = Math.min(cx, cy);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const dx = c - cx;
      const dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxR;

      if (dist < 0.12)
        arr.push("#2a2218"); // 레이블 중심
      else if (dist < 0.22)
        arr.push("#141210"); // 레이블 링
      else if (dist < 0.28)
        arr.push(dist < 0.25 ? "#f5ede0" : "#e8d9c4"); // 레이블 텍스트
      else if (dist < 0.35) arr.push("#141210");
      else {
        const angle = Math.atan2(dy, dx);
        const stripe = Math.floor((angle / Math.PI + 1) * 4) % 2;
        arr.push(
          dist > 0.95
            ? "#3d3530"
            : dist > 0.85
              ? "#2a2218"
              : stripe
                ? "#1a1612"
                : "#141210",
        );
      }
    }
  }
  return arr;
})();

/* ── 픽셀 그리드 ── */
function VinylGrid({ filledCount }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 16px)`,
        gap: "2px",
      }}
    >
      {Array.from({ length: TOTAL }).map((_, i) => {
        const filled = i < filledCount;
        return (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 2,
              background: filled ? VINYL_COLORS[i] : T.sand,
              transform: filled ? "scale(1)" : "scale(0.85)",
              boxShadow: filled
                ? "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.12)"
                : "none",
              transition: `background 0.2s ease,
                         transform  0.25s cubic-bezier(.34,1.56,.64,1) ${(i % 8) * 15}ms,
                         box-shadow 0.2s ease`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── 메인 섹션 ── */
export default function ScrollBuilderSection() {
  const sectionRef = useRef(null);
  const ratio = useScrollRatio(sectionRef);

  const filledCount = Math.round(ratio * TOTAL * 1.15); // 1.15: 살짝 일찍 100% 도달
  const pct = Math.min(100, Math.round(ratio * 115));

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: "200vh", // ← 길게 만들어야 sticky 스크롤 작동
        position: "relative",
        background: T.cream,
        borderTop: `1px solid ${T.inkGhost}`,
      }}
    >
      {/* sticky 컨테이너 — 스크롤해도 뷰포트에 고정 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(40px, 6vw, 96px)",
          padding: "0 6vw",
          flexWrap: "wrap",
        }}
      >
        {/* 왼쪽 — 텍스트 + 진행도 */}
        <div style={{ flex: "1 1 300px", maxWidth: 380 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: T.inkSubtle,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Scroll to build
          </span>

          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 50px)",
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.1,
              margin: "14px 0 28px",
              color: T.ink,
            }}
          >
            Watch it come
            <br />
            <em style={{ color: T.accent }}>together.</em>
          </h2>

          {/* 진행 바 */}
          <div
            style={{
              height: 2,
              background: T.inkGhost,
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: T.accent,
                borderRadius: 99,
                transition: "width 0.1s linear",
              }}
            />
          </div>

          {/* 숫자 카운터 */}
          <div
            style={{
              marginTop: 14,
              fontSize: 48,
              fontWeight: 300,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: -2,
              lineHeight: 1,
              color: T.ink,
            }}
          >
            {String(pct).padStart(3, "0")}
            <span style={{ fontSize: 20, color: T.inkSubtle }}>%</span>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: T.inkSubtle,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            bricks placed
          </div>

          {/* 스터드 장식 */}
          <div style={{ display: "flex", gap: 10, marginTop: 40 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: T.warm,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </div>

        {/* 오른쪽 — 픽셀 그리드 */}
        <div
          style={{
            background: T.creamDark,
            padding: 16,
            borderRadius: 20,
            border: `1px solid ${T.sand}`,
            boxShadow: "0 20px 60px rgba(20,18,16,0.08)",
          }}
        >
          <VinylGrid filledCount={filledCount} />
        </div>
      </div>
    </section>
  );
}
