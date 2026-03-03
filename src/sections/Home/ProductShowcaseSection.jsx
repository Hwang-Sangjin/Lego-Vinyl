import React, { useRef, useState, useMemo, useCallback } from "react";
import { useInView } from "../../hooks/useInView";

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

const PRODUCTS = [
  {
    title: "Dark Side of the Moon",
    artist: "Pink Floyd",
    size: "32×32",
    price: "$89",
    palette: ["#141210", "#b85c38", "#c9a97a", "#2a2218", "#8b6355", "#f5ede0"],
    badge: "Bestseller",
  },
  {
    title: "Abbey Road",
    artist: "The Beatles",
    size: "48×48",
    price: "$149",
    palette: ["#e8d9c4", "#c9a97a", "#a07850", "#5c3d2e", "#f5ede0", "#8b6355"],
    badge: "New",
  },
  {
    title: "Nevermind",
    artist: "Nirvana",
    size: "32×32",
    price: "$89",
    palette: ["#4a6fa5", "#e8d9c4", "#f5ede0", "#2d4a6e", "#88b04b", "#b85c38"],
    badge: null,
  },
];

function ProductCard({ product, index, parentVisible }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = useCallback((e) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    const rx = ((e.clientY - r.top) / r.height - 0.5) * 18;
    const ry = -((e.clientX - r.left) / r.width - 0.5) * 18;
    setTilt({ rx, ry });
  }, []);

  // 카드마다 한 번만 랜덤 모자이크 생성
  const mosaic = useMemo(
    () =>
      Array.from(
        { length: 100 },
        () =>
          product.palette[Math.floor(Math.random() * product.palette.length)],
      ),
    [product.palette],
  );

  return (
    <div
      style={{
        flex: "1 1 280px",
        maxWidth: 320,
        perspective: "900px",
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? "translateY(0)" : "translateY(50px)",
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${index * 0.15}s,
                   transform 0.7s cubic-bezier(.22,1,.36,1) ${index * 0.15}s`,
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setTilt({ rx: 0, ry: 0 });
          setHovered(false);
        }}
        style={{
          background: T.creamDark,
          border: `1px solid ${hovered ? T.warm : T.sand}`,
          borderRadius: 20,
          padding: 24,
          cursor: "pointer",
          position: "relative",
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: hovered
            ? "transform 0.08s linear, border-color 0.2s, box-shadow 0.2s"
            : "transform 0.6s cubic-bezier(.22,1,.36,1), border-color 0.2s, box-shadow 0.2s",
          transformStyle: "preserve-3d",
          boxShadow: hovered
            ? `0 24px 60px rgba(20,18,16,0.12), ${-tilt.ry * 0.3}px ${tilt.rx * 0.3}px 20px rgba(184,92,56,0.08)`
            : "0 4px 20px rgba(20,18,16,0.06)",
        }}
      >
        {/* 배지 */}
        {product.badge && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: T.accent,
              color: T.cream,
              fontSize: 10,
              letterSpacing: "0.15em",
              padding: "3px 8px",
              borderRadius: 99,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {product.badge}
          </div>
        )}

        {/* 바이닐 + 커버 */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          {/* 바이닐 디스크 */}
          <div
            style={{
              position: "absolute",
              top: "5%",
              right: "-10%",
              width: "70%",
              aspectRatio: "1",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #2a2218 15%, #1a1210 30%, #141210 55%, #0d0d0a 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              animation: hovered ? "vinylSpin 4s linear infinite" : "none",
              zIndex: 0,
            }}
          >
            {/* 레이블 중심 */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: "22%",
                aspectRatio: "1",
                borderRadius: "50%",
                background: product.palette[0],
              }}
            />
          </div>

          {/* 커버 픽셀 모자이크 */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "75%",
              borderRadius: 4,
              overflow: "hidden",
              transform: hovered ? "translateY(-6px)" : "translateY(0)",
              transition:
                "transform 0.4s cubic-bezier(.22,1,.36,1), box-shadow 0.4s",
              boxShadow: hovered
                ? "8px 12px 32px rgba(20,18,16,0.22)"
                : "4px 6px 16px rgba(20,18,16,0.14)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: "1px",
                background: T.inkGhost,
              }}
            >
              {mosaic.map((color, i) => (
                <div
                  key={i}
                  style={{
                    background: color,
                    aspectRatio: "1",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 카드 하단 */}
        <div style={{ borderTop: `1px solid ${T.sand}`, paddingTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: T.inkSubtle,
              fontFamily: "'DM Mono', monospace",
              marginBottom: 6,
            }}
          >
            {product.artist} · {product.size}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontFamily: "'DM Serif Display', Georgia, serif",
                letterSpacing: -0.3,
                color: T.ink,
              }}
            >
              {product.title}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                fontFamily: "'DM Mono', monospace",
                color: T.accent,
              }}
            >
              {product.price}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <button
          style={{
            marginTop: 14,
            width: "100%",
            padding: "12px 0",
            background: T.ink,
            color: T.cream,
            border: "none",
            borderRadius: 12,
            fontSize: 12,
            letterSpacing: "0.06em",
            fontFamily: "'DM Mono', monospace",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#2a2520")}
          onMouseLeave={(e) => (e.target.style.background = T.ink)}
        >
          Customize this →
        </button>
      </div>
    </div>
  );
}

export default function ProductShowcaseSection() {
  const [sRef, sVis] = useInView(0.08);

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
      {/* 배경 스터드 패턴 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, ${T.ink} 1.2px, transparent 1.2px)`,
          backgroundSize: "24px 24px",
          opacity: 0.018,
        }}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
        {/* 헤더 */}
        <div
          style={{
            marginBottom: 72,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 24,
            opacity: sVis ? 1 : 0,
            transform: sVis ? "translateY(0)" : "translateY(28px)",
            transition:
              "opacity 0.75s cubic-bezier(.22,1,.36,1), transform 0.75s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <div>
            {/* 스터드 장식 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {Array.from({ length: 4 }).map((_, i) => (
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

            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.inkSubtle,
              }}
            >
              Featured mosaics
            </span>

            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                fontFamily: "'DM Serif Display', Georgia, serif",
                lineHeight: 1.08,
                margin: "14px 0 0",
                color: T.ink,
              }}
            >
              Iconic albums,
              <br />
              <em style={{ color: T.accent }}>pixel-perfect.</em>
            </h2>
          </div>

          <a
            href="/custom"
            style={{
              padding: "13px 22px",
              background: "rgba(255,255,255,0.4)",
              border: `1px solid ${T.inkGhost}`,
              borderRadius: 12,
              color: T.ink,
              fontSize: 13,
              letterSpacing: "0.06em",
              fontFamily: "'DM Mono', monospace",
              textDecoration: "none",
              backdropFilter: "blur(6px)",
              transition: "background 0.2s",
              alignSelf: "flex-end",
            }}
          >
            View all designs
          </a>
        </div>

        {/* 카드 3개 */}
        <div
          style={{
            display: "flex",
            gap: "clamp(16px, 3vw, 32px)",
            flexWrap: "wrap",
          }}
        >
          {PRODUCTS.map((p, i) => (
            <ProductCard key={i} product={p} index={i} parentVisible={sVis} />
          ))}
        </div>
      </div>

      {/* 바이닐 스핀 애니메이션 */}
      <style>{`@keyframes vinylSpin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
