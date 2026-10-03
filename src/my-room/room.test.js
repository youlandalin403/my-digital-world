import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, Vector2 } from 'three';
import { ROOM, OBJECTS, OBSTACLES } from './roomConfig.js';
import { lookAngles, movePlayer } from './movement.js';
import { resolveInteraction } from './interaction.js';

test('walking is frame-rate independent, normalized diagonally, horizontal and yaw-relative', () => {
  const keys = new Set(['KeyW']), start = { x: 0, y: 0, z: 1.55 };
  const simulate = fps => { let p = start; for (let i = 0; i < fps; i++) p = movePlayer(p, 0, keys, 1 / fps, []); return p; };
  assert.ok(Math.abs(simulate(30).z - simulate(120).z) < 1e-10);
  assert.ok(Math.abs(simulate(60).z - (start.z - ROOM.walkSpeed)) < 1e-10);
  assert.equal(simulate(60).y, ROOM.eyeHeight);
  const straight = movePlayer(start, 0, keys, .05, []);
  const diagonal = movePlayer(start, 0, new Set(['KeyW', 'KeyD']), .05, []);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z - start.z) - Math.abs(straight.z - start.z)) < 1e-10);
  const turned = movePlayer(start, Math.PI / 2, keys, .05, []);
  assert.ok(turned.x < 0); assert.equal(turned.z, start.z);
  assert.deepEqual(movePlayer(start, 0, new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']), .05, []), { ...start, y: ROOM.eyeHeight });
  assert.deepEqual(movePlayer(start, 0, new Set(['ShiftLeft', 'Space']), .05, []), { ...start, y: ROOM.eyeHeight });
  assert.deepEqual(movePlayer(start, 0, new Set(['KeyW', 'ShiftLeft']), .05, []), straight);
  assert.deepEqual(movePlayer(start, 0, keys, 10, []), straight);
});

test('room bounds, furniture footprints and sliding never allow escape or tunnelling', () => {
  for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
    let p = { x: -1, y: ROOM.eyeHeight, z: 0 };
    for (let i = 0; i < 2000; i++) p = movePlayer(p, 0, new Set([key]), .05);
    assert.ok(Math.abs(p.x) <= ROOM.width / 2 - ROOM.playerRadius);
    assert.ok(Math.abs(p.z) <= ROOM.depth / 2 - ROOM.playerRadius);
  }
  for (const box of OBSTACLES) {
    let p = { x: (box.minX + box.maxX) / 2, y: ROOM.eyeHeight, z: box.maxZ + .5 };
    for (let i = 0; i < 200; i++) p = movePlayer(p, 0, new Set(['KeyW']), 1, [box]);
    assert.ok(p.z >= box.maxZ + ROOM.playerRadius);
  }
  let p = { x: 2.78, y: ROOM.eyeHeight, z: 0 };
  p = movePlayer(p, 0, new Set(['KeyW', 'KeyD']), .05, []);
  assert.equal(p.x, 2.78); assert.ok(p.z < 0);
});

test('look sensitivity is moderate; pitch is clamped and yaw remains finite', () => {
  assert.deepEqual(lookAngles(0, 0, 100, 50), { yaw: -.2, pitch: -.1 });
  assert.equal(lookAngles(0, 0, 0, 100000).pitch, -ROOM.pitchLimit);
  assert.equal(lookAngles(0, 0, 0, -100000).pitch, ROOM.pitchLimit);
  assert.ok(Math.abs(lookAngles(0, 0, 1e6, 0).yaw) < Math.PI * 2);
});

test('actual center ray requires a registered nearest target in range and honors occlusion', () => {
  const scene = new Scene(), target = new Group(), registry = new Map();
  const geometry = new BoxGeometry(.2, .2, .2), material = new MeshBasicMaterial();
  const mesh = new Mesh(geometry, material); target.add(mesh); target.position.set(0, 0, -1);
  scene.add(target); registry.set(target, { ...OBJECTS.tea, target });
  const camera = new PerspectiveCamera(65, 1, .05, 30), ray = new Raycaster();
  const detect = () => { scene.updateMatrixWorld(true); camera.updateMatrixWorld(); ray.setFromCamera(new Vector2(), camera); return resolveInteraction(ray.intersectObjects(scene.children, true), registry); };
  assert.equal(detect()?.id, 'tea');
  target.position.z = -3; assert.equal(detect(), null);
  target.position.set(2, 0, -1); assert.equal(detect(), null);
  target.position.set(0, 0, -1);
  const blocker = new Mesh(geometry, material); blocker.position.z = -.5; scene.add(blocker); assert.equal(detect(), null);
  scene.remove(blocker); assert.equal(detect()?.id, 'tea');
  const hit = { object: mesh, distance: 1.5 };
  assert.equal(resolveInteraction([hit], registry)?.id, 'tea');
  assert.equal(resolveInteraction([{ ...hit, distance: 1.5001 }], registry), null);
  registry.delete(target); assert.equal(detect(), null);
  geometry.dispose(); material.dispose();
});
