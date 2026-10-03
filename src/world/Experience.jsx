import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import CameraRig from "./CameraRig";
import Environment from "./Environment";
import Building from "./Building";
import Forest from "./Forest";
import GroundVegetation from "./GroundVegetation";
import { WORLD_CONFIG as C } from "../config/worldConfig";
import Diagnostics from "./Diagnostics";
function Ready({ onReady, onError }) {
  const frames = useRef(0),
    gl = useThree((s) => s.gl);
  useFrame(() => {
    if (++frames.current === 3) onReady();
  });
  useEffect(() => {
    const canvas = gl.domElement,
      lost = (event) => {
        event.preventDefault();
        onError();
      };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);
  return null;
}
export default function Experience(props) {
  return (
    <Canvas
      shadows
      frameloop={props.ended ? "never" : "always"}
      dpr={C.performance.dpr}
      camera={{
        position: C.camera.path[0],
        fov: C.camera.fov,
        near: 0.15,
        far: 220,
      }}
      gl={{ antialias: true }}
    >
      <Environment />
      <Building />
      <Forest reducedMotion={props.reducedMotion} />
      <GroundVegetation reducedMotion={props.reducedMotion} />
      <CameraRig {...props} />
      <Ready onReady={props.onReady} onError={props.onError} />
      <Preload all />
      {import.meta.env.DEV && <Diagnostics />}
    </Canvas>
  );
}
