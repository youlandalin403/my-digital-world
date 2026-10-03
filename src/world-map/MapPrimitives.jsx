import { useLayoutEffect, useRef } from "react";
import { Object3D, Color } from "three";
import { MAP_CONFIG as C } from "./mapConfig";
export const box = (
  position,
  scale,
  color = C.colors.stone,
  rotation = [0, 0, 0],
) => ({ position, scale, color, rotation });
export function StoneBatch({ items, muted = false }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const object = new Object3D(),
      color = new Color();
    items.forEach((item, i) => {
      object.position.fromArray(item.position);
      object.scale.fromArray(item.scale);
      object.rotation.set(...item.rotation);
      object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
      color.set(item.color);
      if (muted) color.multiplyScalar(0.8);
      ref.current.setColorAt(i, color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items, muted]);
  return (
    <instancedMesh
      ref={ref}
      args={[null, null, items.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry />
      <meshStandardMaterial roughness={0.92} />
    </instancedMesh>
  );
}
export function Disk({
  position,
  radius,
  height = 0.3,
  color = C.colors.stone,
}) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <cylinderGeometry args={[radius, radius, height, 64]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}
