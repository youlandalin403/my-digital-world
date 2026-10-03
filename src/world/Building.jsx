import { useMemo } from "react";
import { Shape, ExtrudeGeometry } from "three";
import { WORLD_CONFIG as C } from "../config/worldConfig";
import { stoneTexture } from "./procedural";
let texture;
export function Stone({ position, scale, color = C.colors.stone, rotation }) {
  texture ??= stoneTexture();
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <boxGeometry />
      <meshStandardMaterial map={texture} color={color} roughness={0.96} />
    </mesh>
  );
}
export default function Building() {
  const { width: w, height: h, entranceWidth: door } = C.building;
  const arch = useMemo(() => {
    const r = door / 2,
      shape = new Shape();
    shape.moveTo(-r - 1, 0);
    shape.lineTo(-r - 1, r + 2);
    shape.lineTo(r + 1, r + 2);
    shape.lineTo(r + 1, 0);
    shape.lineTo(r, 0);
    shape.absarc(0, 0, r, 0, Math.PI, false);
    shape.lineTo(-r - 1, 0);
    return new ExtrudeGeometry(shape, {
      depth: 2.8,
      bevelEnabled: false,
      curveSegments: 40,
    });
  }, [door]);
  return (
    <group position={C.building.position} scale={C.building.scale}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Stone
          key={i}
          position={[0, 0.12 + i * 0.19, 4.6 - i * 0.5]}
          scale={[w + 6 - i * 0.45, 0.24, 12 - i * 0.5]}
        />
      ))}
      <Stone position={[0, 1.35, -3]} scale={[w + 1, 0.35, 13]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Stone
            position={[side * (door / 2 + 2.3), h / 2 + 1.4, 0]}
            scale={[4.6, h, 2.8]}
          />
          <Stone
            position={[side * (w / 2 - 1), h / 2 + 1.4, -2.2]}
            scale={[2, h, 7.2]}
          />
          <Stone position={[side * 10.8, 9, -5.4]} scale={[6.4, 15, 1]} />
          {[8.6, 11.5].map((x) => (
            <Stone
              key={x}
              position={[side * x, 9.8, 1.15]}
              scale={[0.65, 16.8, 1.2]}
            />
          ))}
          <Stone position={[side * 10.4, 18.7, -0.3]} scale={[7.8, 3.2, 3.4]} />
          <Stone position={[side * 10.4, 2, 1.6]} scale={[8, 0.45, 2]} />
          <Stone position={[side * 20, 5.7, -5.8]} scale={[10, 8.5, 1]} />
          {[16.7, 20, 23.3].map((x) => (
            <group key={x}>
              <Stone position={[side * x, 5.4, 0]} scale={[0.6, 8, 1]} />
              <Stone position={[side * x, 9.6, -2.5]} scale={[0.42, 0.48, 7]} />
            </group>
          ))}
          <Stone position={[side * 20, 9.7, 0]} scale={[10, 0.65, 1.2]} />
          <Stone position={[side * 25, 3.5, -2.5]} scale={[0.85, 4.5, 6]} />
        </group>
      ))}
      <mesh geometry={arch} position={[0, 12.6, -1.4]} castShadow receiveShadow>
        <meshStandardMaterial
          color={C.colors.stone}
          map={texture}
          roughness={0.96}
        />
      </mesh>
      <Stone position={[0, 19.6, 0]} scale={[door + 2, 3.6, 2.8]} />
      <Stone position={[0, h + 1.6, -2]} scale={[w + 1, 0.6, 7]} />
      <Stone position={[0, h + 2, -2]} scale={[w + 1.5, 0.2, 7.5]} />
      {/* A dark recess and daylight ribs suggest depth without building an interior. */}
      {[-1, 1].map((side) => (
        <Stone
          key={side}
          position={[side * 9, 7.5, -12]}
          scale={[12, 12, 1]}
          color={C.colors.stoneDark}
        />
      ))}
      <Stone
        position={[0, 1.1, -15]}
        scale={[6, 0.6, 1.5]}
        color={C.colors.stoneDark}
      />
      {[-door / 2 - 0.4, door / 2 + 0.4].map((x) => (
        <Stone key={x} position={[x, 8.5, -6]} scale={[0.8, 14, 10]} />
      ))}
      {[-7, -3, 1].map((z) => (
        <Stone key={z} position={[0, 18, z]} scale={[door + 2, 0.35, 0.32]} />
      ))}
      {[5.7, 10.1, 14.5, 18.9].map((y) =>
        [-1, 1].map((side) => (
          <Stone
            key={`${y}${side}`}
            position={[side * (door / 2 + 2.3), y, 1.408]}
            scale={[4.55, 0.022, 0.012]}
            color="#bdbda9"
          />
        )),
      )}
    </group>
  );
}
