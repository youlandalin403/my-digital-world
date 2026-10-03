import { useMemo } from "react";
import { Vector3, Quaternion } from "three";
import { WORLD_CONFIG as C } from "../config/worldConfig";
import { random } from "./procedural";
import Instances from "./Instances";
function branch(a, b, r) {
  const from = new Vector3(...a),
    to = new Vector3(...b),
    dir = to.clone().sub(from);
  return {
    position: from.add(to).multiplyScalar(0.5).toArray(),
    scale: [r, dir.length(), r],
    quaternion: new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      dir.normalize(),
    ),
  };
}
export default function Forest({ reducedMotion }) {
  const data = useMemo(() => {
    const rng = random(C.vegetation.seed),
      trunks = [],
      leaves = [],
      trees = [];
    for (let i = 0; i < C.vegetation.trees; i++) {
      const z = -40 + rng() * 108,
        side = i % 2 ? 1 : -1,
        inner = z > 29 ? 8 : z > 5 ? 17 : 28;
      trees.push([side * (inner + rng() * 22), z, 10 + rng() * 10]);
    }
    trees.push(
      [2.5, 37, 13],
      [-8.5, 30, 15],
      [-15, 16, 17],
      [18, 12, 18],
      [-1, -35, 15],
      [6, -38, 18],
      [-7, -37, 16],
    );
    for (const [x, z, h] of trees) {
      const lean = (rng() - 0.5) * 2;
      trunks.push(branch([x, 0, z], [x + lean, h, z], 0.32 + rng() * 0.3));
      for (let j = 0; j < 9; j++) {
        const angle = rng() * Math.PI * 2,
          radius = 2 + rng() * 4,
          y = h * (0.48 + rng() * 0.46);
        const end = [
          x + Math.cos(angle) * radius,
          y + 1 + rng() * 2,
          z + Math.sin(angle) * radius,
        ];
        trunks.push(
          branch([x + lean * 0.5, y - 2, z], end, 0.07 + rng() * 0.09),
        );
        for (let k = 0; k < C.vegetation.leavesPerTree; k++) {
          const a = rng() * Math.PI * 2,
            rad = Math.sqrt(rng()) * 3.2,
            size = 0.28 + rng() * 0.53;
          leaves.push({
            position: [
              end[0] + Math.cos(a) * rad,
              end[1] + (rng() - 0.5) * 2.5,
              end[2] + Math.sin(a) * rad,
            ],
            scale: [size, size * (1 + rng()), size],
            rotation: [rng() * Math.PI, rng() * Math.PI * 2, rng() * Math.PI],
            color: C.colors.leaves[Math.floor(rng() * 4)],
          });
        }
      }
    }
    return { trunks, leaves };
  }, []);
  return (
    <>
      <Instances
        items={data.trunks}
        kind="branch"
        color={C.colors.bark}
        castShadow
      />
      <Instances
        items={data.leaves}
        kind="leaf"
        wind={!reducedMotion}
        castShadow
      />
    </>
  );
}
