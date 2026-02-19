// HeroSectionCream.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ---- easing
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// 이미지 → NxN 컬러 배열
async function sampleImageToColors({ src, size }) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;

  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // 정사각 크롭(중앙)
  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const colors = new Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const r = data[i * 4 + 0] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    colors[i] = new THREE.Color(r, g, b);
  }
  return colors;
}

// 베이스플레이트 텍스처(크림 톤)
function useBaseplateTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#efe4d3";
    ctx.fillRect(0, 0, c.width, c.height);

    // stud 점무늬를 아주 은은하게
    for (let y = 12; y < 256; y += 24) {
      for (let x = 12; x < 256; x += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 6.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.035)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.anisotropy = 8;
    return tex;
  }, []);
}

// ✅ stud 포함 브릭 지오메트리 생성(박스 + 원통 합치기)
function useStudBrickGeometry(brickSize) {
  return useMemo(() => {
    const width = brickSize;
    const depth = brickSize;
    const height = brickSize * 0.55;

    // base box
    const box = new THREE.BoxGeometry(width, height, depth);

    // stud
    const studRadius = brickSize * 0.18;
    const studHeight = brickSize * 0.14;

    const stud = new THREE.CylinderGeometry(
      studRadius,
      studRadius,
      studHeight,
      18,
      1,
    );
    stud.translate(0, height / 2 + studHeight / 2, 0);

    const merged = mergeGeometries([box, stud], false);
    merged.computeVertexNormals();
    return merged;
  }, [brickSize]);
}

function BrickMosaicBackground({
  imageUrl = "/covers/sample.jpg",
  grid = 32,
  brickSize = 0.18,
  gap = 0.012,
  fallDuration = 1.2,
  scatter = 0.9,
}) {
  const groupRef = useRef();
  const instRef = useRef();
  const [colors, setColors] = useState(null);

  // 카메라/마우스 패럴랙스
  const pointerTarget = useRef({ x: 0, y: 0 });

  const { positions, delays, startHeights, total, step, maxDelay } =
    useMemo(() => {
      const total = grid * grid;
      const positions = new Array(total);
      const delays = new Float32Array(total);
      const startHeights = new Float32Array(total);

      const step = brickSize + gap;
      const half = (grid - 1) * step * 0.5;

      let maxDelay = 0;

      for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
          const i = y * grid + x;
          const px = x * step - half;
          const pz = y * step - half;

          positions[i] = new THREE.Vector3(px, 0, pz);

          const d = (y / grid) * 0.9 + Math.random() * 0.25;
          delays[i] = d;
          if (d > maxDelay) maxDelay = d;

          startHeights[i] = 0.9 + Math.random() * scatter;
        }
      }
      return { positions, delays, startHeights, total, step, maxDelay };
    }, [grid, brickSize, gap, scatter]);

  // 색 샘플링
  useEffect(() => {
    let alive = true;
    sampleImageToColors({ src: imageUrl, size: grid })
      .then((cols) => alive && setColors(cols))
      .catch(() => {
        const fallback = new Array(grid * grid).fill(0).map((_, i) => {
          const x = (i % grid) / (grid - 1);
          const y = Math.floor(i / grid) / (grid - 1);
          return new THREE.Color().setHSL(
            0.08 + x * 0.18,
            0.35,
            0.45 + (1 - y) * 0.18,
          );
        });
        alive && setColors(fallback);
      });
    return () => (alive = false);
  }, [imageUrl, grid]);

  // 인스턴스 색 적용(한 번)
  useEffect(() => {
    if (!colors || !instRef.current) return;
    for (let i = 0; i < total; i++) instRef.current.setColorAt(i, colors[i]);
    instRef.current.instanceColor.needsUpdate = true;
  }, [colors, total]);

  const baseplateTex = useBaseplateTexture();
  const brickGeo = useStudBrickGeometry(brickSize);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // =========================================================
  // ✅ 파동 시뮬레이션 버퍼 (h, v)
  // =========================================================
  const heightRef = useRef(null);
  const velRef = useRef(null);

  useEffect(() => {
    heightRef.current = new Float32Array(total);
    velRef.current = new Float32Array(total);
  }, [total]);

  // 파동 튜닝
  const AMPLITUDE = brickSize * 0.55; // 파동 높이
  const IMPULSE = 1.25; // 마우스 충격 강도
  const RADIUS = 2; // 충격 퍼짐 반경(2~3)
  const SPRING = 35.0; // 전파 강도
  const DAMPING = 6.5; // 감쇠
  const buildDoneTime = maxDelay + fallDuration + 0.05;

  const addImpulse = (cx, cy, strength = IMPULSE) => {
    const h = heightRef.current;
    const v = velRef.current;
    if (!h || !v) return;

    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= grid || y < 0 || y >= grid) continue;

        const dist2 = dx * dx + dy * dy;
        if (dist2 > RADIUS * RADIUS) continue;

        const w = Math.exp(-dist2 / (RADIUS * RADIUS * 0.6));
        const idx = y * grid + x;

        // 속도에 충격
        v[idx] += strength * w;
      }
    }
  };

  // ✅ instancedMesh hover id로 충격 주기
  const onMove = (e) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id == null) return;

    const cx = id % grid;
    const cy = Math.floor(id / grid);
    addImpulse(cx, cy, IMPULSE);
  };

  useFrame(({ clock, pointer }) => {
    const dt = Math.min(clock.getDelta(), 0.033);
    const t = clock.getElapsedTime();

    pointerTarget.current.x = pointer.x * 0.22;
    pointerTarget.current.y = pointer.y * 0.14;

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        pointerTarget.current.x,
        0.05,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -pointerTarget.current.y,
        0.05,
      );
    }

    if (!instRef.current) return;

    // 파동 업데이트
    const h = heightRef.current;
    const v = velRef.current;

    if (h && v) {
      for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
          const i = y * grid + x;
          const center = h[i];

          const left = x > 0 ? h[i - 1] : center;
          const right = x < grid - 1 ? h[i + 1] : center;
          const up = y > 0 ? h[i - grid] : center;
          const down = y < grid - 1 ? h[i + grid] : center;

          const lap = left + right + up + down - 4 * center;
          v[i] += (lap * SPRING - v[i] * DAMPING) * dt;
        }
      }

      for (let i = 0; i < total; i++) {
        h[i] += v[i] * dt;
      }
    }

    const isBuildPhase = t < buildDoneTime;

    // 인스턴스 매트릭스 업데이트(빌드 낙하 + 파동)
    for (let i = 0; i < total; i++) {
      let baseY = 0;

      if (isBuildPhase) {
        const localT = (t - delays[i]) / fallDuration;
        const c = clamp01(localT);
        const eased = easeOutBack(c);
        baseY = THREE.MathUtils.lerp(startHeights[i], 0, eased);
      }

      const waveY = h ? h[i] * AMPLITUDE : 0;

      tempObj.position.copy(positions[i]);
      tempObj.position.y = baseY + waveY;

      let s = 1.0;
      if (isBuildPhase) {
        const localT = (t - delays[i]) / fallDuration;
        const c = clamp01(localT);
        s = c < 1 ? THREE.MathUtils.lerp(0.88, 1.0, easeOutCubic(c)) : 1.0;
      }
      tempObj.scale.setScalar(s);

      tempObj.updateMatrix();
      instRef.current.setMatrixAt(i, tempObj.matrix);
    }

    instRef.current.instanceMatrix.needsUpdate = true;
  });

  // ✅ 베이스플레이트 크기: 브릭 외곽에 딱 맞춤
  const planeSize = (grid - 1) * step + brickSize;

  return (
    <group ref={groupRef} position={[0, -0.25, 0]}>
      {/* baseplate */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.11, 0]}
        receiveShadow
      >
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial
          map={baseplateTex}
          roughness={0.95}
          metalness={0.02}
          color={"#efe4d3"}
        />
      </mesh>

      {/* bricks */}
      <instancedMesh
        ref={instRef}
        args={[brickGeo, null, total]}
        castShadow
        receiveShadow
        onPointerMove={onMove}
      >
        <meshPhysicalMaterial
          roughness={0.22}
          metalness={0.02}
          clearcoat={0.65}
          clearcoatRoughness={0.25}
          reflectivity={0.35}
        />
      </instancedMesh>
    </group>
  );
}

export default function HeroSectionCream() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#f5ede0",
        overflow: "hidden",
      }}
    >
      {/* Full-bleed 3D background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Canvas
          shadows
          dpr={[1, 2]}
          // ✅ 너무 위에서 보면 파동이 안 보임: y=1.45 추천
          camera={{ position: [0.3, 20, 2.0], fov: 38 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.15;
          }}
        >
          <color attach="background" args={["#f5ede0"]} />

          <ambientLight intensity={0.25} />

          <directionalLight
            position={[3.2, 5.0, 2.6]}
            intensity={1.35}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.00025}
          />

          <directionalLight position={[-3.5, 2.0, -1.8]} intensity={0.45} />
          <directionalLight position={[0.0, 2.8, -4.2]} intensity={0.55} />
          {/* 
          <Environment preset="studio" /> */}

          <BrickMosaicBackground
            imageUrl="/covers/sample.jpg"
            grid={32}
            brickSize={0.18}
            gap={0.012}
            fallDuration={1.2}
            scatter={1.0}
          />
        </Canvas>

        {/* 필름 느낌(너무 세면 인터랙션이 탁해 보임) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(800px 500px at 30% 20%, rgba(255,255,255,0.35), transparent 60%)," +
              "radial-gradient(900px 600px at 70% 80%, rgba(0,0,0,0.06), transparent 60%)",
            mixBlendMode: "multiply",
            opacity: 0.18, // ✅ 0.85 -> 0.18
          }}
        />
      </div>

      {/* Overlay content (✅ Canvas에 이벤트가 가도록 pointerEvents 처리) */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "grid",
          alignItems: "center",
          padding: "7rem 6vw",
          pointerEvents: "none", // ✅ 전체는 통과
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.35rem 0.65rem",
              border: "1px solid rgba(20,18,16,0.18)",
              borderRadius: 999,
              fontSize: 12,
              letterSpacing: 1.6,
              color: "rgba(20,18,16,0.75)",
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(6px)",
              marginBottom: 18,
            }}
          >
            VINYL BRICK MOSAIC
          </div>

          <h1
            style={{
              fontSize: 56,
              lineHeight: 1.03,
              margin: "0 0 16px",
              color: "#141210",
              letterSpacing: -0.6,
            }}
          >
            Build your album cover,
            <br /> 1x1 at a time.
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "rgba(20,18,16,0.72)",
              margin: "0 0 26px",
            }}
          >
            Turn any image into a calm, retro brick mosaic—designed as a
            vinyl-ready cover kit.
          </p>

          {/* ✅ 버튼/링크만 클릭 가능 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              pointerEvents: "auto",
            }}
          >
            <a
              href="/custom"
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                background: "#141210",
                color: "#f5ede0",
                textDecoration: "none",
                fontWeight: 750,
              }}
            >
              Start Customizing
            </a>
            <a
              href="/about"
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid rgba(20,18,16,0.22)",
                color: "#141210",
                textDecoration: "none",
                fontWeight: 650,
                background: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(6px)",
              }}
            >
              How it works
            </a>
          </div>

          <div
            style={{ marginTop: 18, fontSize: 13, color: "rgba(20,18,16,0.6)" }}
          >
            Ships as a kit · Includes building guide · Muted palette options
          </div>
        </div>
      </div>
    </section>
  );
}
