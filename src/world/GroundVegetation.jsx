import { useMemo } from "react";
import { WORLD_CONFIG as C } from "../config/worldConfig";
import { random } from "./procedural";
import Instances from "./Instances";
export default function GroundVegetation({ reducedMotion }) {
  const { grass, ferns, ivy, rocks } = useMemo(() => {
    const rng = random(188),
      grass = [],
      ferns = [],
      ivy = [],
      rocks = [];
    for (let i = 0; i < C.vegetation.grass; i++) {
      const x = (rng() - 0.5) * 64,
        z = rng() * 80 - 12,
        pathX = z > 15 ? -(z - 15) * 0.18 : 0;
      if (Math.abs(x - pathX) < 3.5 && z > 0 && rng() > 0.035) continue;
      if (z < -4 && Math.abs(x) < 25) continue;
      const patch = 0.5 + 0.5 * Math.sin(x * 0.4 + Math.sin(z * 0.2) * 2);
      if (rng() > patch * 0.85 + 0.15) continue;
      grass.push({
        position: [x, 0.025, z],
        scale: [0.7 + rng(), 0.18 + rng() * 0.65, 1],
        rotation: [0, rng() * Math.PI * 2, 0],
        color: C.colors.leaves[Math.floor(rng() * 4)],
      });
    }
    function fern(x, y, z, size) {
      const fronds = 6 + Math.floor(rng() * 4);
      for (let j = 0; j < fronds; j++) {
        const angle = (j / fronds) * Math.PI * 2 + rng() * 0.3;
        for (let k = 1; k < 9; k++) {
          const t = k / 9,
            reach = t * size,
            py = y + Math.sin(t * Math.PI * 0.8) * size * 0.65;
          for (const side of [-1, 1]) {
            const spread = (1 - t) * size * 0.32;
            ferns.push({
              position: [
                x + Math.cos(angle) * reach,
                py,
                z + Math.sin(angle) * reach,
              ],
              scale: [spread * 0.8, spread * 2, spread],
              rotation: [Math.PI * 0.48, angle + side * 0.65, -side * 0.65],
              color: C.colors.leaves[Math.floor(rng() * 4)],
            });
          }
        }
      }
    }
    for (let i = 0; i < 150; i++) {
      const z = rng() * 66 - 7,
        x =
          (i % 2 ? 1 : -1) * (4 + rng() * 20) - (z > 20 ? (z - 20) * 0.12 : 0);
      fern(x, 0, z, 0.65 + rng() * 1.3);
    }
    const s = C.building.scale,
      b = C.building.position;
    for (let i = 0; i < 115; i++) {
      const x = (rng() - 0.5) * 32,
        z = -1 + rng() * 8;
      if (Math.abs(x) < 3 && rng() > 0.15) continue;
      let y = 0.24;
      for (let step = 0; step < 7; step++)
        if (z <= 10.6 - 0.75 * step) y = 0.24 + 0.19 * step;
      if (z <= 3.5) y = 1.525;
      fern(b[0] + x * s, b[1] + y * s, b[2] + z * s, (0.35 + rng() * 0.65) * s);
    }
    for (const [x, top, len, z] of [
      [-7, 21, 15, 1.65],
      [6.7, 21, 8, 1.65],
      [-13, 21, 5, 1.65],
      [18, 10, 7, 0.7],
      [-21, 10, 5, 0.7],
      [3.7, 16, 4, 1.65],
    ]) {
      for (let i = 0; i < len * 85; i++) {
        const t = rng(),
          width = (1 - t) * 2.8 + 0.12,
          xx = x + Math.sin(t * 9) * 0.5 + (rng() - 0.5) * width,
          size = 0.12 + rng() * 0.3;
        if (t > 0.25 && Math.sin(t * 42) > 0.65) continue;
        ivy.push({
          position: [
            b[0] + xx * s,
            b[1] + (top - t * len) * s,
            b[2] + (z + rng() * 0.35) * s,
          ],
          scale: [size * s, size * 1.35 * s, size * s],
          rotation: [0.2 + (rng() - 0.5) * 0.7, rng() * 0.8, (rng() - 0.5) * 2],
          color: C.colors.leaves[Math.floor(rng() * 4)],
        });
      }
    }
    for (let i = 0; i < 160; i++) {
      const z = rng() * 70 - 9,
        x = (i % 2 ? 1 : -1) * (4 + rng() * 25),
        size = 0.1 + rng() * 0.4;
      rocks.push({
        position: [x, size * 0.15, z],
        scale: [size * 2, size, size * 1.3],
        rotation: [0, rng() * 6, 0],
        color: i % 3 ? "#7a7c61" : "#969982",
      });
    }
    return { grass, ferns, ivy, rocks };
  }, []);
  return (
    <>
      <Instances items={grass} kind="grass" wind={!reducedMotion} />
      <Instances items={ferns} kind="leaf" wind={!reducedMotion} />
      <Instances items={ivy} kind="leaf" wind={!reducedMotion} />
      <Instances items={rocks} kind="rock" />
    </>
  );
}
