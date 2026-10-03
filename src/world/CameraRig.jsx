import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3 } from "three";
import { WORLD_CONFIG as C } from "../config/worldConfig";
const smooth = (t) => t * t * (3 - 2 * t);
export default function CameraRig({
  active,
  entering,
  onReveal,
  onEnd,
  reducedMotion,
}) {
  const elapsed = useRef(0),
    enterTime = useRef(0),
    revealed = useRef(false),
    ended = useRef(false);
  const resumed = useRef(false);
  useEffect(() => {
    const onVisibility = () => { resumed.current = true; };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  const [path, look] = useMemo(
    () =>
      [C.camera.path, C.camera.targets].map(
        (points) => new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
      ),
    [],
  );
  const target = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, delta) => {
    if (document.hidden) return;
    // Preserve real pacing when the browser throttles a visible preview. Discard
    // only the first delta after visibility changes, so hidden time never jumps ahead.
    const dt = resumed.current ? 0 : delta;
    resumed.current = false;
    if (active) elapsed.current += dt;
    const t = reducedMotion
      ? 1
      : smooth(Math.min(elapsed.current / C.camera.duration, 1));
    path.getPoint(t, camera.position);
    look.getPoint(t, target);
    if (
      active &&
      (reducedMotion || elapsed.current > C.camera.duration + C.camera.pause) &&
      !revealed.current
    ) {
      revealed.current = true;
      onReveal();
    }
    if (entering) {
      enterTime.current += dt;
      const p = smooth(Math.min(enterTime.current / C.camera.enterDuration, 1));
      if (!reducedMotion) {
        camera.position.lerp(new Vector3(...C.camera.enterPosition), p);
        target.lerp(new Vector3(...C.camera.enterTarget), p);
      }
      if (p === 1 && !ended.current) {
        ended.current = true;
        onEnd();
      }
    }
    if (camera.aspect < 1)
      camera.position.z += (1 - camera.aspect) * C.camera.portraitRetreat;
    camera.fov = camera.aspect < 1 ? C.camera.portraitFov : C.camera.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
  });
  return null;
}
