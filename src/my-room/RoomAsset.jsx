import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { ROOM_ASSETS } from './roomAssets';
import { atmosphereModel } from './roomAtmosphere';

export default function RoomAsset({ name, children }) {
  const { url, position, rotation, scale, pivot = [0, 0, 0] } = ROOM_ASSETS[name];
  const { scene } = useGLTF(url);
  const { model, materials } = useMemo(() => atmosphereModel(scene, name), [scene, name]);
  const gl = useThree(state => state.gl);
  useEffect(() => {
    // Furniture is static: refresh only when a model mounts, not on camera motion.
    gl.shadowMap.needsUpdate = true;
    return () => { materials.forEach(material => material.dispose()); gl.shadowMap.needsUpdate = true; };
  }, [gl, materials]);
  return <group position={position} rotation={rotation} scale={scale}>
    <group position={pivot}><primitive object={model} dispose={null} /></group>{children}
  </group>;
}
