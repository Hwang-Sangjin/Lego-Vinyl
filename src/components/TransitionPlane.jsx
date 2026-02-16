import { useEffect, useRef, useMemo, useState, Suspense } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import legoImg from "/image/brick1.png";

// 레고 색상 팔레트
const LEGO_COLORS = [
  "#000000", // Black
  "#3E3C39", // Pearl Dark Grey
  "#6D6E6C", // Dark Bluish Grey
  "#898788", // Flat Silver
  "#A19E9F", // Light Grey
  "#FFFFFF", // White
  "#352100", // Dark Brown
  "#583927", // Brown
  "#7d3d28", // Reddish Brown
  "#92804b", // Dark Tan
  "#CE9E6F", // Nougat
  "#DFCFAE", // Tan
  "#F6D7B3", // Light Nougat
  "#720E0F", // Dark Red
  "#C9006B", // Magenta
  "#7d4f4f", // Sand Red
  "#DF0101", // Red
  "#D45472", // Dark Pink
  "#DF6695", // Medium Dark Pink
  "#FF6E6E", // Coral
  "#FF9ECE", // Pink
  "#FECCCF", // Light Pink
  "#A95500", // Dark Orange
  "#96781c", // Pearl Gold
  "#DC851E", // Orange
  "#F8BB3D", // Bright Light Orange
  "#F6D01D", // Bright Light Yellow
  "#F5CD30", // Yellow
  "#C8F94C", // Yellowish Green
  "#184632", // Dark Green
  "#00852B", // Green
  "#677430", // Olive Green
  "#4B9F4A", // Bright Green
  "#789F90", // Sand Green
  "#C2DAB8", // Light Green
  "#d0f1ec", // Light Aqua
  "#0A3463", // Dark Blue
  "#008590", // Dark Turquoise
  "#0057A6", // Blue
  "#078BC9", // Dark Azure
  "#6A739C", // Sand Blue
  "#54A9C8", // Maersk Blue
  "#8C71CB", // Medium Lavender
  "#88C4DC", // Bright Light Blue
  "#9391E4", // Medium Violet
  "#c3d2e0", // Light Bluish Grey
  "#81007B", // Purple
  "#6C3082", // Dark Purple
  "#A4659A", // Sand Purple
  "#CDA4DE", // Lavender
];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uBackgroundColor;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform float uGridSize;
  uniform sampler2D uTexture;
  uniform bool uUseTexture;
  uniform vec3 uColors[50]; // 최대 50개 색상
  uniform int uColorCount;
  uniform float uSeed; // 랜덤 시드 추가
  
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    
    // 격자 크기 설정
    vec2 grid = floor(uv * uGridSize);
    
    // 각 격자마다 랜덤한 시드값 (uSeed를 추가하여 매번 다른 패턴 생성)
    float gridRandom = random(grid + vec2(uSeed, uSeed));
    
    // 알파값 계산
    float alpha = 0.0;
    
    // Phase 1: 0.0 -> 0.4 (격자 무늬로 등장)
    if (uProgress <= 0.4) {
      float appearProgress = uProgress / 0.4;
      float gridDelay = gridRandom * 0.5;
      alpha = smoothstep(gridDelay, gridDelay + 0.3, appearProgress);
    }
    // Phase 2: 0.4 -> 0.6 (완전히 검정 화면 유지)
    else if (uProgress <= 0.6) {
      alpha = 1.0;
    }
    // Phase 3: 0.6 -> 1.0 (격자 무늬로 사라짐)
    else {
      float disappearProgress = (uProgress - 0.6) / 0.4;
      float gridDelay = gridRandom * 0.5;
      alpha = 1.0 - smoothstep(gridDelay, gridDelay + 0.3, disappearProgress);
    }
    
    // 격자 내 UV 좌표 (0~1 범위)
    vec2 gridUV = fract(uv * uGridSize);
    
    // 텍스처에서 밝기값 추출 (패턴만 사용)
    vec4 texColor = texture2D(uTexture, gridUV);
    
    // 그레이스케일 변환 (밝기 계산)
    float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // 각 격자마다 랜덤한 색상 선택 (uSeed를 사용하여 매번 다른 색상)
    float colorRandom = random(grid + vec2(uSeed * 2.0, uSeed * 3.0));
    int colorIndex = int(floor(colorRandom * float(uColorCount)));
    vec3 tintColor = uColors[colorIndex];
    
    // 밝기 패턴에 랜덤 색상 적용
    vec3 color = tintColor * brightness;
    
    // 대비 조정
    color = color * 1.2;

    gl_FragColor = vec4(color, alpha);
  }
`;

const TransitionPlaneContent = ({
  trigger,
  backgroundColor = "#000000",
  colors = LEGO_COLORS,
  gridSize = 50.0,
  patternImage = legoImg,
  onReady,
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
    const colorArray = colors.map((color) => new THREE.Color(color));

    return {
      uTime: { value: 0 },
      uBackgroundColor: { value: new THREE.Color(backgroundColor) },
      uProgress: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uGridSize: { value: gridSize },
      uTexture: { value: texture },
      uUseTexture: { value: true },
      uColors: { value: colorArray },
      uColorCount: { value: colors.length },
      uSeed: { value: 0.0 }, // 랜덤 시드 초기값
    };
  }, [backgroundColor, colors, gridSize, size.width, size.height, texture]);

  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTexture.value = texture;
      materialRef.current.uniforms.uUseTexture.value = true;
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

    // 트랜지션마다 새로운 랜덤 시드 생성
    material.uniforms.uSeed.value = Math.random() * 1000.0;

    const tl = gsap.timeline();

    tl.to(material.uniforms.uProgress, {
      value: 1,
      duration: 2.5,
      ease: "power2.inOut",
      onComplete: () => {
        setTimeout(() => {
          gsap.to(material.uniforms.uProgress, {
            value: 0,
            duration: 0,
          });
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

const TransitionPlane = (props) => {
  return (
    <Suspense fallback={null}>
      <TransitionPlaneContent {...props} />
    </Suspense>
  );
};

export default TransitionPlane;
