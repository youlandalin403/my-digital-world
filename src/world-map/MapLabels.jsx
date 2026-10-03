import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { PLACES } from "./mapConfig";
export function LabelPositions({ nodes }) {
  const positions = useMemo(
    () =>
      Object.entries(PLACES).map(([id, p]) => [id, new Vector3(...p.label)]),
    [],
  );
  const screen = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld();
    for (const [id, position] of positions) {
      const node = nodes.current[id];
      if (!node) continue;
      screen.copy(position).project(camera);
      const rawX = (screen.x * 0.5 + 0.5) * size.width;
      const halfWidth = node.offsetWidth / 2;
      const x = Math.max(halfWidth + 8, Math.min(size.width - halfWidth - 8, rawX));
      let y = (-screen.y * 0.5 + 0.5) * size.height;
      if (size.width < 620 && id === "constellation") y -= 14;
      node.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
      node.hidden =
        screen.z > 1 ||
        screen.z < -1 ||
        rawX < 0 ||
        rawX > size.width ||
        y < (size.width < 620 ? 180 : 85) ||
        y > size.height - 130;
    }
  });
  return null;
}
export default function MapLabels({
  nodes,
  selected,
  onSelect,
  onHover,
  covered,
}) {
  return (
    <div
      className="map-label-layer"
      aria-hidden={covered}
      inert={covered ? true : undefined}
    >
      {Object.entries(PLACES).map(([id, p]) => (
        <button
          key={id}
          ref={(node) => {
            nodes.current[id] = node;
          }}
          className={`map-label ${selected === id ? "selected" : ""} ${selected && selected !== id ? "muted" : ""}`}
          onClick={() => onSelect(id)}
          onMouseEnter={() => onHover(id)}
          onMouseLeave={() => onHover(null)}
          aria-label={`Focus ${p.name}`}
          aria-pressed={selected === id}
        >
          {p.name}
          {p.access !== "public" && (
            <span
              className="label-lock"
              aria-label={
                p.access === "protected" ? "Invitation required" : "Locked"
              }
            >
              ◇
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
