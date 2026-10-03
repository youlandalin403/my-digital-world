import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { MAP_CONFIG as C, PLACES } from "./mapConfig";
export default function MapCamera({ state, reducedMotion }) {
  const look = useRef(new Vector3(...C.camera.target));
  const destination = useMemo(() => {
    if (!state.selectedPlace)
      return {
        position: new Vector3(...C.camera.position),
        target: new Vector3(...C.camera.target),
      };
    const p = PLACES[state.selectedPlace],
      target = new Vector3(...p.position);
    target.y += p.focusHeight;
    const factor =
      state.mode === "transition" || state.mode === "placeholder" ? 0.65 : 1;
    const position = target
      .clone()
      .add(new Vector3(...C.camera.focusOffset).multiplyScalar(factor));
    return { position, target };
  }, [state]);
  useFrame(({ camera }, delta) => {
    const factor = reducedMotion
      ? 1
      : 1 - Math.exp((-delta * 4) / C.camera.duration);
    camera.position.lerp(destination.position, factor);
    look.current.lerp(destination.target, factor);
    camera.lookAt(look.current);
    // Preserve horizontal geography on narrow viewports without an unrestricted camera.
    camera.fov =
      camera.aspect < 1
        ? Math.min(88, C.camera.fov / camera.aspect)
        : C.camera.fov;
    camera.updateProjectionMatrix();
  });
  return null;
}
