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

/* ══════════════════════════════════
   색상 유틸
══════════════════════════════════ */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToLab(r, g, b) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rl = lin(r),
    gl = lin(g),
    bl = lin(b);
  const X = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  const Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const Z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [
    116 * f(Y / 1.0) - 16,
    500 * (f(X / 0.9505) - f(Y / 1.0)),
    200 * (f(Y / 1.0) - f(Z / 1.089)),
  ];
}

function nearestLegoColor(r, g, b) {
  const [L1, A1, B1] = rgbToLab(r, g, b);
  let minDist = Infinity,
    nearest = LEGO_COLORS[0];
  for (const hex of LEGO_COLORS) {
    const c = hexToRgb(hex);
    const [L2, A2, B2] = rgbToLab(c.r, c.g, c.b);
    const d = (L1 - L2) ** 2 + (A1 - A2) ** 2 + (B1 - B2) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = hex;
    }
  }
  return nearest;
}

function countColors(hexArr) {
  const map = {};
  for (const h of hexArr) map[h] = (map[h] || 0) + 1;
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

/* ══════════════════════════════════
   Halftone 렌더러 (Canvas 2D)
══════════════════════════════════ */
function drawHalftone(canvas, imgEl, { mode, shape, cellSize, radius, angle }) {
  const SIZE = 512;
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  // 이미지 픽셀 데이터 추출
  const src = document.createElement("canvas");
  src.width = src.height = SIZE;
  const sctx = src.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(imgEl, 0, 0, SIZE, SIZE);
  const imgData = sctx.getImageData(0, 0, SIZE, SIZE).data;

  function sampleRgb(px, py) {
    const x = Math.max(0, Math.min(SIZE - 1, Math.round(px)));
    const y = Math.max(0, Math.min(SIZE - 1, Math.round(py)));
    const i = (y * SIZE + x) * 4;
    return { r: imgData[i], g: imgData[i + 1], b: imgData[i + 2] };
  }

  const maxR = cellSize * 0.5 * radius;

  // dot 그리기 (circle or stud)
  function drawDot(dc, cx, cy, r, color) {
    if (r < 0.5) return;
    // 메인 원
    dc.beginPath();
    dc.arc(cx, cy, r, 0, Math.PI * 2);
    dc.fillStyle = color;
    dc.fill();

    if (shape === "stud") {
      // 스터드 하이라이트 (왼쪽 상단)
      dc.beginPath();
      dc.arc(cx - r * 0.18, cy - r * 0.22, r * 0.42, 0, Math.PI * 2);
      dc.fillStyle = "rgba(255,255,255,0.22)";
      dc.fill();
      // 스터드 그림자 (오른쪽 하단)
      dc.beginPath();
      dc.arc(cx + r * 0.12, cy + r * 0.16, r * 0.36, 0, Math.PI * 2);
      dc.fillStyle = "rgba(0,0,0,0.13)";
      dc.fill();
    }
  }

  if (mode === "cmyk") {
    // ── CMYK 모드 ──
    // 배경 흰색
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 채널별 설정: 색상, 각도 오프셋, 채널 추출 함수
    const channels = [
      {
        key: "C",
        color: "rgba(0,183,235,0.82)",
        angleOffset: 15,
        extract: (r, g, b) => 1 - r / 255,
      },
      {
        key: "M",
        color: "rgba(236,0,140,0.82)",
        angleOffset: 75,
        extract: (r, g, b) => 1 - g / 255,
      },
      {
        key: "Y",
        color: "rgba(255,220,0,0.82)",
        angleOffset: 0,
        extract: (r, g, b) => 1 - b / 255,
      },
      {
        key: "K",
        color: "rgba(20,18,16,0.88)",
        angleOffset: 45,
        extract: (r, g, b) => 1 - Math.max(r, g, b) / 255,
      },
    ];

    // 각 채널을 별도 레이어에 그리고 multiply blend
    const blendCanvas = document.createElement("canvas");
    blendCanvas.width = blendCanvas.height = SIZE;
    const bctx = blendCanvas.getContext("2d");
    bctx.fillStyle = "#ffffff";
    bctx.fillRect(0, 0, SIZE, SIZE);

    for (const ch of channels) {
      const layerCanvas = document.createElement("canvas");
      layerCanvas.width = layerCanvas.height = SIZE;
      const lctx = layerCanvas.getContext("2d");

      const totalAngle = ((angle + ch.angleOffset) * Math.PI) / 180;
      const cosA = Math.cos(totalAngle);
      const sinA = Math.sin(totalAngle);
      const diag = Math.ceil(SIZE * 1.5);
      const step = cellSize;

      for (let row = -diag; row < diag; row += step) {
        for (let col = -diag; col < diag; col += step) {
          const cx = cosA * col - sinA * row + SIZE / 2;
          const cy = sinA * col + cosA * row + SIZE / 2;
          if (cx < -cellSize * 2 || cx > SIZE + cellSize * 2) continue;
          if (cy < -cellSize * 2 || cy > SIZE + cellSize * 2) continue;

          const { r, g, b } = sampleRgb(cx, cy);
          const density = ch.extract(r, g, b);
          const dotR = maxR * Math.sqrt(Math.max(0, density));
          drawDot(lctx, cx, cy, dotR, ch.color);
        }
      }

      bctx.globalCompositeOperation = "multiply";
      bctx.drawImage(layerCanvas, 0, 0);
    }

    ctx.drawImage(blendCanvas, 0, 0);
  } else {
    // ── LEGO 모드 ──
    // 크림 배경
    ctx.fillStyle = T.creamDark;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const cosA = Math.cos((angle * Math.PI) / 180);
    const sinA = Math.sin((angle * Math.PI) / 180);
    const diag = Math.ceil(SIZE * 1.5);
    const step = cellSize;

    const usedColors = [];

    for (let row = -diag; row < diag; row += step) {
      for (let col = -diag; col < diag; col += step) {
        const cx = cosA * col - sinA * row + SIZE / 2;
        const cy = sinA * col + cosA * row + SIZE / 2;
        if (cx < -cellSize * 2 || cx > SIZE + cellSize * 2) continue;
        if (cy < -cellSize * 2 || cy > SIZE + cellSize * 2) continue;

        const { r, g, b } = sampleRgb(cx, cy);
        const luma =
          0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
        const density = 1 - luma;
        const dotR = maxR * Math.pow(Math.max(0, density), 0.55);

        const legoHex = nearestLegoColor(r, g, b);
        usedColors.push(legoHex);
        drawDot(ctx, cx, cy, dotR, legoHex);
      }
    }

    canvas._usedLegoColors = usedColors;
  }
}

/* ══════════════════════════════════
   UploadZone
══════════════════════════════════ */
function getRandomColors() {
  return [...LEGO_COLORS].sort(() => Math.random() - 0.5).slice(0, 9);
}
const INIT_BLOCK_COLORS = [T.accent, T.warm, T.sand];

function UploadZone({ onFile }) {
  const fileRef = useRef(null);
  const intervalRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [blockColors, setBlockColors] = useState(
    Array.from({ length: 9 }, (_, i) => INIT_BLOCK_COLORS[i % 3]),
  );

  useEffect(() => {
    if (dragging) {
      setBlockColors(getRandomColors());
      intervalRef.current = setInterval(
        () => setBlockColors(getRandomColors()),
        350,
      );
    } else {
      clearInterval(intervalRef.current);
      setBlockColors(
        Array.from({ length: 9 }, (_, i) => INIT_BLOCK_COLORS[i % 3]),
      );
    }
    return () => clearInterval(intervalRef.current);
  }, [dragging]);

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}
      style={{
        border: `2px dashed ${dragging ? T.accent : T.sand}`,
        borderRadius: 16,
        padding: "72px 24px",
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
        onChange={(e) => {
          if (e.target.files[0]) onFile(e.target.files[0]);
        }}
        style={{ display: "none" }}
      />

      {/* 레고 블록 3×3 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "inline-grid",
            gridTemplateColumns: "repeat(3, 28px)",
            gap: 4,
          }}
        >
          {blockColors.map((color, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                background: color,
                borderRadius: 4,
                position: "relative",
                boxShadow:
                  "inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.12)",
                transition: "background 0.3s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -60%)",
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: color,
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.2)",
                  transition: "background 0.3s ease",
                }}
              />
            </div>
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
        {dragging ? "놓아서 업로드" : "클릭하거나 드래그해서 이미지 업로드"}
      </div>
      <div style={{ fontSize: 12, color: T.inkSubtle }}>JPG · PNG · WEBP</div>
    </div>
  );
}

/* ══════════════════════════════════
   ImageCropper
══════════════════════════════════ */
const MIN_CROP = 60;
const HANDLE_R = 8;

function ImageCropper({ imageUrl, naturalSize, onApply }) {
  const containerRef = useRef(null);
  const dragState = useRef(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState(null);

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
    const rW = naturalSize.w / scale;
    const rH = naturalSize.h / scale;
    const oX = (displaySize.w - rW) / 2;
    const oY = (displaySize.h - rH) / 2;
    const nx = (c.x - oX) * scale;
    const ny = (c.y - oY) * scale;
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
      dragState.current = {
        mode,
        handleDir,
        startPt: getXY(e),
        startCrop: { ...crop },
      };

      const onMove = (ev) => {
        if (!dragState.current) return;
        const {
          mode,
          handleDir: dir,
          startPt,
          startCrop: sc,
        } = dragState.current;
        const pt2 = getXY(ev);
        const dx = pt2.x - startPt.x;
        const dy = pt2.y - startPt.y;
        const W = displaySize.w,
          H = displaySize.h;

        if (mode === "move") {
          setCrop({
            x: clamp(sc.x + dx, 0, W - sc.size),
            y: clamp(sc.y + dy, 0, H - sc.size),
            size: sc.size,
          });
        } else if (mode === "resize") {
          const delta =
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
        } else if (mode === "new") {
          const size = Math.max(
            MIN_CROP,
            Math.min(Math.abs(dx), Math.abs(dy), W, H),
          );
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
          aspectRatio: "1",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${T.sand}`,
          cursor: "crosshair",
          background: T.ink,
          userSelect: "none",
        }}
      >
        <img
          src={imageUrl}
          alt="crop"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
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
              {/* L자 모서리 */}
              {[
                {
                  top: 0,
                  left: 0,
                  borderTop: `3px solid ${T.accent}`,
                  borderLeft: `3px solid ${T.accent}`,
                },
                {
                  top: 0,
                  right: 0,
                  borderTop: `3px solid ${T.accent}`,
                  borderRight: `3px solid ${T.accent}`,
                },
                {
                  bottom: 0,
                  left: 0,
                  borderBottom: `3px solid ${T.accent}`,
                  borderLeft: `3px solid ${T.accent}`,
                },
                {
                  bottom: 0,
                  right: 0,
                  borderBottom: `3px solid ${T.accent}`,
                  borderRight: `3px solid ${T.accent}`,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    pointerEvents: "none",
                    ...s,
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              />
            ))}
          </>
        )}
      </div>

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
    </div>
  );
}

/* ══════════════════════════════════
   SliderControl
══════════════════════════════════ */
function SliderControl({ label, value, min, max, step, display, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: T.inkSubtle,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 500 }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

/* ══════════════════════════════════
   HalftoneCanvas — 설정 변경 시 재렌더
══════════════════════════════════ */
function HalftoneCanvas({ croppedImg, settings, onColorsChange }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !croppedImg) return;
    drawHalftone(canvasRef.current, croppedImg, settings);
    if (settings.mode === "lego" && onColorsChange) {
      onColorsChange(canvasRef.current._usedLegoColors || []);
    } else if (settings.mode === "cmyk" && onColorsChange) {
      onColorsChange([]);
    }
  }, [croppedImg, settings]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        aspectRatio: "1",
        borderRadius: 16,
        border: `1px solid ${T.sand}`,
        boxShadow: "0 8px 40px rgba(20,18,16,0.10)",
        display: "block",
      }}
    />
  );
}

/* ══════════════════════════════════
   ColorPanel
══════════════════════════════════ */
function ColorPanel({ legoColors }) {
  const colorCounts = useMemo(() => countColors(legoColors), [legoColors]);
  const hasResult = colorCounts.length > 0;

  return (
    <div
      style={{
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
        {hasResult
          ? `사용된 색상 — ${colorCounts.length}가지`
          : `레고 팔레트 — ${LEGO_COLORS.length}가지`}
      </div>

      {hasResult ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: "45vh",
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
                gap: 10,
                padding: "8px 10px",
                background: T.cream,
                border: `1px solid ${T.sand}`,
                borderRadius: 10,
                opacity: 0,
                animation: `fadeUp 0.4s ease ${idx * 20}ms forwards`,
              }}
            >
              {/* 스터드 스와치 */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: hex,
                  borderRadius: 5,
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
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: hex,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: T.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {LEGO_COLOR_NAMES[hex] ?? hex}
                </div>
                <div style={{ fontSize: 10, color: T.inkSubtle }}>
                  {hex.toUpperCase()}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 300,
                  color: T.accent,
                  flexShrink: 0,
                }}
              >
                {count}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginBottom: 16,
            }}
          >
            {LEGO_COLORS.map((hex) => (
              <div
                key={hex}
                title={LEGO_COLOR_NAMES[hex]}
                style={{
                  width: 22,
                  height: 22,
                  background: hex,
                  borderRadius: 4,
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                  transition: "transform 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              />
            ))}
          </div>
          <div style={{ fontSize: 12, color: T.inkSubtle, lineHeight: 1.8 }}>
            LEGO 모드에서 이미지를 렌더링하면
            <br />
            사용된 색상 목록이 표시됩니다.
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   CustomPage (메인)
══════════════════════════════════ */
export default function CustomPage() {
  const imgRef = useRef(null);
  const croppedImgRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [step, setStep] = useState("upload"); // "upload" | "crop" | "halftone"
  const [legoColors, setLegoColors] = useState([]);

  // Halftone 설정
  const [mode, setMode] = useState("cmyk");
  const [shape, setShape] = useState("stud");
  const [cellSize, setCellSize] = useState(16);
  const [radius, setRadius] = useState(0.85);
  const [angle, setAngle] = useState(0);

  const settings = useMemo(
    () => ({ mode, shape, cellSize, radius, angle }),
    [mode, shape, cellSize, radius, angle],
  );

  function handleFile(file) {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setLegoColors([]);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;
      setStep("crop");
    };
    img.src = url;
  }

  function handleCropApply(cropPx) {
    if (!imgRef.current) return;

    // 크롭된 영역을 별도 캔버스에 저장
    const S = 512;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");

    if (cropPx) {
      ctx.drawImage(
        imgRef.current,
        cropPx.x,
        cropPx.y,
        cropPx.size,
        cropPx.size,
        0,
        0,
        S,
        S,
      );
    } else {
      // 크롭 없이 전체 이미지 사용 (정사각형 중앙 크롭)
      const min = Math.min(
        imgRef.current.naturalWidth,
        imgRef.current.naturalHeight,
      );
      const sx = (imgRef.current.naturalWidth - min) / 2;
      const sy = (imgRef.current.naturalHeight - min) / 2;
      ctx.drawImage(imgRef.current, sx, sy, min, min, 0, 0, S, S);
    }

    // canvas → Image
    const tempImg = new Image();
    tempImg.onload = () => {
      croppedImgRef.current = tempImg;
      setStep("halftone");
    };
    tempImg.src = c.toDataURL();
  }

  function handleReset() {
    setImageUrl(null);
    setNaturalSize(null);
    setLegoColors([]);
    setStep("upload");
    imgRef.current = null;
    croppedImgRef.current = null;
  }

  // crop 컴포넌트에서 Apply 버튼을 직접 제공
  const cropApplyRef = useRef(null);

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
              fontSize: "clamp(36px,5vw,60px)",
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
            이미지를 업로드하고 크롭한 뒤 — Halftone 효과로 변환하세요.
            <br />
            CMYK 인쇄 감성 또는 레고 컬러 팔레트로 렌더링됩니다.
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
          gap: "clamp(24px,4vw,56px)",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* ── 왼쪽: 메인 작업 영역 ── */}
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          {/* 상단 바: 라벨 + 새 이미지 버튼 */}
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
              {step === "upload" && "Upload Image"}
              {step === "crop" && "Crop Image"}
              {step === "halftone" && "Halftone Preview"}
            </span>
            {step !== "upload" && (
              <div style={{ display: "flex", gap: 8 }}>
                {step === "halftone" && (
                  <button
                    onClick={() => setStep("crop")}
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
                      e.currentTarget.style.borderColor = T.accent;
                      e.currentTarget.style.color = T.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.sand;
                      e.currentTarget.style.color = T.inkSubtle;
                    }}
                  >
                    ← 크롭 재조정
                  </button>
                )}
                <button
                  onClick={handleReset}
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
                    e.currentTarget.style.borderColor = T.accent;
                    e.currentTarget.style.color = T.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.sand;
                    e.currentTarget.style.color = T.inkSubtle;
                  }}
                >
                  ✕ 새 이미지
                </button>
              </div>
            )}
          </div>

          {/* Step 1: 업로드 */}
          {step === "upload" && <UploadZone onFile={handleFile} />}

          {/* Step 2: 크롭 */}
          {step === "crop" && imageUrl && naturalSize && (
            <CropStep
              imageUrl={imageUrl}
              naturalSize={naturalSize}
              onApply={handleCropApply}
            />
          )}

          {/* Step 3: Halftone 결과 */}
          {step === "halftone" && croppedImgRef.current && (
            <HalftoneCanvas
              croppedImg={croppedImgRef.current}
              settings={settings}
              onColorsChange={setLegoColors}
            />
          )}
        </div>

        {/* ── 오른쪽: 설정 패널 ── */}
        <div
          style={{
            flex: "0 0 300px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Halftone 설정 */}
          <div
            style={{
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
              Halftone Settings
            </div>

            {/* Mode */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  color: T.inkSubtle,
                  marginBottom: 8,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Mode
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ["cmyk", "CMYK"],
                  ["lego", "LEGO"],
                ].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setMode(v)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      border: `1px solid ${mode === v ? T.ink : T.sand}`,
                      borderRadius: 8,
                      background: mode === v ? T.ink : "transparent",
                      color: mode === v ? T.cream : T.inkSubtle,
                      fontSize: 12,
                      fontFamily: "'DM Mono',monospace",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dot Shape */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  color: T.inkSubtle,
                  marginBottom: 8,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Dot Shape
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ["circle", "● Circle"],
                  ["stud", "⊙ Stud"],
                ].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setShape(v)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      border: `1px solid ${shape === v ? T.accent : T.sand}`,
                      borderRadius: 8,
                      background: shape === v ? T.accent : "transparent",
                      color: shape === v ? "#fff" : T.inkSubtle,
                      fontSize: 12,
                      fontFamily: "'DM Mono',monospace",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <SliderControl
              label="Cell Size"
              value={cellSize}
              min={8}
              max={40}
              step={2}
              display={`${cellSize}px`}
              onChange={setCellSize}
            />
            <SliderControl
              label="Dot Radius"
              value={radius}
              min={0.3}
              max={1.0}
              step={0.05}
              display={`${Math.round(radius * 100)}%`}
              onChange={setRadius}
            />
            <SliderControl
              label="Grid Angle"
              value={angle}
              min={0}
              max={45}
              step={1}
              display={`${angle}°`}
              onChange={setAngle}
            />
          </div>

          {/* LEGO 색상 패널 */}
          {mode === "lego" && <ColorPanel legoColors={legoColors} />}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        input[type=range] {
          -webkit-appearance:none; appearance:none;
          width:100%; height:4px;
          background:${T.sand}; border-radius:2px; outline:none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance:none;
          width:14px; height:14px;
          border-radius:50%;
          background:${T.ink}; cursor:pointer;
        }
      `}</style>
    </div>
  );
}

/* ── CropStep: 크롭 + Apply 버튼 묶음 ── */
function CropStep({ imageUrl, naturalSize, onApply }) {
  const cropRef = useRef(null); // ImageCropper 내부 crop state를 올려야 하므로 별도 관리
  const [cropPx, setCropPx] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ImageCropperControlled
        imageUrl={imageUrl}
        naturalSize={naturalSize}
        onCropChange={setCropPx}
      />
      <button
        onClick={() => onApply(cropPx)}
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
          e.currentTarget.style.background = "#2a2520";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.ink;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Apply Crop & Generate Halftone →
      </button>
    </div>
  );
}

/* ── ImageCropperControlled: crop 상태를 부모에 올리는 버전 ── */
function ImageCropperControlled({ imageUrl, naturalSize, onCropChange }) {
  const containerRef = useRef(null);
  const dragState = useRef(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCropState] = useState(null);

  const setCrop = useCallback(
    (val) => {
      setCropState(val);
      // natural 좌표로 변환해서 부모에 전달
      if (val && displaySize.w && displaySize.h) {
        const scaleX = naturalSize.w / displaySize.w;
        const scaleY = naturalSize.h / displaySize.h;
        const scale = Math.max(scaleX, scaleY);
        const rW = naturalSize.w / scale,
          rH = naturalSize.h / scale;
        const oX = (displaySize.w - rW) / 2,
          oY = (displaySize.h - rH) / 2;
        const nx = (val.x - oX) * scale,
          ny = (val.y - oY) * scale,
          ns = val.size * scale;
        onCropChange({
          x: Math.max(0, Math.round(nx)),
          y: Math.max(0, Math.round(ny)),
          size: Math.round(
            Math.min(
              ns,
              naturalSize.w - Math.max(0, nx),
              naturalSize.h - Math.max(0, ny),
            ),
          ),
        });
      }
    },
    [displaySize, naturalSize, onCropChange],
  );

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
      dragState.current = {
        mode,
        handleDir,
        startPt: getXY(e),
        startCrop: { ...crop },
      };
      const onMove = (ev) => {
        if (!dragState.current) return;
        const {
          mode,
          handleDir: dir,
          startPt,
          startCrop: sc,
        } = dragState.current;
        const pt2 = getXY(ev);
        const dx = pt2.x - startPt.x,
          dy = pt2.y - startPt.y;
        const W = displaySize.w,
          H = displaySize.h;
        if (mode === "move") {
          setCrop({
            x: clamp(sc.x + dx, 0, W - sc.size),
            y: clamp(sc.y + dy, 0, H - sc.size),
            size: sc.size,
          });
        } else if (mode === "resize") {
          const delta =
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
        } else if (mode === "new") {
          const size = Math.max(
            MIN_CROP,
            Math.min(Math.abs(dx), Math.abs(dy), W, H),
          );
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          aspectRatio: "1",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${T.sand}`,
          cursor: "crosshair",
          background: T.ink,
          userSelect: "none",
        }}
      >
        <img
          src={imageUrl}
          alt="crop"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
        {crop && (
          <>
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
              {[
                {
                  top: 0,
                  left: 0,
                  borderTop: `3px solid ${T.accent}`,
                  borderLeft: `3px solid ${T.accent}`,
                },
                {
                  top: 0,
                  right: 0,
                  borderTop: `3px solid ${T.accent}`,
                  borderRight: `3px solid ${T.accent}`,
                },
                {
                  bottom: 0,
                  left: 0,
                  borderBottom: `3px solid ${T.accent}`,
                  borderLeft: `3px solid ${T.accent}`,
                },
                {
                  bottom: 0,
                  right: 0,
                  borderBottom: `3px solid ${T.accent}`,
                  borderRight: `3px solid ${T.accent}`,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    pointerEvents: "none",
                    ...s,
                  }}
                />
              ))}
            </div>
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              />
            ))}
          </>
        )}
      </div>
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
    </div>
  );
}
