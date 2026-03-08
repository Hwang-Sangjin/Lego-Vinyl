import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

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
  "#898788",
  "#A19E9F",
  "#FFFFFF",
  "#352100",
  "#583927",
  "#7d3d28",
  "#92804b",
  "#CE9E6F",
  "#DFCFAE",
  "#F6D7B3",
  "#720E0F",
  "#C9006B",
  "#7d4f4f",
  "#DF0101",
  "#D45472",
  "#DF6695",
  "#FF6E6E",
  "#FF9ECE",
  "#FECCCF",
  "#A95500",
  "#96781c",
  "#DC851E",
  "#F8BB3D",
  "#F6D01D",
  "#F5CD30",
  "#C8F94C",
  "#184632",
  "#00852B",
  "#677430",
  "#4B9F4A",
  "#789F90",
  "#C2DAB8",
  "#d0f1ec",
  "#0A3463",
  "#008590",
  "#0057A6",
  "#078BC9",
  "#6A739C",
  "#54A9C8",
  "#8C71CB",
  "#88C4DC",
  "#9391E4",
  "#c3d2e0",
  "#81007B",
  "#6C3082",
  "#A4659A",
  "#CDA4DE",
];

const LEGO_COLOR_NAMES = {
  "#000000": "Black",
  "#3E3C39": "Pearl Dark Grey",
  "#6D6E6C": "Dark Bluish Grey",
  "#898788": "Flat Silver",
  "#A19E9F": "Light Grey",
  "#FFFFFF": "White",
  "#352100": "Dark Brown",
  "#583927": "Brown",
  "#7d3d28": "Reddish Brown",
  "#92804b": "Dark Tan",
  "#CE9E6F": "Nougat",
  "#DFCFAE": "Tan",
  "#F6D7B3": "Light Nougat",
  "#720E0F": "Dark Red",
  "#C9006B": "Magenta",
  "#7d4f4f": "Sand Red",
  "#DF0101": "Red",
  "#D45472": "Dark Pink",
  "#DF6695": "Medium Dark Pink",
  "#FF6E6E": "Coral",
  "#FF9ECE": "Pink",
  "#FECCCF": "Light Pink",
  "#A95500": "Dark Orange",
  "#96781c": "Pearl Gold",
  "#DC851E": "Orange",
  "#F8BB3D": "Bright Light Orange",
  "#F6D01D": "Bright Light Yellow",
  "#F5CD30": "Yellow",
  "#C8F94C": "Yellowish Green",
  "#184632": "Dark Green",
  "#00852B": "Green",
  "#677430": "Olive Green",
  "#4B9F4A": "Bright Green",
  "#789F90": "Sand Green",
  "#C2DAB8": "Light Green",
  "#d0f1ec": "Light Aqua",
  "#0A3463": "Dark Blue",
  "#008590": "Dark Turquoise",
  "#0057A6": "Blue",
  "#078BC9": "Dark Azure",
  "#6A739C": "Sand Blue",
  "#54A9C8": "Maersk Blue",
  "#8C71CB": "Medium Lavender",
  "#88C4DC": "Bright Light Blue",
  "#9391E4": "Medium Violet",
  "#c3d2e0": "Light Bluish Grey",
  "#81007B": "Purple",
  "#6C3082": "Dark Purple",
  "#A4659A": "Sand Purple",
  "#CDA4DE": "Lavender",
};

/* ── 유틸 ── */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function nearestLegoColor(r, g, b) {
  // sRGB → CIE Lab 변환
  function rgbToLab(r, g, b) {
    // 1. sRGB → linear
    const lin = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const rl = lin(r),
      gl = lin(g),
      bl = lin(b);

    // 2. linear RGB → XYZ (D65 illuminant)
    const X = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
    const Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
    const Z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;

    // 3. XYZ → Lab
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const L = 116 * f(Y / 1.0) - 16;
    const A = 500 * (f(X / 0.9505) - f(Y / 1.0));
    const B = 200 * (f(Y / 1.0) - f(Z / 1.089));
    return [L, A, B];
  }

  const [L1, A1, B1] = rgbToLab(r, g, b);
  let minDist = Infinity;
  let nearest = LEGO_COLORS[0];

  for (const hex of LEGO_COLORS) {
    const c = hexToRgb(hex);
    const [L2, A2, B2] = rgbToLab(c.r, c.g, c.b);
    const dist = (L1 - L2) ** 2 + (A1 - A2) ** 2 + (B1 - B2) ** 2;
    if (dist < minDist) {
      minDist = dist;
      nearest = hex;
    }
  }
  return nearest;
}

function pixelateFromCrop(imgEl, cropPx) {
  const SIZE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(
    imgEl,
    cropPx.x,
    cropPx.y,
    cropPx.size,
    cropPx.size,
    0,
    0,
    SIZE,
    SIZE,
  );
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  return Array.from({ length: SIZE * SIZE }, (_, i) =>
    nearestLegoColor(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]),
  );
}

function countColors(pixels) {
  const map = {};
  for (const hex of pixels) map[hex] = (map[hex] || 0) + 1;
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

/* ══════════════════════════════════
   ImageCropper
══════════════════════════════════ */
const MIN_CROP = 60;

function ImageCropper({ imageUrl, naturalSize, onApply }) {
  const containerRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState(null);
  const dragState = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setDisplaySize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!displaySize.w || !displaySize.h) return;
    const side = Math.min(displaySize.w, displaySize.h) * 0.65;
    setCrop({
      x: (displaySize.w - side) / 2,
      y: (displaySize.h - side) / 2,
      size: side,
    });
  }, [displaySize.w, displaySize.h]);

  function toNaturalCrop(c) {
    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    const scale = Math.max(scaleX, scaleY);
    const renderedW = naturalSize.w / scale;
    const renderedH = naturalSize.h / scale;
    const offsetX = (displaySize.w - renderedW) / 2;
    const offsetY = (displaySize.h - renderedH) / 2;
    const nx = (c.x - offsetX) * scale;
    const ny = (c.y - offsetY) * scale;
    const ns = c.size * scale;
    return {
      x: Math.max(0, Math.round(nx)),
      y: Math.max(0, Math.round(ny)),
      size: Math.round(
        Math.min(
          ns,
          naturalSize.w - Math.max(0, nx),
          naturalSize.h - Math.max(0, ny),
        ),
      ),
    };
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const getXY = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onPointerDown = useCallback(
    (e, mode, handleDir) => {
      e.preventDefault();
      e.stopPropagation();
      const pt = getXY(e);
      dragState.current = {
        mode,
        handleDir,
        startPt: pt,
        startCrop: { ...crop },
      };

      const onMove = (ev) => {
        if (!dragState.current) return;
        const pt2 = getXY(ev);
        const dx = pt2.x - dragState.current.startPt.x;
        const dy = pt2.y - dragState.current.startPt.y;
        const sc = dragState.current.startCrop;
        const W = displaySize.w;
        const H = displaySize.h;

        if (dragState.current.mode === "move") {
          setCrop({
            x: clamp(sc.x + dx, 0, W - sc.size),
            y: clamp(sc.y + dy, 0, H - sc.size),
            size: sc.size,
          });
        } else if (dragState.current.mode === "resize") {
          const dir = dragState.current.handleDir;
          let delta =
            dir === "se"
              ? Math.max(dx, dy)
              : dir === "sw"
                ? Math.max(-dx, dy)
                : dir === "ne"
                  ? Math.max(dx, -dy)
                  : Math.max(-dx, -dy);
          const newSize = clamp(sc.size + delta, MIN_CROP, Math.min(W, H));
          let nx = sc.x,
            ny = sc.y;
          if (dir === "sw" || dir === "nw") nx = sc.x + sc.size - newSize;
          if (dir === "ne" || dir === "nw") ny = sc.y + sc.size - newSize;
          setCrop({
            x: clamp(nx, 0, W - newSize),
            y: clamp(ny, 0, H - newSize),
            size: newSize,
          });
        } else if (dragState.current.mode === "new") {
          const raw = Math.min(Math.abs(dx), Math.abs(dy), W, H);
          const size = Math.max(MIN_CROP, raw);
          setCrop({
            x: clamp(dx >= 0 ? sc.x : sc.x - size, 0, W - size),
            y: clamp(dy >= 0 ? sc.y : sc.y - size, 0, H - size),
            size,
          });
        }
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    },
    [crop, displaySize],
  );

  const handles = crop
    ? [
        { dir: "nw", cx: crop.x, cy: crop.y },
        { dir: "ne", cx: crop.x + crop.size, cy: crop.y },
        { dir: "sw", cx: crop.x, cy: crop.y + crop.size },
        { dir: "se", cx: crop.x + crop.size, cy: crop.y + crop.size },
      ]
    : [];

  const HANDLE_R = 8;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (dragState.current) return;
          const pt = getXY(e);
          if (
            crop &&
            pt.x >= crop.x &&
            pt.x <= crop.x + crop.size &&
            pt.y >= crop.y &&
            pt.y <= crop.y + crop.size
          ) {
            onPointerDown(e, "move", null);
          } else {
            setCrop({ x: pt.x, y: pt.y, size: MIN_CROP });
            onPointerDown(e, "new", null);
          }
        }}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${T.sand}`,
          cursor: "crosshair",
          background: T.ink /* 이미지 바깥 영역 */,
          userSelect: "none",
        }}
      >
        <img
          src={imageUrl}
          alt="crop source"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {crop && (
          <>
            {/* 오버레이 4방향 */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: crop.y,
                background: "rgba(20,18,16,0.6)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: crop.y + crop.size,
                width: "100%",
                height: `calc(100% - ${crop.y + crop.size}px)`,
                background: "rgba(20,18,16,0.6)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: crop.y,
                width: crop.x,
                height: crop.size,
                background: "rgba(20,18,16,0.6)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: crop.x + crop.size,
                top: crop.y,
                width: `calc(100% - ${crop.x + crop.size}px)`,
                height: crop.size,
                background: "rgba(20,18,16,0.6)",
                pointerEvents: "none",
              }}
            />

            {/* 크롭 박스 */}
            <div
              style={{
                position: "absolute",
                left: crop.x,
                top: crop.y,
                width: crop.size,
                height: crop.size,
                border: `2px solid ${T.accent}`,
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            >
              {/* 룰 오브 서드 */}
              {[1 / 3, 2 / 3].map((r) => (
                <React.Fragment key={r}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${r * 100}%`,
                      top: 0,
                      width: 1,
                      height: "100%",
                      background: "rgba(255,255,255,0.2)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: `${r * 100}%`,
                      left: 0,
                      height: 1,
                      width: "100%",
                      background: "rgba(255,255,255,0.2)",
                      pointerEvents: "none",
                    }}
                  />
                </React.Fragment>
              ))}
              {/* 모서리 장식 */}
              {[
                { top: 0, left: 0 },
                { top: 0, right: 0 },
                { bottom: 0, left: 0 },
                { bottom: 0, right: 0 },
              ].map((pos, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    ...pos,
                    width: 12,
                    height: 12,
                    borderTop: i < 2 ? `3px solid ${T.accent}` : "none",
                    borderBottom: i >= 2 ? `3px solid ${T.accent}` : "none",
                    borderLeft:
                      i === 0 || i === 2 ? `3px solid ${T.accent}` : "none",
                    borderRight:
                      i === 1 || i === 3 ? `3px solid ${T.accent}` : "none",
                    pointerEvents: "none",
                  }}
                />
              ))}
            </div>

            {/* 핸들 */}
            {handles.map(({ dir, cx, cy }) => (
              <div
                key={dir}
                onMouseDown={(e) => onPointerDown(e, "resize", dir)}
                style={{
                  position: "absolute",
                  left: cx - HANDLE_R,
                  top: cy - HANDLE_R,
                  width: HANDLE_R * 2,
                  height: HANDLE_R * 2,
                  borderRadius: "50%",
                  background: T.accent,
                  border: "2.5px solid #fff",
                  cursor:
                    dir === "nw" || dir === "se"
                      ? "nwse-resize"
                      : "nesw-resize",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.25)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              />
            ))}
          </>
        )}
      </div>

      {/* 크롭 사이즈 표시 */}
      {crop && (
        <div
          style={{
            fontSize: 11,
            color: T.inkSubtle,
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          {Math.round(crop.size)} × {Math.round(crop.size)} px 선택됨
        </div>
      )}

      {/* Apply 버튼 */}
      <button
        onClick={() => crop && onApply(toNaturalCrop(crop))}
        disabled={!crop}
        style={{
          width: "100%",
          padding: "14px 0",
          background: T.ink,
          color: T.cream,
          border: "none",
          borderRadius: 12,
          fontSize: 13,
          letterSpacing: "0.08em",
          fontFamily: "'DM Mono', monospace",
          cursor: "pointer",
          transition: "background 0.2s, transform 0.15s",
          boxShadow: "0 4px 16px rgba(20,18,16,0.12)",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "#2a2520";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = T.ink;
          e.target.style.transform = "translateY(0)";
        }}
      >
        Apply Crop & Pixelate →
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   CustomPage (메인 export)
══════════════════════════════════ */
export default function CustomPage() {
  const fileRef = useRef(null);
  const imgRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [pixels, setPixels] = useState(null);
  const [dragging, setDragging] = useState(false);

  const colorCounts = useMemo(
    () => (pixels ? countColors(pixels) : []),
    [pixels],
  );

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPixels(null);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;
    };
    img.src = url;
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleApply(cropPx) {
    if (!imgRef.current) return;
    setPixels(pixelateFromCrop(imgRef.current, cropPx));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.cream,
        fontFamily: "'DM Mono', monospace",
        color: T.ink,
      }}
    >
      {/* ── 페이지 헤더 ── */}
      <div
        style={{
          padding: "56px 6vw 40px",
          borderBottom: `1px solid ${T.inkGhost}`,
          position: "relative",
          overflow: "hidden",
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
            opacity: 0.025,
          }}
        />

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
          {/* 스터드 장식 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i < 2 ? T.accent : T.sand,
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
            Customize
          </span>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.05,
              margin: "10px 0 12px",
              letterSpacing: -0.5,
            }}
          >
            Build your mosaic.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: T.inkLight,
              margin: 0,
              lineHeight: 1.8,
              maxWidth: 520,
            }}
          >
            이미지를 업로드하고 원하는 영역을 크롭하세요.
            <br />
            실제 레고 색상 {LEGO_COLORS.length}가지로 32×32 브릭 모자이크가
            완성됩니다.
          </p>
        </div>
      </div>

      {/* ── 본문 2열 ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 6vw 80px",
          display: "flex",
          gap: "clamp(24px, 4vw, 56px)",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* ── 왼쪽: 업로드 + 크롭 ── */}
        <div style={{ flex: "1 1 380px", minWidth: 0 }}>
          {/* 라벨 + 새 이미지 버튼 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: T.inkSubtle,
              }}
            >
              {imageUrl ? "Crop Image" : "Upload Image"}
            </span>
            {imageUrl && (
              <button
                onClick={() => {
                  setImageUrl(null);
                  setPixels(null);
                  setNaturalSize(null);
                }}
                style={{
                  background: "none",
                  border: `1px solid ${T.sand}`,
                  borderRadius: 8,
                  padding: "5px 14px",
                  fontSize: 11,
                  color: T.inkSubtle,
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = T.accent;
                  e.target.style.color = T.accent;
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = T.sand;
                  e.target.style.color = T.inkSubtle;
                }}
              >
                ✕ 새 이미지
              </button>
            )}
          </div>

          {!imageUrl ? (
            /* 업로드 존 */
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? T.accent : T.sand}`,
                borderRadius: 16,
                padding: "80px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? T.creamDark : "transparent",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {/* 레고 블록 아이콘 느낌 */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "inline-grid",
                    gridTemplateColumns: "repeat(3, 20px)",
                    gap: 3,
                    opacity: dragging ? 1 : 0.4,
                    transition: "opacity 0.2s",
                  }}
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 20,
                        height: 20,
                        background: [T.accent, T.warm, T.sand][i % 3],
                        borderRadius: 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: T.inkLight,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {dragging
                  ? "놓아서 업로드"
                  : "클릭하거나 드래그해서 이미지 업로드"}
              </div>
              <div style={{ fontSize: 12, color: T.inkSubtle }}>
                JPG · PNG · WEBP
              </div>
            </div>
          ) : (
            /* 크롭 UI */
            naturalSize && (
              <ImageCropper
                imageUrl={imageUrl}
                naturalSize={naturalSize}
                onApply={handleApply}
              />
            )
          )}

          {/* ── 픽셀 결과 ── */}
          {pixels && (
            <div style={{ marginTop: 40 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: T.inkSubtle,
                  }}
                >
                  32 × 32 Preview
                </span>
                <span style={{ fontSize: 12, color: T.inkSubtle }}>
                  <span style={{ color: T.accent, fontWeight: 500 }}>
                    {colorCounts.length}가지
                  </span>{" "}
                  색상 · 1,024개 브릭
                </span>
              </div>

              <div
                style={{
                  background: T.creamDark,
                  padding: 14,
                  borderRadius: 16,
                  border: `1px solid ${T.sand}`,
                  boxShadow: "0 8px 40px rgba(20,18,16,0.09)",
                  display: "inline-block",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(32, 1fr)",
                    gap: "1.5px",
                    width: "min(420px, 70vw)",
                    aspectRatio: "1",
                    background: T.sand,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {pixels.map((color, i) => (
                    <div
                      key={i}
                      style={{
                        background: color,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 색상 패널 ── */}
        <div
          style={{
            flex: "0 0 320px",
            background: T.creamDark,
            border: `1px solid ${T.sand}`,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 4px 24px rgba(20,18,16,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: T.inkSubtle,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: `1px solid ${T.sand}`,
            }}
          >
            {pixels
              ? `사용된 색상 — ${colorCounts.length}가지`
              : `레고 팔레트 — ${LEGO_COLORS.length}가지`}
          </div>

          {pixels ? (
            /* 사용된 색상 */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: "60vh",
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {colorCounts.map(([hex, count], idx) => (
                <div
                  key={hex}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    background: T.cream,
                    border: `1px solid ${T.sand}`,
                    borderRadius: 10,
                    opacity: 0,
                    animation: `fadeUp 0.4s cubic-bezier(.22,1,.36,1) ${idx * 25}ms forwards`,
                  }}
                >
                  {/* 스터드 스와치 */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: hex,
                      borderRadius: 6,
                      flexShrink: 0,
                      boxShadow:
                        "inset 0 2px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.14)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-58%)",
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: hex,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.35), 0 1.5px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: T.ink,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {LEGO_COLOR_NAMES[hex] ?? hex}
                    </div>
                    <div
                      style={{ fontSize: 10, color: T.inkSubtle, marginTop: 1 }}
                    >
                      {hex.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 300,
                        color: T.accent,
                        lineHeight: 1,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {count}
                    </div>
                    <div style={{ fontSize: 10, color: T.inkSubtle }}>
                      {((count / 1024) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 전체 팔레트 */
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                {LEGO_COLORS.map((hex) => (
                  <div
                    key={hex}
                    title={LEGO_COLOR_NAMES[hex]}
                    style={{
                      width: 26,
                      height: 26,
                      background: hex,
                      borderRadius: 5,
                      border: "1px solid rgba(0,0,0,0.07)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                      cursor: "default",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "scale(1.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "scale(1)")
                    }
                  />
                ))}
              </div>
              <div
                style={{ fontSize: 12, color: T.inkSubtle, lineHeight: 1.8 }}
              >
                이미지를 업로드하면 각 색상이
                <br />몇 개의 브릭으로 사용되는지 확인할 수 있어요.
              </div>
            </>
          )}
        </div>
      </div>

      {/* 애니메이션 */}
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
