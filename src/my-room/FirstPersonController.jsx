import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { lookAngles, movePlayer } from './movement';

export default function FirstPersonController({ active }) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set()), angles = useRef({ yaw: 0, pitch: 0 });
  useEffect(() => { camera.rotation.order = 'YXZ'; }, [camera]);
  useEffect(() => {
    keys.current.clear();
    const controlled = () => active && document.pointerLockElement === gl.domElement && !document.hidden;
    const down = event => {
      if (!controlled() || !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) return;
      event.preventDefault(); keys.current.add(event.code);
    };
    const up = event => keys.current.delete(event.code);
    const clear = () => keys.current.clear();
    const look = event => {
      if (!controlled()) return;
      angles.current = lookAngles(angles.current.yaw, angles.current.pitch, event.movementX, event.movementY);
      camera.rotation.set(angles.current.pitch, angles.current.yaw, 0, 'YXZ');
    };
    document.addEventListener('keydown', down); document.addEventListener('keyup', up);
    document.addEventListener('mousemove', look); document.addEventListener('pointerlockchange', clear);
    document.addEventListener('visibilitychange', clear); window.addEventListener('blur', clear);
    return () => {
      clear(); document.removeEventListener('keydown', down); document.removeEventListener('keyup', up);
      document.removeEventListener('mousemove', look); document.removeEventListener('pointerlockchange', clear);
      document.removeEventListener('visibilitychange', clear); window.removeEventListener('blur', clear);
    };
  }, [active, camera, gl]);
  useFrame((_state, delta) => {
    if (!active || document.pointerLockElement !== gl.domElement || document.hidden) return;
    const next = movePlayer(camera.position, angles.current.yaw, keys.current, delta);
    camera.position.set(next.x, next.y, next.z);
  }, -2);
  return null;
}
