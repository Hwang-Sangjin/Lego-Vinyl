import { useEffect, useRef, useMemo, useState, Suspense } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import legoImg from "/image/brick1.png";

// 색상 계열 정의
const LEGO_GRAYS = [
  "#000000",
  "#3E3C39",
  "#6D6E6C",
  "#898788",
  "#A19E9F",
  "#FFFFFF",
  "#c3d2e0",
];

const LEGO_BROWNS = [
  "#352100",
  "#583927",
  "#7d3d28",
  "#92804b",
  "#CE9E6F",
  "#DFCFAE",
  "#F6D7B3",
];

const LEGO_REDS_PINKS = [
  "#720E0F",
  "#C9006B",
  "#7d4f4f",
  "#DF0101",
  "#D45472",
  "#DF6695",
  "#FF6E6E",
  "#FF9ECE",
  "#FECCCF",
];

const LEGO_ORANGES_YELLOWS = [
  "#A95500",
  "#96781c",
  "#DC851E",
  "#F8BB3D",
  "#F6D01D",
  "#F5CD30",
  "#C8F94C",
];

const LEGO_GREENS = [
  "#184632",
  "#00852B",
  "#677430",
  "#4B9F4A",
  "#789F90",
  "#C2DAB8",
  "#d0f1ec",
];

const LEGO_BLUES = [
  "#0A3463",
  "#008590",
  "#0057A6",
  "#078BC9",
  "#6A739C",
  "#54A9C8",
  "#88C4DC",
];

const LEGO_PURPLES = [
  "#81007B",
  "#6C3082",
  "#8C71CB",
  "#9391E4",
  "#A4659A",
  "#CDA4DE",
];

// 색상 계열 배열
const COLOR_PALETTES = [
  LEGO_GRAYS,
  LEGO_BROWNS,
  LEGO_REDS_PINKS,
  LEGO_ORANGES_YELLOWS,
  LEGO_GREENS,
  LEGO_BLUES,
  LEGO_PURPLES,
];

// GLSL 배열 최대 크기
const MAX_COLORS = 10;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uProgress;
  uniform float uGridSize;
  uniform sampler2D uTexture;
  uniform vec3 uColors[10];
  uniform int uColorCount;
  uniform float uSeed;
  uniform float uSeedDisappear;

  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float smootherStep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  void main() {
    vec2 uv = vUv;
    vec2 grid = floor(uv * uGridSize);

    float appearDelay    = random(grid + vec2(uSeed, uSeed)) * 0.5;
    float disappearDelay = random(grid + vec2(uSeedDisappear, uSeedDisappear)) * 0.5;

    float alpha = 0.0;

    // Phase 1: 0.0 -> 0.45  등장
    if (uProgress <= 0.45) {
      float p = uProgress / 0.45;
      alpha = smootherStep(appearDelay, appearDelay + 0.3, p);
    }
    // Phase 2: 0.45 -> 0.55  완전히 덮인 상태 유지
    else if (uProgress <= 0.55) {
      alpha = 1.0;
    }
    // Phase 3: 0.55 -> 1.0  소멸
    else {
      float p = (uProgress - 0.55) / 0.45;
      alpha = 1.0 - smootherStep(disappearDelay, disappearDelay + 0.3, p);
    }

    vec2 gridUV   = fract(uv * uGridSize);
    vec4 texColor = texture2D(uTexture, gridUV);
    float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

    float colorRandom = random(grid + vec2(uSeed * 2.0, uSeed * 3.0));
    int   colorIndex  = int(floor(colorRandom * float(uColorCount)));
    vec3  tintColor   = uColors[colorIndex];

    gl_FragColor = vec4(tintColor * brightness * 1.2, alpha);
  }
`;

const TransitionPlaneContent = ({
  trigger,
  backgroundColor = "#000000",
  colors,
  gridSize = 50.0,
  patternImage = legoImg,
  onReady,
  onCovered, // 화면이 완전히 가려진 순간 호출 → 여기서 페이지 전환
}) => {
  const materialRef = useRef(null);
  const { viewport, size } = useThree();
  const [isReady, setIsReady] = useState(false);

  const texture = useLoader(THREE.TextureLoader, patternImage);

  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      setIsReady(true);
      if (onReady) onReady();
    }
  }, [texture, onReady]);

  const uniforms = useMemo(() => {
    const paddedColors = colors.map((c) => new THREE.Color(c));
    while (paddedColors.length < MAX_COLORS) {
      paddedColors.push(new THREE.Color("#000000"));
    }

    return {
      uBackgroundColor: { value: new THREE.Color(backgroundColor) },
      uProgress: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uGridSize: { value: gridSize },
      uTexture: { value: texture },
      uColors: { value: paddedColors },
      uColorCount: { value: colors.length },
      uSeed: { value: 0.0 },
      uSeedDisappear: { value: 0.0 },
    };
  }, [backgroundColor, gridSize, size.width, size.height, texture]);

  useEffect(() => {
    if (!materialRef.current) return;
    const arr = colors.map((c) => new THREE.Color(c));
    while (arr.length < MAX_COLORS) arr.push(new THREE.Color("#000000"));
    materialRef.current.uniforms.uColors.value = arr;
    materialRef.current.uniforms.uColorCount.value = colors.length;
  }, [colors]);

  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTexture.value = texture;
    }
  }, [texture]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(
        size.width,
        size.height,
      );
    }
  }, [size]);

  useEffect(() => {
    if (!isReady || trigger === 0) return;

    const material = materialRef.current;
    if (!material) return;

    // 진행 중인 애니메이션 즉시 종료 후 초기화
    gsap.killTweensOf(material.uniforms.uProgress);
    material.uniforms.uProgress.value = 0;

    material.uniforms.uSeed.value = Math.random() * 1000.0;
    material.uniforms.uSeedDisappear.value = Math.random() * 1000.0;

    // Phase 1: 0 → 0.45  등장 (화면을 완전히 덮을 때까지)
    gsap
      .timeline()
      .to(material.uniforms.uProgress, {
        value: 0.45,
        duration: 1.8,
        ease: "power2.in", // 가속하며 덮임
        onComplete: () => {
          // ★ 화면이 완전히 가려진 순간 → 페이지 전환 실행
          if (onCovered) onCovered();
        },
      })
      // Phase 2: 0.45 → 0.55  잠깐 유지
      .to(material.uniforms.uProgress, {
        value: 0.55,
        duration: 0.2,
        ease: "none",
      })
      // Phase 3: 0.55 → 1.0  소멸
      .to(material.uniforms.uProgress, {
        value: 1.0,
        duration: 1.8,
        ease: "power2.out", // 감속하며 사라짐
        onComplete: () => {
          setTimeout(() => {
            gsap.to(material.uniforms.uProgress, { value: 0, duration: 0 });
          }, 100);
        },
      });
  }, [trigger, isReady]);

  return (
    <mesh position={[0, 0, 0]} renderOrder={999}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

const TransitionPlane = ({ trigger, onCovered, ...rest }) => {
  const [paletteIndex, setPaletteIndex] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    setPaletteIndex((prev) => (prev + 1) % COLOR_PALETTES.length);
  }, [trigger]);

  return (
    <Suspense fallback={null}>
      <TransitionPlaneContent
        {...rest}
        trigger={trigger}
        onCovered={onCovered}
        colors={COLOR_PALETTES[paletteIndex]}
      />
    </Suspense>
  );
};

export default TransitionPlane;
