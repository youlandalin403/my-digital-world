import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import { resolveInteraction } from './interaction';

const Registry = createContext(null);
export function Interactable({ id, position, interactionDistance, label, onInteract, children }) {
  const registry = useContext(Registry), target = useRef();
  useLayoutEffect(() => {
    const object = target.current;
    registry.set(object, { id, label, interactionDistance, target: object, onInteract });
    return () => registry.delete(object);
  }, [registry, id, label, interactionDistance, onInteract]);
  return <group ref={target} position={position}>{children}</group>;
}

function Detection({ registry, active, onFocus }) {
  const { camera, scene, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []), center = useMemo(() => new Vector2(), []);
  const previous = useRef(null);
  const detect = () => {
    if (!active || document.pointerLockElement !== gl.domElement || document.hidden) return null;
    camera.updateMatrixWorld(); scene.updateMatrixWorld();
    ray.setFromCamera(center, camera);
    return resolveInteraction(ray.intersectObjects(scene.children, true), registry);
  };
  useFrame(() => {
    const entry = detect();
    if (entry?.id !== previous.current?.id) { previous.current = entry; onFocus(entry ? { id: entry.id, label: entry.label } : null); }
  }, -1);
  useEffect(() => {
    if (!active) { previous.current = null; onFocus(null); }
    const interact = event => {
      if (event.code !== 'KeyE' || event.repeat || event.isComposing) return;
      const entry = detect(); // Revalidate at keypress, never trust an old prompt.
      if (entry) { event.preventDefault(); entry.onInteract(); }
    };
    document.addEventListener('keydown', interact);
    return () => document.removeEventListener('keydown', interact);
  });
  return null;
}

export default function InteractionManager({ active, onFocus, children }) {
  const registry = useMemo(() => new Map(), []);
  return <Registry.Provider value={registry}>
    {children}<Detection registry={registry} active={active} onFocus={onFocus} />
  </Registry.Provider>;
}
