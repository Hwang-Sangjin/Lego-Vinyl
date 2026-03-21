import React, { useState, useRef, useEffect, useMemo } from "react";

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

const LEGO_COLORS = [
  "#000000",
  "#3E3C39",
  "#6D6E6C",
  "#FFFFFF",
  "#DF0101",
  "#F5CD30",
  "#00852B",
  "#0057A6",
  "#C9006B",
  "#DC851E",
  "#6C3082",
  "#583927",
  "#CE9E6F",
  "#88C4DC",
  "#4B9F4A",
  "#A95500",
  "#720E0F",
  "#F8BB3D",
];

// 32×32 픽셀 아트 데이터를 생성하는 함수 (샘플 상품용)
function generatePixelArt(seed, palette) {
  const rng = (n) => {
    let x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return Array.from({ length: 32 * 32 }, (_, i) => {
    const row = Math.floor(i / 32);
    const col = i % 32;
    // 대칭 패턴 (좌우 미러)
    const mirrorCol = col < 16 ? col : 31 - col;
    const idx = Math.floor(rng(row * 16 + mirrorCol) * palette.length);
    return palette[idx];
  });
}

// 샘플 앨범 팔레트 목록
const ALBUM_PALETTES = [
  {
    name: "Dark Side",
    colors: ["#000000", "#3E3C39", "#DF0101", "#F5CD30", "#FFFFFF"],
  },
  {
    name: "Ocean Blue",
    colors: ["#0A3463", "#0057A6", "#54A9C8", "#88C4DC", "#FFFFFF"],
  },
  {
    name: "Forest",
    colors: ["#184632", "#00852B", "#4B9F4A", "#C2DAB8", "#F5CD30"],
  },
  {
    name: "Retro Pink",
    colors: ["#720E0F", "#C9006B", "#D45472", "#FF9ECE", "#FECCCF"],
  },
  {
    name: "Desert",
    colors: ["#352100", "#583927", "#A95500", "#DC851E", "#F8BB3D"],
  },
  {
    name: "Violet",
    colors: ["#6C3082", "#81007B", "#A4659A", "#CDA4DE", "#FFFFFF"],
  },
];

const PRODUCTS = [
  {
    id: 1,
    title: "Dark Side of the Brick",
    artist: "Pink Floyd",
    price: 89000,
    palette: ALBUM_PALETTES[0],
    seed: 42,
    badge: "BESTSELLER",
  },
  {
    id: 2,
    title: "Ocean Waves",
    artist: "Various Artists",
    price: 89000,
    palette: ALBUM_PALETTES[1],
    seed: 17,
    badge: null,
  },
  {
    id: 3,
    title: "Forest Floor",
    artist: "Ambient Collective",
    price: 89000,
    palette: ALBUM_PALETTES[2],
    seed: 99,
    badge: "NEW",
  },
  {
    id: 4,
    title: "Retro Romance",
    artist: "Neon Dreamer",
    price: 89000,
    palette: ALBUM_PALETTES[3],
    seed: 55,
    badge: null,
  },
  {
    id: 5,
    title: "Desert Sand",
    artist: "Dune Sessions",
    price: 89000,
    palette: ALBUM_PALETTES[4],
    seed: 73,
    badge: null,
  },
  {
    id: 6,
    title: "Violet Dreams",
    artist: "Purple Haze",
    price: 89000,
    palette: ALBUM_PALETTES[5],
    seed: 28,
    badge: "NEW",
  },
];

/* ══════════════════════════════════
   MiniPixelGrid — 32×32 인터랙티브 픽셀 프리뷰
══════════════════════════════════ */
function MiniPixelGrid({ pixels, size = 128, interactive = false }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixels) return;
    const ctx = canvas.getContext("2d");
    const cellSize = size / 32;
    pixels.forEach((color, i) => {
      const row = Math.floor(i / 32);
      const col = i % 32;
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    });
  }, [pixels, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        borderRadius: 8,
        transition: "transform 0.4s cubic-bezier(.22,1,.36,1), box-shadow 0.4s",
        transform:
          hovered && interactive
            ? "scale(1.06) rotate(-1deg)"
            : "scale(1) rotate(0deg)",
        boxShadow:
          hovered && interactive
            ? "0 20px 48px rgba(20,18,16,0.22), 0 4px 12px rgba(184,92,56,0.18)"
            : "0 4px 16px rgba(20,18,16,0.12)",
        cursor: interactive ? "pointer" : "default",
      }}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
    />
  );
}

/* ══════════════════════════════════
   ProductCard
══════════════════════════════════ */
function ProductCard({ product, onSelect, isSelected }) {
  const pixels = useMemo(
    () => generatePixelArt(product.seed, product.palette.colors),
    [product.seed, product.palette.colors],
  );
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.cream,
        border: `1.5px solid ${isSelected ? T.accent : hovered ? T.warm : T.sand}`,
        borderRadius: 20,
        padding: 20,
        cursor: "pointer",
        transition:
          "border-color 0.2s, transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 16px 40px rgba(20,18,16,0.12)"
          : "0 2px 12px rgba(20,18,16,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {product.badge && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: product.badge === "NEW" ? T.ink : T.accent,
            color: T.cream,
            fontSize: 9,
            letterSpacing: "0.12em",
            padding: "3px 8px",
            borderRadius: 20,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          {product.badge}
        </div>
      )}

      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
      >
        <MiniPixelGrid pixels={pixels} size={160} interactive />
      </div>

      {/* 팔레트 도트 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {product.palette.colors.map((c, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: c,
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 12,
          color: T.inkSubtle,
          marginBottom: 4,
          letterSpacing: "0.06em",
        }}
      >
        {product.artist}
      </div>
      <div
        style={{
          fontSize: 15,
          fontFamily: "'DM Serif Display', Georgia, serif",
          color: T.ink,
          marginBottom: 12,
          lineHeight: 1.3,
        }}
      >
        {product.title}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: T.accent,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ₩{product.price.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: 10,
            color: T.inkSubtle,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          32 × 32 · 1,024 Bricks
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   ProductModal — 상품 상세 팝업
══════════════════════════════════ */
function ProductModal({ product, onClose }) {
  const pixels = useMemo(
    () => generatePixelArt(product.seed, product.palette.colors),
    [product.seed, product.palette.colors],
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAdd() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,18,16,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.cream,
          borderRadius: 24,
          padding: "clamp(24px, 4vw, 40px)",
          maxWidth: 640,
          width: "100%",
          boxShadow: "0 32px 80px rgba(20,18,16,0.24)",
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          position: "relative",
          animation: "slideUp 0.3s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: `1px solid ${T.sand}`,
            borderRadius: 8,
            width: 32,
            height: 32,
            cursor: "pointer",
            fontSize: 14,
            color: T.inkSubtle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Mono', monospace",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.color = T.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.sand;
            e.currentTarget.style.color = T.inkSubtle;
          }}
        >
          ✕
        </button>

        {/* 왼쪽: 픽셀 아트 */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          <MiniPixelGrid pixels={pixels} size={200} />
          {/* 레고 브릭 스타일 프레임 힌트 */}
          <div
            style={{
              background: T.creamDark,
              border: `1px solid ${T.sand}`,
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 10,
              color: T.inkSubtle,
              letterSpacing: "0.1em",
              textAlign: "center",
            }}
          >
            32 × 32 · 1,024 BRICKS
          </div>
        </div>

        {/* 오른쪽: 상품 정보 */}
        <div
          style={{
            flex: "1 1 200px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: T.inkSubtle,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {product.artist}
            </div>
            <h2
              style={{
                fontSize: "clamp(20px, 3vw, 26px)",
                fontFamily: "'DM Serif Display', Georgia, serif",
                lineHeight: 1.15,
                margin: 0,
                color: T.ink,
              }}
            >
              {product.title}
            </h2>
          </div>

          {/* 팔레트 */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: T.inkSubtle,
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              COLOR PALETTE
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {product.palette.colors.map((c, i) => (
                <div
                  key={i}
                  title={c}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: c,
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow:
                      "inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.12)",
                    transition: "transform 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.25)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              ))}
            </div>
          </div>

          {/* 스펙 */}
          <div
            style={{
              background: T.creamDark,
              border: `1px solid ${T.sand}`,
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              ["Size", "32 × 32 studs"],
              ["Bricks", "1,024 pieces"],
              ["Material", "ABS Plastic"],
              ["Frame", "Included"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: T.inkSubtle }}>{label}</span>
                <span style={{ color: T.ink, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* 수량 + 가격 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                border: `1px solid ${T.sand}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {[-1, null, +1].map((delta, i) =>
                delta === null ? (
                  <div
                    key="val"
                    style={{
                      width: 40,
                      textAlign: "center",
                      fontSize: 14,
                      fontFamily: "'DM Mono', monospace",
                      color: T.ink,
                      borderLeft: `1px solid ${T.sand}`,
                      borderRight: `1px solid ${T.sand}`,
                      padding: "6px 0",
                    }}
                  >
                    {qty}
                  </div>
                ) : (
                  <button
                    key={delta}
                    onClick={() => setQty((q) => Math.max(1, q + delta))}
                    style={{
                      background: "none",
                      border: "none",
                      width: 36,
                      height: 34,
                      cursor: "pointer",
                      fontSize: 16,
                      color: T.inkLight,
                      fontFamily: "'DM Mono', monospace",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.creamDark)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    {delta > 0 ? "+" : "−"}
                  </button>
                ),
              )}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: T.accent,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ₩{(product.price * qty).toLocaleString()}
            </div>
          </div>

          {/* 버튼들 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handleAdd}
              style={{
                width: "100%",
                padding: "14px 0",
                background: added ? "#3d6b47" : T.ink,
                color: T.cream,
                border: "none",
                borderRadius: 12,
                fontSize: 13,
                letterSpacing: "0.08em",
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
                transition: "background 0.3s, transform 0.15s",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) =>
                !added && (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {added ? "✓ Added to Cart" : "Add to Cart"}
            </button>
            <button
              style={{
                width: "100%",
                padding: "12px 0",
                background: "none",
                color: T.accent,
                border: `1px solid ${T.accent}`,
                borderRadius: 12,
                fontSize: 13,
                letterSpacing: "0.08em",
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.accent;
                e.currentTarget.style.color = T.cream;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = T.accent;
              }}
            >
              Customize This →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   ShopPage (main)
══════════════════════════════════ */
export default function ShopPage() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [cartCount, setCartCount] = useState(0);

  const filters = ["ALL", "BESTSELLER", "NEW"];
  const filtered =
    filter === "ALL" ? PRODUCTS : PRODUCTS.filter((p) => p.badge === filter);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.cream,
        fontFamily: "'DM Mono', monospace",
        color: T.ink,
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "56px 6vw 40px",
          borderBottom: `1px solid ${T.inkGhost}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
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
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i < 3 ? T.accent : T.sand,
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
            Shop
          </span>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "clamp(36px,5vw,60px)",
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  lineHeight: 1.05,
                  margin: "10px 0 12px",
                  letterSpacing: -0.5,
                }}
              >
                Pick your sound.
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: T.inkLight,
                  margin: 0,
                  lineHeight: 1.8,
                  maxWidth: 480,
                }}
              >
                32×32 레고 브릭으로 제작된 바이닐 앨범 아트.
                <br />
                클릭해서 자세히 보거나, 직접 커스텀해보세요.
              </p>
            </div>

            {/* 장바구니 힌트 */}
            {cartCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: T.ink,
                  color: T.cream,
                  borderRadius: 14,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  boxShadow: "0 4px 16px rgba(20,18,16,0.18)",
                  animation: "fadeUp 0.3s ease",
                }}
              >
                <span style={{ fontSize: 16 }}>🧱</span>
                Cart ({cartCount})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 6vw 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? T.ink : "none",
                color: filter === f ? T.cream : T.inkSubtle,
                border: `1px solid ${filter === f ? T.ink : T.sand}`,
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 11,
                letterSpacing: "0.1em",
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: T.inkSubtle,
              alignSelf: "center",
            }}
          >
            {filtered.length}개 상품
          </span>
        </div>
      </div>

      {/* 상품 그리드 */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 6vw 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        {filtered.map((product, idx) => (
          <div
            key={product.id}
            style={{
              opacity: 0,
              animation: `fadeUp 0.45s cubic-bezier(.22,1,.36,1) ${idx * 60}ms forwards`,
            }}
          >
            <ProductCard
              product={product}
              onSelect={(p) => {
                setSelected(p);
              }}
              isSelected={selected?.id === product.id}
            />
          </div>
        ))}

        {/* 커스텀 CTA 카드 */}
        <div
          style={{
            opacity: 0,
            animation: `fadeUp 0.45s cubic-bezier(.22,1,.36,1) ${filtered.length * 60}ms forwards`,
          }}
        >
          <div
            style={{
              border: `2px dashed ${T.sand}`,
              borderRadius: 20,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              minHeight: 280,
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.accent;
              e.currentTarget.style.background = T.creamDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.sand;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                display: "inline-grid",
                gridTemplateColumns: "repeat(3, 20px)",
                gap: 3,
              }}
            >
              {[
                T.accent,
                T.warm,
                T.sand,
                T.warm,
                T.accent,
                T.sand,
                T.sand,
                T.warm,
                T.accent,
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 20,
                    height: 20,
                    background: c,
                    borderRadius: 3,
                    boxShadow:
                      "inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.12)",
                  }}
                />
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.ink,
                  marginBottom: 4,
                }}
              >
                나만의 디자인 만들기
              </div>
              <div
                style={{ fontSize: 11, color: T.inkSubtle, lineHeight: 1.6 }}
              >
                이미지를 업로드해서
                <br />
                커스텀 앨범 아트를 제작하세요
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: T.accent,
                letterSpacing: "0.1em",
                border: `1px solid ${T.accent}`,
                borderRadius: 8,
                padding: "6px 14px",
              }}
            >
              Customize →
            </div>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
