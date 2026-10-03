import { useMemo } from "react";
import { box, StoneBatch, Disk } from "./MapPrimitives";
export default function CentralCourtyard() {
  const items = useMemo(() => {
    const a = [];
    // Broken cloisters connect both public wings around the courtyard.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++)
        a.push(box([side * (8 + i * 3), 3.5, -28], [0.5, 7, 0.6]));
      a.push(box([side * 14, 7.2, -28], [16, 0.5, 2.4]));
      for (let i = 0; i < 4; i++)
        a.push(box([side * 15, 3.5, -17 + i * 4], [0.5, 7, 0.5]));
    }
    for (const x of [-8, 8])
      a.push(
        box([x, 0.7, 17], [5, 0.45, 1]),
        box([x, 0.35, 17], [0.5, 0.7, 1]),
      );
    return a;
  }, []);
  return (
    <>
      <Disk position={[0, 0.11, 7]} radius={16} height={0.22} />
      <Disk position={[0, 0.25, 7]} radius={8} height={0.35} color="#6f7d59" />
      <StoneBatch items={items} />
    </>
  );
}
