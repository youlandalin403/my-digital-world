import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { WORLD_CONFIG as C } from "../config/worldConfig";
import { terrainTexture } from "./procedural";
export default function Environment() {
  const texture = useMemo(() => terrainTexture(), []);
  const path = useMemo(() => {
    const positions = [],
      indices = [],
      uv = [];
    for (let i = 0; i <= 80; i++) {
      const z = -4 + i * 0.9,
        x = z > 15 ? -(z - 15) * 0.18 : 0,
        w = 2.8 + Math.sin(z * 0.6) * 0.18 + (z < 8 ? (8 - z) * 0.25 : 0);
      positions.push(x - w, 0.03, z, x + w, 0.03, z);
      uv.push(0, i / 80, 1, i / 80);
      if (i < 80) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <>
      <color attach="background" args={[C.colors.sky]} />
      <fog attach="fog" args={[C.colors.sky, C.fog.near, C.fog.far]} />
      <hemisphereLight args={["#e0e9e6", "#777b57", C.lighting.ambient]} />
      <directionalLight
        position={C.lighting.sun}
        intensity={C.lighting.intensity}
        color="#fff6e4"
        castShadow
        shadow-mapSize={[C.performance.shadowSize, C.performance.shadowSize]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={50}
        shadow-camera-bottom={-45}
        shadow-camera-far={120}
        shadow-normalBias={0.07}
        shadow-bias={-0.0001}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial
          color={C.colors.ground}
          map={texture}
          roughness={1}
        />
      </mesh>
      <mesh geometry={path} receiveShadow>
        <meshStandardMaterial
          color={C.colors.path}
          map={texture}
          roughness={1}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 78, -3, -60]} scale={[65, 16, 25]}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial color="#788773" roughness={1} />
        </mesh>
      ))}
    </>
  );
}
