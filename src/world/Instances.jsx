import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Color, DoubleSide } from "three";
import { grassGeometry, leafGeometry, windMaterial } from "./procedural";
import { WORLD_CONFIG as C } from "../config/worldConfig";
export default function Instances({
  items,
  kind,
  color = "#62774b",
  castShadow = false,
  wind = false,
}) {
  const ref = useRef(),
    time = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(
    () =>
      kind === "leaf"
        ? leafGeometry()
        : kind === "grass"
          ? grassGeometry()
          : null,
    [kind],
  );
  useLayoutEffect(() => {
    const dummy = new Object3D(),
      c = new Color();
    items.forEach((item, i) => {
      dummy.position.fromArray(item.position);
      dummy.scale.fromArray(item.scale || [1, 1, 1]);
      dummy.rotation.set(...(item.rotation || [0, 0, 0]));
      if (item.quaternion) dummy.quaternion.copy(item.quaternion);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      ref.current.setColorAt(i, c.set(item.color || color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items, color]);
  useFrame((_, delta) => {
    if (wind && !document.hidden) time.value += Math.min(delta, 0.06);
  });
  return (
    <instancedMesh
      ref={ref}
      args={[null, null, items.length]}
      castShadow={castShadow}
      receiveShadow
      geometry={geometry || undefined}
    >
      {kind === "branch" && <cylinderGeometry args={[0.55, 1, 1, 6]} />}
      {kind === "rock" && <icosahedronGeometry args={[1, 1]} />}
      <meshStandardMaterial
        roughness={0.95}
        side={kind === "branch" ? 0 : DoubleSide}
        onBeforeCompile={
          wind
            ? (shader) => windMaterial(shader, time, C.vegetation.wind)
            : undefined
        }
        customProgramCacheKey={() => (wind ? "wind" : "still")}
      />
    </instancedMesh>
  );
}
