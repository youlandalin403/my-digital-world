import { useMemo } from "react";
import { Vector3, Quaternion } from "three";
import { random } from "../world/procedural";
import Instances from "../world/Instances";
import { MAP_CONFIG as C } from "./mapConfig";
const palette = ["#475d3f", "#5d724b", "#77885a", "#879669"];
export default function MapVegetation({ reducedMotion }) {
  const data = useMemo(() => {
    const rng = random(C.vegetation.seed),
      branches = [],
      leaves = [],
      grass = [];
    function limb(from, to, radius) {
      const a = new Vector3(...from),
        b = new Vector3(...to),
        direction = b.clone().sub(a);
      branches.push({
        position: a.add(b).multiplyScalar(0.5).toArray(),
        scale: [radius, direction.length(), radius],
        quaternion: new Quaternion().setFromUnitVectors(
          new Vector3(0, 1, 0),
          direction.normalize(),
        ),
        color: "#62634a",
      });
    }
    function crown(x, y, z, r, count) {
      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2,
          rad = Math.sqrt(rng()) * r,
          size = 0.4 + rng() * 0.65;
        leaves.push({
          position: [
            x + Math.cos(angle) * rad,
            y + (rng() - 0.5) * r * 0.85,
            z + Math.sin(angle) * rad,
          ],
          scale: [size, size * 1.2, size],
          rotation: [rng() * 3, rng() * 6, rng() * 3],
          color: palette[Math.floor(rng() * 4)],
        });
      }
    }
    // A broad, asymmetric old tree: buttress roots, split trunk, long lateral limbs.
    limb([0, 0.4, 7], [1.4, 9, 7], 1.7);
    limb([1.4, 8, 7], [-1, 15, 6], 1.15);
    limb([1, 8, 7], [4, 13, 8], 0.85);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      limb([0, 2.5, 7], [Math.cos(a) * 4, 0.55, 7 + Math.sin(a) * 4], 0.55);
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2,
        reach = 5 + rng() * 6,
        y = 13 + rng() * 6;
      const end = [Math.cos(a) * reach, y, 7 + Math.sin(a) * reach];
      limb([1, 8 + rng() * 5, 7], end, 0.23 + rng() * 0.38);
      crown(...end, 3.5 + rng(), 380);
    }
    // Forest boundaries frame an inhabited clearing rather than an isolated board.
    for (let i = 0; i < C.vegetation.perimeterTrees; i++) {
      const a = rng() * Math.PI * 2,
        r = 66 + rng() * 24,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r - 3;
      if ((z > 55 && Math.abs(x) < 14) || (x > 45 && x < 79 && z > 5 && z < 37))
        continue;
      const h = 7 + rng() * 7;
      limb([x, 0, z], [x + 0.4, h * 0.85, z], 0.25 + rng() * 0.22);
      for (let j = 0; j < 4; j++) {
        const b = (j * Math.PI) / 2,
          ex = x + Math.cos(b) * 2,
          ez = z + Math.sin(b) * 2;
        limb([x, h * 0.5, z], [ex, h, ez], 0.09);
        crown(ex, h, ez, 2.7, C.vegetation.leavesPerCrown);
      }
    }
    // Greenhouse planting is visible through its roof. Vegetation also breaks the
    // edges of the public buildings and grows over the archive retaining wall.
    for (const [x, y, z, r] of [
      [-36, 2, 24, 3],
      [-27, 3, 21, 3],
      [-30, 2, 30, 3],
      [-36, 2, -21, 3],
      [-19, 1, -6, 2],
      [35, 2, -21, 3],
      [19, 1, -7, 2],
      [22, 0, 19, 2],
      [36, 0, 19, 2],
      [58, 4, 14, 3],
      [71, 5, 18, 4],
      [-6, 2, -45, 2],
      [6, 3, -45, 2],
    ])
      crown(x, y, z, r, 300);
    for (const [x, y, z, length] of [
      [-35, 11, -9, 7],
      [-20, 11, -21, 5],
      [34, 8, -18, 5],
      [26, 6, 9, 4],
      [20, 0, 23, 3],
    ]) {
      for (let i = 0; i < length * 45; i++) {
        const t = rng(),
          s = 0.25 + rng() * 0.4;
        leaves.push({
          position: [x + (rng() - 0.5) * 2, y - t * length, z + (rng() - 0.5)],
          scale: [s, s * 1.4, s],
          rotation: [rng(), rng() * 3, rng() * 3],
          color: palette[Math.floor(rng() * 4)],
        });
      }
    }
    for (let i = 0; i < C.vegetation.grass; i++) {
      const a = rng() * Math.PI * 2,
        r = 40 + rng() * 48,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (Math.abs(x) < 6 && z > 35) continue;
      if (x > 17 && x < 40 && z > 14 && z < 40) continue;
      if (x > 46 && x < 82 && z > 2 && z < 39) continue;
      grass.push({
        position: [x, 0.03, z],
        scale: [1, 0.25 + rng() * 0.6, 1],
        rotation: [0, rng() * 6, 0],
        color: palette[Math.floor(rng() * 4)],
      });
    }
    return { branches, leaves, grass };
  }, []);
  return (
    <>
      <Instances items={data.branches} kind="branch" castShadow />
      <Instances
        items={data.leaves}
        kind="leaf"
        castShadow
        wind={!reducedMotion}
      />
      <Instances items={data.grass} kind="grass" wind={!reducedMotion} />
    </>
  );
}
