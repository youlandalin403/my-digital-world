import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { PALETTE } from './roomAtmosphere';

// A small painted view within the existing window, not an outdoor scene.
export default function WindowView() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 192;
    const ctx = canvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, 192);
    sky.addColorStop(0, PALETTE.sky); sky.addColorStop(1, PALETTE.cream);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = PALETTE.distance;
    ctx.beginPath(); ctx.moveTo(0, 142); ctx.bezierCurveTo(80, 106, 150, 154, 256, 122);
    ctx.lineTo(256, 192); ctx.lineTo(0, 192); ctx.fill();
    ctx.fillStyle = PALETTE.foliage;
    ctx.beginPath(); ctx.moveTo(0, 169); ctx.bezierCurveTo(30, 131, 51, 166, 85, 151);
    ctx.bezierCurveTo(145, 134, 180, 180, 256, 150);
    ctx.lineTo(256, 192); ctx.lineTo(0, 192); ctx.fill();
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, 1.55, -2.54]}>
    <planeGeometry args={[1.39, 1.09]} />
    <meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}
