import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTree, radialLayout, pathToRoot, validateMove, validateDelete } from './tree.js';
import { createConstellationService } from '../services/constellation/service.js';

const rows = JSON.parse(readFileSync(new URL('../../tests/fixtures/constellation.json', import.meta.url)));
const model = buildTree(rows), find = name => rows.find(row => row.name === name);

test('canonical hierarchy has 60 nodes, ten branches, and arbitrary nested children', () => {
  assert.equal(model.nodes.size, 60); assert.equal(model.root.children.length, 10);
  assert.deepEqual(pathToRoot(model, find('Crochet / 钩织').id).map(n => n.name), ['MY INTERESTS', 'Art & Making', 'Crafts / 手作', 'Crochet / 钩织']);
  const deep = [...rows]; let parent = find('Agents').id;
  for (let i = 0; i < 100; i++) { deep.push({ ...rows[0], id: `depth-${i}`, parent_id: parent }); parent = `depth-${i}`; }
  assert.equal(pathToRoot(buildTree(deep), parent).length, 103);
});

test('initial disclosure, expansion, collapse and deterministic radial tidy layout', () => {
  const expanded = new Set([model.root.id]);
  const initial = radialLayout(model, expanded);
  assert.equal(initial.length, 11);
  assert.equal(initial[0].x, 0); assert.equal(Math.abs(initial[0].y), 0);
  expanded.add(find('AI').id);
  const layout = radialLayout(model, expanded);
  assert.equal(layout.length, 18);
  assert.deepEqual(layout, radialLayout(buildTree([...rows].reverse()), expanded));
  assert.ok(layout.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
  const reordered = rows.map(row => row.parent_id === find('AI').id ? { ...row, sort_order: 6 - row.sort_order } : row);
  const changed = radialLayout(buildTree(reordered), expanded);
  assert.notDeepEqual(changed.map(n => [n.id, n.x, n.y]), layout.map(n => [n.id, n.x, n.y]));
  assert.deepEqual(changed, radialLayout(buildTree(reordered), expanded));
  expanded.delete(find('AI').id); assert.deepEqual(radialLayout(model, expanded), initial);
});

test('invalid parents, duplicate roots, disconnected cycles and forbidden mutations are rejected', () => {
  assert.throws(() => buildTree([]), /no root/);
  assert.throws(() => buildTree([...rows, { ...rows[0], id: 'other' }]), /one root/);
  assert.throws(() => buildTree(rows.map(row => row.name === 'AI' ? { ...row, parent_id: 'missing' } : row)), /Invalid parent/);
  assert.throws(() => buildTree(rows.map(row => row.name === 'AI' ? { ...row, parent_id: find('Agents').id } : row)), /cycle/);
  assert.throws(() => validateMove(model, model.root.id, find('AI').id), /root/);
  assert.throws(() => validateMove(model, find('AI').id, find('Agents').id), /descendant/);
  assert.throws(() => validateMove(model, find('AI').id, find('AI').id), /itself/);
  assert.throws(() => validateDelete(model, model.root.id), /root/);
  assert.throws(() => validateDelete(model, find('AI').id), /children first/);
  validateDelete(model, find('Agents').id);
});

test('service gates all mutations on auth, validates fields and rejects stale sibling lists', async () => {
  let owner = false; const writes = [];
  const service = createConstellationService({
    requireOwner: async () => { if (!owner) throw new Error('Owner required'); }, list: async () => rows,
    ...Object.fromEntries(['create', 'update', 'move', 'reorder', 'remove'].map(method => [method, async (...args) => writes.push([method, ...args])])),
  });
  assert.equal((await service.getConstellationTree()).nodes.size, 60);
  const ai = find('AI').id, agent = find('Agents').id;
  for (const op of [() => service.createNode(ai, { name: 'Test' }), () => service.updateNode(ai, { name: 'Test' }), () => service.moveNode(agent, find('Computing').id), () => service.reorderSiblings(ai, []), () => service.deleteNode(agent)]) await assert.rejects(op, /Owner required/);
  assert.equal(writes.length, 0); owner = true;
  await assert.rejects(() => service.createNode(ai, { name: '  ' }), /Name/);
  await assert.rejects(() => service.updateNode(ai, { name: 'AI', status: 'done' }), /status/);
  await assert.rejects(() => service.moveNode(ai, agent), /descendant/);
  await assert.rejects(() => service.deleteNode(ai), /children/);
  await assert.rejects(() => service.reorderSiblings(ai, [agent, agent]), /Sibling/);
  assert.equal(writes.length, 0);
  await service.createNode(ai, { name: ' AI Safety ' });
  assert.deepEqual(writes[0], ['create', ai, { name: 'AI Safety', description: '', status: 'curious' }]);
  await service.reorderSiblings(ai, model.nodes.get(ai).children.map(n => n.id).reverse());
  await service.moveNode(agent, find('Computing').id); await service.deleteNode(agent);
  assert.equal(writes.length, 4);
});
