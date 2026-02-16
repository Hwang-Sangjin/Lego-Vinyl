import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import TransitionPlane from "./TransitionPlane";

export default function TransitionOverlay({ trigger }) {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <Suspense fallback={null}>
        <Canvas
          style={{ pointerEvents: "none" }}
          gl={{ alpha: true }}
          camera={{ position: [0, 0, 5], fov: 75 }}
        >
          <TransitionPlane trigger={trigger} />
        </Canvas>
      </Suspense>
    </div>
  );
}
