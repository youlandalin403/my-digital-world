// Metres, seconds and radians. Interior wall faces are at ±width/2, ±depth/2.
export const ROOM = Object.freeze({
  width: 6, depth: 5, height: 2.8, wallThickness: .15,
  eyeHeight: 1.65, playerRadius: .22, walkSpeed: 1.6,
  mouseSensitivity: .002, pitchLimit: Math.PI * 80 / 180,
  fov: 65, maxFrameDelta: .05,
  spawn: [0, 1.65, 1.55],
});

export const OBJECTS = Object.freeze({
  tea: { id: 'tea', position: [2.2, .88, -.95], interactionDistance: 1.5, label: 'Drink tea' },
  diary: { id: 'diary', position: [2.2, .815, .05], interactionDistance: 1.5, label: 'Open diary' },
  guestbook: { id: 'guestbook', position: [-2.96, 1.6, -.2], interactionDistance: 2, label: 'Read guestbook' },
});

// Conservative furniture footprints; the player slides along expanded AABBs.
export const OBSTACLES = Object.freeze([
  { id: 'desk', minX: 2, maxX: 2.8, minZ: -1.3, maxZ: .5 },
  { id: 'chair', minX: 1.3, maxX: 1.8, minZ: -.625, maxZ: -.175 },
  { id: 'bed', minX: -2.965, maxX: -.835, minZ: -2.365, maxZ: -1.335 },
  { id: 'bookcase', minX: 1.16, maxX: 2.14, minZ: -2.37, maxZ: -2.01 },
  { id: 'closet', minX: -2.885, maxX: -2.355, minZ: 1.18, maxZ: 2.12 },
  { id: 'nightstand', minX: -.8, maxX: -.3, minZ: -2.135, maxZ: -1.665 },
]);




