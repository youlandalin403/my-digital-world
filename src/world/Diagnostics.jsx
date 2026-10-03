import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
// Development-only measurements, exposed as DOM attributes for browser QA.
export default function Diagnostics() {
  const sample = useRef({ frames: 0, seconds: 0 });
  useFrame(({ gl }, delta) => {
    const s = sample.current;
    s.frames++;
    s.seconds += delta;
    if (s.seconds > 2) {
      const canvas = gl.domElement;
      canvas.dataset.fps = (s.frames / s.seconds).toFixed(1);
      canvas.dataset.drawCalls = String(gl.info.render.calls);
      canvas.dataset.triangles = String(gl.info.render.triangles);
      s.frames = 0;
      s.seconds = 0;
    }
  });
  return null;
}
