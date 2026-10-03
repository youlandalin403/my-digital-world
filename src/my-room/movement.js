import { ROOM, OBSTACLES } from './roomConfig.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function lookAngles(yaw, pitch, movementX, movementY) {
  return {
    yaw: (yaw - movementX * ROOM.mouseSensitivity) % (2 * Math.PI),
    pitch: clamp(pitch - movementY * ROOM.mouseSensitivity, -ROOM.pitchLimit, ROOM.pitchLimit),
  };
}

export function movePlayer(position, yaw, keys, delta, obstacles = OBSTACLES) {
  const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const right = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  const length = Math.hypot(forward, right) || 1;
  const distance = ROOM.walkSpeed * clamp(delta, 0, ROOM.maxFrameDelta) / length;
  const dx = (right * Math.cos(yaw) - forward * Math.sin(yaw)) * distance;
  const dz = (-forward * Math.cos(yaw) - right * Math.sin(yaw)) * distance;
  const radius = ROOM.playerRadius;
  const fits = (x, z) => !obstacles.some(box => x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius);
  let x = position.x, z = position.z;
  // Small substeps prevent furniture tunnelling and allow sliding along an edge.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .04));
  for (let i = 0; i < steps; i++) {
    const nextX = clamp(x + dx / steps, -ROOM.width / 2 + radius, ROOM.width / 2 - radius);
    if (fits(nextX, z)) x = nextX;
    const nextZ = clamp(z + dz / steps, -ROOM.depth / 2 + radius, ROOM.depth / 2 - radius);
    if (fits(x, nextZ)) z = nextZ;
  }
  return { x, y: ROOM.eyeHeight, z };
}
