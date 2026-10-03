import { useMemo } from "react";
import {
  Shape,
  Path,
  ShapeGeometry,
  CatmullRomCurve3,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
import { MAP_CONFIG as C } from "./mapConfig";
import { terrainTexture } from "../world/procedural";

function Road({ points, width = 3.2 }) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
        points.map(([x, y, z]) => new Vector3(x, y, z)),
      ),
      v = [],
      indices = [],
      uv = [];
    for (let i = 0; i <= 50; i++) {
      const t = i / 50,
        p = curve.getPoint(t),
        tangent = curve.getTangent(t),
        side = new Vector3(-tangent.z, 0, tangent.x)
          .normalize()
          .multiplyScalar(width / 2);
      v.push(
        p.x + side.x,
        p.y + 0.055,
        p.z + side.z,
        p.x - side.x,
        p.y + 0.055,
        p.z - side.z,
      );
      uv.push(0, t, 1, t);
      if (i < 50) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(v, 3));
    g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [points, width]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={C.colors.path} roughness={1} side={2} />
    </mesh>
  );
}
const roads = [
  [
    [0, 0, 75],
    [0, 0, 59],
    [0, 0, 37],
    [0, 0, 8],
  ],
  [
    [0, 0, 8],
    [-13, 0, 1],
    [-26, 0, -3],
    [-26, 0, -14],
  ],
  [
    [0, 0, 8],
    [13, 0, 1],
    [26, 0, -3],
    [26, 0, -14],
  ],
  [
    [-26, 0, -22],
    [0, 0, -28],
    [26, 0, -22],
  ],
  [
    [0, 0, -28],
    [0, 0, -32],
  ],
  [
    [-4, 0, 12],
    [-18, 0, 23],
    [-31, 0, 26],
  ],
  [
    [4, 0, 12],
    [16, 0, 33],
    [29, 0, 39],
  ],
  [
    [-31, 0, 26],
    [-24, 0, 44],
    [0, 0, 53],
    [24, 0, 44],
    [29, 0, 39],
  ],
  [
    [35, 0, -6],
    [43, 0, 2],
    [49, 1, 12],
    [57, 3.35, 20],
    [63, 3.45, 20],
  ],
];
export default function MapTerrain() {
  const texture = useMemo(() => terrainTexture(), []);
  const ground = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-220, -220);
    shape.lineTo(220, -220);
    shape.lineTo(220, 220);
    shape.lineTo(-220, 220);
    shape.closePath();
    const hole = new Path();
    hole.moveTo(20, -17);
    hole.lineTo(20, -38);
    hole.lineTo(38, -38);
    hole.lineTo(38, -17);
    hole.closePath();
    shape.holes.push(hole);
    const geometry = new ShapeGeometry(shape),
      uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) + 220) / 440, (uv.getY(i) + 220) / 440);
    return geometry;
  }, []);
  return (
    <>
      <mesh geometry={ground} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial
          color={C.colors.ground}
          map={texture}
          roughness={1}
        />
      </mesh>
      {roads.map((points, i) => (
        <Road key={i} points={points} />
      ))}
      <mesh position={[63, 0.4, 20]} scale={[17, 3, 15]} receiveShadow>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color={C.colors.ground} roughness={1} />
      </mesh>
    </>
  );
}
