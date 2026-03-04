import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";

const T = {
  cream:     "#f5ede0",
  creamDark: "#efe4d3",
  ink:       "#141210",
  inkLight:  "rgba(20,18,16,0.72)",
  inkSubtle: "rgba(20,18,16,0.45)",
  inkGhost:  "rgba(20,18,16,0.12)",
  sand:      "#e8d9c4",
  warm:      "#c9a97a",
  accent:    "#b85c38",
};

const LEGO_COLORS = [
  "#000000","#3E3C39","#6D6E6C","#898788","#A19E9F","#FFFFFF",
  "#352100","#583927","#7d3d28","#92804b","#CE9E6F","#DFCFAE",
  "#F6D7B3","#720E0F","#C9006B","#7d4f4f","#DF0101","#D45472",
  "#DF6695","#FF6E6E","#FF9ECE","#FECCCF","#A95500","#96781c",
  "#DC851E","#F8BB3D","#F6D01D","#F5CD30","#C8F94C","#184632",
  "#00852B","#677430","#4B9F4A","#789F90","#C2DAB8","#d0f1ec",
  "#0A3463","#008590","#0057A6","#078BC9","#6A739C","#54A9C8",
  "#8C71CB","#88C4DC","#9391E4","#c3d2e0","#81007B","#6C3082",
  "#A4659A","#CDA4DE",
];

const LEGO_COLOR_NAMES = {
  "#000000":"Black","#3E3C39":"Pearl Dark Grey","#6D6E6C":"Dark Bluish Grey",
  "#898788":"Flat Silver","#A19E9F":"Light Grey","#FFFFFF":"White",
  "#352100":"Dark Brown","#583927":"Brown","#7d3d28":"Reddish Brown",
  "#92804b":"Dark Tan","#CE9E6F":"Nougat","#DFCFAE":"Tan",
  "#F6D7B3":"Light Nougat","#720E0F":"Dark Red","#C9006B":"Magenta",
  "#7d4f4f":"Sand Red","#DF0101":"Red","#D45472":"Dark Pink",
  "#DF6695":"Medium Dark Pink","#FF6E6E":"Coral","#FF9ECE":"Pink",
  "#FECCCF":"Light Pink","#A95500":"Dark Orange","#96781c":"Pearl Gold",
  "#DC851E":"Orange","#F8BB3D":"Bright Light Orange","#F6D01D":"Bright Light Yellow",
  "#F5CD30":"Yellow","#C8F94C":"Yellowish Green","#184632":"Dark Green",
  "#00852B":"Green","#677430":"Olive Green","#4B9F4A":"Bright Green",
  "#789F90":"Sand Green","#C2DAB8":"Light Green","#d0f1ec":"Light Aqua",
  "#0A3463":"Dark Blue","#008590":"Dark Turquoise","#0057A6":"Blue",
  "#078BC9":"Dark Azure","#6A739C":"Sand Blue","#54A9C8":"Maersk Blue",
  "#8C71CB":"Medium Lavender","#88C4DC":"Bright Light Blue","#9391E4":"Medium Violet",
  "#c3d2e0":"Light Bluish Grey","#81007B":"Purple","#6C3082":"Dark Purple",
  "#A4659A":"Sand Purple","#CDA4DE":"Lavender",
};

/* ── 유틸 ── */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0,2), 16),
    g: parseInt(h.substring(2,4), 16),
    b: parseInt(h.substring(4,6), 16),
  };
}

function nearestLegoColor(r, g, b) {
  let minDist = Infinity;
  let nearest = LEGO_COLORS[0];
  for (const hex of LEGO_COLORS) {
    const c = hexToRgb(hex);
    const dr = r - c.r, dg = g - c.g, db = b - c.b;
    const dist = 0.299*dr*dr + 0.587*dg*dg + 0.114*db*db;
    if (dist < minDist) { minDist = dist; nearest = hex; }
  }
  return nearest;
}

function pixelateFromCrop(imgEl, cropPx) {
  // cropPx: { x, y, size } — 원본 이미지 기준 픽셀 좌표
  const SIZE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(imgEl, cropPx.x, cropPx.y, cropPx.size, cropPx.size, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const pixels = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    pixels.push(nearestLegoColor(data[i*4], data[i*4+1], data[i*4+2]));
  }
  return pixels;
}

function countColors(pixels) {
  const map = {};
  for (const hex of pixels) map[hex] = (map[hex] || 0) + 1;
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

/* ══════════════════════════════════
   ImageCropper 컴포넌트
   — 이미지 위에 정사각형 크롭 박스
══════════════════════════════════ */
const MIN_CROP_DISPLAY = 60; // 화면상 최소 크롭 박스 px

function ImageCropper({ imageUrl, naturalSize, onApply }) {
  const containerRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  // 크롭 박스 (화면 좌표 기준)
  const [crop, setCrop] = useState(null);

  // 드래그 상태
  const dragState = useRef(null);
  // move: 박스 전체 이동
  // resize: 핸들로 리사이즈
  // new: 새 박스 그리기

  /* 컨테이너 크기 감지 */
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

  /* 이미지 로드되면 초기 크롭 박스 설정 (중앙 정사각형) */
  useEffect(() => {
    if (!displaySize.w || !displaySize.h) return;
    const side = Math.min(displaySize.w, displaySize.h) * 0.65;
    setCrop({
      x: (displaySize.w - side) / 2,
      y: (displaySize.h - side) / 2,
      size: side,
    });
  }, [displaySize.w, displaySize.h]);

  /* 화면 → 원본 이미지 좌표 변환 */
  function toNaturalCrop(c) {
    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    const scale  = Math.max(scaleX, scaleY); // object-fit: contain 역산

    // contain일 때 실제 렌더 크기
    const renderedW = naturalSize.w / scale;
    const renderedH = naturalSize.h / scale;
    const offsetX   = (displaySize.w - renderedW) / 2;
    const offsetY   = (displaySize.h - renderedH) / 2;

    const nx = (c.x - offsetX) * scale;
    const ny = (c.y - offsetY) * scale;
    const ns = c.size * scale;

    return {
      x:    Math.max(0, Math.round(nx)),
      y:    Math.max(0, Math.round(ny)),
      size: Math.round(Math.min(ns, naturalSize.w - Math.max(0, nx), naturalSize.h - Math.max(0, ny))),
    };
  }

  /* ── 마우스/터치 핸들러 ── */
  const getXY = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const onPointerDown = useCallback((e, mode, handleDir) => {
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
      const dx  = pt2.x - dragState.current.startPt.x;
      const dy  = pt2.y - dragState.current.startPt.y;
      const sc  = dragState.current.startCrop;
      const W   = displaySize.w;
      const H   = displaySize.h;

      if (dragState.current.mode === "move") {
        setCrop({
          x:    clamp(sc.x + dx, 0, W - sc.size),
          y:    clamp(sc.y + dy, 0, H - sc.size),
          size: sc.size,
        });
      } else if (dragState.current.mode === "resize") {
        // 정사각형 유지: dx/dy 중 더 큰 쪽 사용
        const dir  = dragState.current.handleDir;
        let delta  = 0;

        if (dir === "se") delta = Math.max(dx, dy);
        if (dir === "sw") delta = Math.max(-dx, dy);
        if (dir === "ne") delta = Math.max(dx, -dy);
        if (dir === "nw") delta = Math.max(-dx, -dy);

        const newSize = clamp(sc.size + delta, MIN_CROP_DISPLAY, Math.min(W, H));
        let nx = sc.x, ny = sc.y;

        if (dir === "sw" || dir === "nw") nx = sc.x + sc.size - newSize;
        if (dir === "ne" || dir === "nw") ny = sc.y + sc.size - newSize;

        setCrop({
          x:    clamp(nx, 0, W - newSize),
          y:    clamp(ny, 0, H - newSize),
          size: newSize,
        });
      } else if (dragState.current.mode === "new") {
        // 새 박스 그리기
        const raw  = Math.min(Math.abs(dx), Math.abs(dy), W, H);
        const size = Math.max(MIN_CROP_DISPLAY, raw);
        const x    = clamp(dx >= 0 ? sc.x : sc.x - size, 0, W - size);
        const y    = clamp(dy >= 0 ? sc.y : sc.y - size, 0, H - size);
        setCrop({ x, y, size });
      }
    };

    const onUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
  }, [crop, displaySize]);

  /* 핸들 위치 */
  const handles = crop ? [
    { dir: "nw", cx: crop.x,              cy: crop.y              },
    { dir: "ne", cx: crop.x + crop.size,  cy: crop.y              },
    { dir: "sw", cx: crop.x,              cy: crop.y + crop.size  },
    { dir: "se", cx: crop.x + crop.size,  cy: crop.y + crop.size  },
  ] : [];

  const HANDLE_R = 7;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 크롭 캔버스 영역 */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (dragState.current) return;
          const pt = getXY(e);
          // 박스 안쪽이면 이동, 바깥이면 새로 그리기
          if (crop &&
            pt.x >= crop.x && pt.x <= crop.x + crop.size &&
            pt.y >= crop.y && pt.y <= crop.y + crop.size) {
            onPointerDown(e, "move", null);
          } else {
            const fakeCrop = { x: pt.x, y: pt.y, size: MIN_CROP_DISPLAY };
            setCrop(fakeCrop);
            onPointerDown(e, "new", null);
          }
        }}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${T.sand}`,
          cursor: "crosshair",
          background: T.creamDark,
          userSelect: "none",
        }}
      >
        {/* 원본 이미지 */}
        <img
          src={imageUrl}
          alt="crop source"
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {crop && (
          <>
            {/* 어두운 오버레이 4방향 */}
            {/* 위 */}
            <div style={{ position:"absolute", left:0, top:0, width:"100%", height:crop.y, background:"rgba(20,18,16,0.5)", pointerEvents:"none" }} />
            {/* 아래 */}
            <div style={{ position:"absolute", left:0, top:crop.y+crop.size, width:"100%", bottom:0, height:`calc(100% - ${crop.y+crop.size}px)`, background:"rgba(20,18,16,0.5)", pointerEvents:"none" }} />
            {/* 왼쪽 */}
            <div style={{ position:"absolute", left:0, top:crop.y, width:crop.x, height:crop.size, background:"rgba(20,18,16,0.5)", pointerEvents:"none" }} />
            {/* 오른쪽 */}
            <div style={{ position:"absolute", left:crop.x+crop.size, top:crop.y, width:`calc(100% - ${crop.x+crop.size}px)`, height:crop.size, background:"rgba(20,18,16,0.5)", pointerEvents:"none" }} />

            {/* 크롭 박스 테두리 */}
            <div style={{
              position: "absolute",
              left: crop.x, top: crop.y,
              width: crop.size, height: crop.size,
              border: `2px solid ${T.accent}`,
              boxSizing: "border-box",
              pointerEvents: "none",
            }}>
              {/* 룰 오브 서드 가이드라인 */}
              {[1/3, 2/3].map(r => (
                <React.Fragment key={r}>
                  <div style={{ position:"absolute", left:`${r*100}%`, top:0, width:1, height:"100%", background:"rgba(255,255,255,0.25)" }} />
                  <div style={{ position:"absolute", top:`${r*100}%`, left:0, height:1, width:"100%", background:"rgba(255,255,255,0.25)" }} />
                </React.Fragment>
              ))}
            </div>

            {/* 리사이즈 핸들 4개 */}
            {handles.map(({ dir, cx, cy }) => (
              <div
                key={dir}
                onMouseDown={(e) => onPointerDown(e, "resize", dir)}
                style={{
                  position: "absolute",
                  left: cx - HANDLE_R, top: cy - HANDLE_R,
                  width: HANDLE_R*2, height: HANDLE_R*2,
                  borderRadius: "50%",
                  background: T.accent,
                  border: "2px solid #fff",
                  cursor:
                    dir === "nw" || dir === "se" ? "nwse-resize" : "nesw-resize",
                  zIndex: 10,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Apply 버튼 */}
      <button
        onClick={() => crop && onApply(toNaturalCrop(crop))}
        disabled={!crop}
        style={{
          width: "100%",
          padding: "13px 0",
          background: crop ? T.ink : T.sand,
          color: crop ? T.cream : T.inkSubtle,
          border: "none", borderRadius: 12,
          fontSize: 13, letterSpacing: "0.06em",
          fontFamily: "'DM Mono', monospace",
          cursor: crop ? "pointer" : "default",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => { if (crop) e.target.style.background = "#2a2520"; }}
        onMouseLeave={e => { if (crop) e.target.style.background = T.ink; }}
      >
        Apply Crop & Pixelate →
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   Custom 페이지
══════════════════════════════════ */
export default function Custom() {
  const fileRef   = useRef(null);
  const imgRef    = useRef(null);

  const [imageUrl,     setImageUrl]     = useState(null);
  const [naturalSize,  setNaturalSize]  = useState(null);
  const [pixels,       setPixels]       = useState(null);
  const [dragging,     setDragging]     = useState(false);

  const colorCounts = useMemo(
    () => pixels ? countColors(pixels) : [],
    [pixels]
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

  function onFileChange(e) { handleFile(e.target.files[0]); }

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
    <div style={{
      minHeight: "100vh",
      background: T.cream,
      fontFamily: "'DM Mono', monospace",
      color: T.ink,
    }}>

      {/* 헤더 */}
      <div style={{ padding: "48px 6vw 0", maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkSubtle }}>
          Customize
        </span>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)",
          fontFamily: "'DM Serif Display', Georgia, serif",
          lineHeight: 1.08, margin: "12px 0 8px", letterSpacing: -0.5,
        }}>
          Build your mosaic.
        </h1>
        <p style={{ fontSize:14, color:T.inkLight, margin:0, lineHeight:1.7 }}>
          이미지를 업로드하고 원하는 영역을 크롭하세요.
          32×32 레고 브릭 모자이크로 변환됩니다.
        </p>
      </div>

      {/* 본문 */}
      <div style={{
        maxWidth: 1200, margin: "40px auto 0",
        padding: "0 6vw 80px",
        display: "flex",
        gap: "clamp(24px, 4vw, 56px)",
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}>

        {/* ── 왼쪽 ── */}
        <div style={{ flex: "1 1 360px", minWidth: 0 }}>

          {!imageUrl ? (
            /* 업로드 존 */
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? T.accent : T.sand}`,
                borderRadius: 16, padding: "60px 24px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? T.creamDark : "transparent",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display:"none" }} />
              <div style={{ fontSize:40, marginBottom:16 }}>🖼</div>
              <div style={{ fontSize:14, color:T.inkLight, marginBottom:8 }}>
                이미지를 드래그하거나 클릭해서 업로드
              </div>
              <div style={{ fontSize:12, color:T.inkSubtle }}>JPG, PNG, WEBP 지원</div>
            </div>
          ) : (
            /* 크롭 UI */
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 14,
              }}>
                <span style={{ fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:T.inkSubtle }}>
                  Crop Image
                </span>
                <button
                  onClick={() => { setImageUrl(null); setPixels(null); setNaturalSize(null); fileRef.current.value = ""; }}
                  style={{
                    background:"none", border:`1px solid ${T.sand}`,
                    borderRadius:8, padding:"4px 12px",
                    fontSize:11, color:T.inkSubtle, cursor:"pointer",
                    fontFamily:"'DM Mono', monospace",
                  }}
                >
                  ✕ 새 이미지
                </button>
              </div>

              {naturalSize && (
                <ImageCropper
                  imageUrl={imageUrl}
                  naturalSize={naturalSize}
                  onApply={handleApply}
                />
              )}
            </div>
          )}

          {/* 픽셀 결과 */}
          {pixels && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:T.inkSubtle, marginBottom:14 }}>
                32 × 32 Mosaic Preview
              </div>
              <div style={{
                display: "inline-block",
                background: T.creamDark,
                padding: 12, borderRadius: 16,
                border: `1px solid ${T.sand}`,
                boxShadow: "0 8px 32px rgba(20,18,16,0.08)",
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(32, 1fr)",
                  gap: "1px",
                  width: "min(400px, 72vw)",
                  aspectRatio: "1",
                }}>
                  {pixels.map((color, i) => (
                    <div key={i} style={{
                      background: color,
                      borderRadius: 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop:12, fontSize:12, color:T.inkSubtle }}>
                <span style={{ color:T.accent, fontWeight:500 }}>{colorCounts.length}가지 색상</span> · {pixels.length}개 브릭
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 색상 목록 ── */}
        <div style={{ flex:"1 1 280px", maxWidth:400 }}>
          <div style={{ fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:T.inkSubtle, marginBottom:20 }}>
            {pixels ? `사용된 색상 — ${colorCounts.length}가지` : "색상 팔레트"}
          </div>

          {pixels ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:"70vh", overflowY:"auto", paddingRight:4 }}>
              {colorCounts.map(([hex, count]) => (
                <div key={hex} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px",
                  background:T.creamDark,
                  border:`1px solid ${T.sand}`,
                  borderRadius:10,
                }}>
                  {/* 스워치 */}
                  <div style={{
                    width:32, height:32, background:hex, borderRadius:6, flexShrink:0,
                    boxShadow:"inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.15)",
                    position:"relative",
                  }}>
                    <div style={{
                      position:"absolute", top:"50%", left:"50%",
                      transform:"translate(-50%, -60%)",
                      width:12, height:12, borderRadius:"50%",
                      background:hex,
                      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                    }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {LEGO_COLOR_NAMES[hex] ?? hex}
                    </div>
                    <div style={{ fontSize:10, color:T.inkSubtle, marginTop:1 }}>{hex.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:16, fontWeight:300, color:T.accent, lineHeight:1 }}>{count}</div>
                    <div style={{ fontSize:10, color:T.inkSubtle }}>{((count/1024)*100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                {LEGO_COLORS.map(hex => (
                  <div key={hex} title={LEGO_COLOR_NAMES[hex]} style={{
                    width:28, height:28, background:hex, borderRadius:5,
                    border:"1px solid rgba(0,0,0,0.08)",
                    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.2)",
                  }} />
                ))}
              </div>
              <div style={{ fontSize:12, color:T.inkSubtle, lineHeight:1.7 }}>
                총 {LEGO_COLORS.length}가지 실제 레고 색상을 사용합니다.
                이미지를 업로드하면 각 색상의 사용 개수가 표시됩니다.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}