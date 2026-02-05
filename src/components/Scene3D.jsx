import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { Suspense } from "react";

function ImagePlane({ imageSrc }) {
  const texture = useTexture(imageSrc);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default function Scene3D({ croppedImage }) {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          {croppedImage && <ImagePlane imageSrc={croppedImage} />}
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
