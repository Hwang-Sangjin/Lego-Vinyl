import { useEffect, useRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

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
  
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    
    // 격자 크기 설정 (레고 블록 크기)
    vec2 grid = floor(uv * uGridSize);
    
    // 각 격자마다 랜덤한 시드값
    float gridRandom = random(grid);
    
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
    
    // 격자 경계선 (레고 블록 느낌)
    vec2 gridUV = fract(uv * uGridSize);
    float borderWidth = 0.05;
    float border = step(borderWidth, gridUV.x) * step(borderWidth, gridUV.y) *
                   step(gridUV.x, 1.0 - borderWidth) * step(gridUV.y, 1.0 - borderWidth);
    
    // 약간 더 밝은 경계선
    vec3 color = mix(uBackgroundColor * 1.2, uBackgroundColor, border);

    gl_FragColor = vec4(color, alpha);
  }
`;

const TransitionPlane = ({
  trigger,
  backgroundColor = "#000000",
  gridSize = 20.0, // 격자 개수 (높을수록 블록이 작아짐)
}) => {
  const materialRef = useRef(null);
  const { viewport, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBackgroundColor: { value: new THREE.Color(backgroundColor) },
      uProgress: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uGridSize: { value: gridSize },
    }),
    [backgroundColor, gridSize, size.width, size.height],
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(
        size.width,
        size.height,
      );
    }
  }, [size]);

  useEffect(() => {
    if (!trigger) return;

    const material = materialRef.current;
    if (!material) return;

    const tl = gsap.timeline();

    // 0 -> 1로 진행
    tl.to(material.uniforms.uProgress, {
      value: 1,
      duration: 2.5,
      ease: "power2.inOut",
      onComplete: () => {
        // 애니메이션 완료 후 리셋
        setTimeout(() => {
          gsap.to(material.uniforms.uProgress, {
            value: 0,
            duration: 0,
          });
        }, 100);
      },
    });
  }, [trigger]);

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

export default TransitionPlane;
