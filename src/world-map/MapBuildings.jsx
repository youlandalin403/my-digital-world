import { useMemo } from "react";
import { box, StoneBatch, Disk } from "./MapPrimitives";
import { PLACES, MAP_CONFIG as C } from "./mapConfig";

function Gallery({ muted }) {
  const items = useMemo(() => {
    const a = [
      box([0, 0.4, 0], [21, 0.8, 22]),
      box([0, 11, -2], [20, 0.7, 18]),
      box([0, 5, -9], [20, 10, 1]),
      box([-9.5, 5, -1], [1, 10, 17]),
    ];
    for (const x of [-8, -4, 0, 4, 8])
      a.push(box([x, 5.3, 7], [0.65, 9.8, 0.8]));
    for (let i = 0; i < 4; i++)
      a.push(box([0, 0.1 + i * 0.16, 11 - i * 0.7], [21, 0.2, 3]));
    a.push(
      box([4, 5, -1], [0.6, 9, 13]),
      box([0, 6.5, -8.4], [13, 3, 0.1], C.colors.shadow),
    );
    return a;
  }, []);
  return <StoneBatch items={items} muted={muted} />;
}
function Laboratory({ muted }) {
  const items = useMemo(() => {
    const a = [
      box([0, 0.4, 0], [22, 0.8, 22]),
      box([0, 4, -3], [21, 8, 14]),
      box([0, 8.3, -3], [22, 0.6, 15]),
      box([-6, 10, -4], [6, 3, 8]),
      box([6, 9.6, -3], [5, 2.5, 5]),
      box([2, 3.5, 7], [17, 6, 6]),
    ];
    for (const x of [-8, -4, 0, 4, 8])
      a.push(
        box([x, 4, 4.1], [2.3, 4, 0.15], C.colors.shadow),
        box([x, 6.9, 10], [0.35, 0.35, 5], C.colors.bronze),
      );
    for (const x of [-6, 0, 6])
      a.push(box([x, 9.2, -2], [0.3, 1.4, 12], C.colors.bronze));
    return a;
  }, []);
  return <StoneBatch items={items} muted={muted} />;
}
function Observatory({ muted }) {
  const items = useMemo(() => {
    const a = [
      box([0, -2, 0], [20, 4, 18]),
      box([0, 7, 0], [10, 14, 10]),
      box([0, 14.3, 0], [15, 0.8, 15]),
    ];
    for (let i = 0; i < 12; i++)
      a.push(box([0, -3.85 + i * 0.33, 16 - i * 0.6], [9, 0.35, 1.1]));
    for (const x of [-6, 6])
      for (const z of [-6, 6]) a.push(box([x, 17, z], [0.7, 5, 0.7]));
    a.push(
      box([0, 19.8, -6], [14, 0.6, 0.8]),
      box([0, 19.8, 6], [14, 0.6, 0.8]),
      box([-6.6, 19.8, 0], [0.8, 0.6, 12]),
      box([6.6, 19.8, 0], [0.8, 0.6, 12]),
    );
    for (const x of [-3, 0, 3])
      a.push(box([x, 8, 5.05], [0.7, 7, 0.1], C.colors.shadow));
    return a;
  }, []);
  return (
    <>
      <StoneBatch items={items} muted={muted} />
      <Disk position={[0, 15, 0]} radius={4.6} height={0.5} />
    </>
  );
}
function Constellation() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6, 0.12, 8, 80]} />
        <meshStandardMaterial color="#9aa894" roughness={0.6} />
      </mesh>
      <mesh rotation={[0.45, 0, 0.35]}>
        <torusGeometry args={[3.7, 0.09, 8, 64]} />
        <meshStandardMaterial color="#8b9884" roughness={0.6} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.45]} />
        <meshStandardMaterial color="#e6e6ce" />
      </mesh>
    </group>
  );
}
function IdeaGarden({ muted }) {
  const items = useMemo(() => {
    const a = [
      box([0, 0.3, 0], [20, 0.6, 17]),
      box([-9, 1, 0], [0.6, 1.4, 16]),
      box([9, 1, 0], [0.6, 1.4, 16]),
      box([0, 1, -8], [18, 1.4, 0.6]),
    ];
    for (const x of [-9, -4.5, 0, 4.5, 9])
      a.push(
        box([x, 4, -7.7], [0.18, 7, 0.18], C.colors.bronze),
        box([x, 4, 7.7], [0.18, 7, 0.18], C.colors.bronze),
        box([x, 8, 0], [0.18, 0.2, 16], C.colors.bronze),
      );
    for (const y of [3.5, 7.5])
      for (const z of [-7.7, 7.7])
        a.push(box([0, y, z], [18, 0.15, 0.15], C.colors.bronze));
    return a;
  }, []);
  return (
    <>
      <StoneBatch items={items} muted={muted} />
      <mesh position={[0, 7.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial
          color="#b9d4be"
          transparent
          opacity={0.19}
          roughness={0.3}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
function MemoryArchive({ muted }) {
  const items = useMemo(() => {
    const a = [
      box([0, -4.1, 1.5], [18, 0.4, 21], "#768171"),
      box([-8.8, -2, 1.5], [0.6, 4, 21]),
      box([8.8, -2, 1.5], [0.6, 4, 21]),
      box([0, -1.7, -8.7], [18, 4.6, 0.7]),
      box([0, -2, -8.25], [7, 3.6, 0.15], "#38493f"),
      box([0, 0.9, -7.5], [12, 0.7, 5]),
    ];
    for (let i = 0; i < 12; i++)
      a.push(box([0, -0.15 - i * 0.33, 11 - i * 1.05], [7, 0.35, 1.1]));
    return a;
  }, []);
  return <StoneBatch items={items} muted={muted} />;
}
function Guestbook({ muted }) {
  const items = useMemo(
    () => [
      box([0, 0.2, 0], [9, 0.4, 8]),
      box([0, 5.1, 0], [9, 0.45, 7]),
      ...[-3.5, 3.5].flatMap((x) =>
        [-2.5, 2.5].map((z) => box([x, 2.7, z], [0.3, 5, 0.3])),
      ),
      box([0, 1.6, 1], [1.8, 1.3, 1.2], "#7b806b"),
      box([0, 0.7, 1], [0.45, 1.5, 0.45]),
      box([0, 1.85, 1.61], [1.2, 0.13, 0.02], "#334237"),
    ],
    [],
  );
  return <StoneBatch items={items} muted={muted} />;
}
function ProtectedRoom({ muted }) {
  const items = useMemo(
    () => [
      box([0, 0.2, 0], [12, 0.4, 11]),
      box([0, 3, 0], [10, 5.6, 8], "#d4cdb9"),
      box([0, 6, 0], [11, 0.5, 9]),
      box([0, 3, 4.03], [5, 2.7, 0.1], "#b49967"),
      box([0, 3, 4.1], [0.15, 2.7, 0.1], C.colors.bronze),
      box([0, 1.6, 5.5], [11, 0.25, 3]),
      box([2, 6.8, -1], [1.1, 1.4, 1.1]),
    ],
    [],
  );
  return (
    <>
      <StoneBatch items={items} muted={muted} />
      <mesh position={[0, 3, 4.11]}>
        <planeGeometry args={[4.7, 2.4]} />
        <meshStandardMaterial
          color="#d5b77f"
          emissive="#a37b3b"
          emissiveIntensity={0.35}
        />
      </mesh>
    </>
  );
}
const components = {
  gallery: Gallery,
  laboratory: Laboratory,
  observatory: Observatory,
  constellation: Constellation,
  garden: IdeaGarden,
  archive: MemoryArchive,
  guestbook: Guestbook,
  room: ProtectedRoom,
};
export default function MapBuildings({ selected, onSelect, onHover }) {
  return Object.entries(components).map(([id, Component]) => (
    <group
      key={id}
      position={PLACES[id].position}
      onClick={(e) => {
        e.stopPropagation();
        if (import.meta.env.DEV) console.debug("Map building selected:", id);
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <Component muted={!!selected && selected !== id} />
    </group>
  ));
}
