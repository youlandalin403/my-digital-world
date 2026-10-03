import { hierarchy, tree } from 'd3-hierarchy';

export const statuses = ['curious', 'exploring', 'active', 'deep'];
const compare = (a, b) => a.sort_order - b.sort_order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function buildTree(rows) {
  if (!rows.length) throw new Error('Constellation has no root. The database migration may not be applied.');
  const nodes = new Map(rows.map(row => [row.id, { ...row, children: [] }]));
  if (nodes.size !== rows.length) throw new Error('Duplicate node IDs.');
  const roots = [];
  for (const node of nodes.values()) {
    if (node.parent_id === null) roots.push(node);
    else {
      const parent = nodes.get(node.parent_id);
      if (!parent || parent.owner_id !== node.owner_id) throw new Error('Invalid parent.');
      parent.children.push(node);
    }
    node.children.sort(compare);
  }
  if (roots.length !== 1) throw new Error('Expected exactly one root.');
  const visited = new Set(), stack = [roots[0]];
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node.id)) throw new Error('Tree contains a cycle.');
    visited.add(node.id); node.children.sort(compare); stack.push(...node.children);
  }
  if (visited.size !== nodes.size) throw new Error('Tree contains a disconnected cycle.');
  return { root: roots[0], nodes };
}

export function pathToRoot(model, id) {
  const path = [];
  for (let node = model.nodes.get(id); node; node = model.nodes.get(node.parent_id)) path.unshift(node);
  return path;
}

export function validateMove(model, id, parentId) {
  const node = model.nodes.get(id), parent = model.nodes.get(parentId);
  if (!node || !parent) throw new Error('Node unavailable. Reload the tree.');
  if (node.parent_id === null) throw new Error('The root cannot be moved.');
  if (pathToRoot(model, parentId).some(ancestor => ancestor.id === id)) throw new Error('Cannot move a node under itself or a descendant.');
}

export function validateDelete(model, id) {
  const node = model.nodes.get(id);
  if (!node) throw new Error('Node unavailable.');
  if (node.parent_id === null) throw new Error('The root cannot be deleted.');
  if (node.children.length) throw new Error('Move or delete the children first.');
}

export function validateFields(fields) {
  const name = fields.name?.trim(), description = fields.description?.trim() || '', status = fields.status || 'curious';
  if (!name || name.length > 160) throw new Error('Name must contain 1–160 characters.');
  if (description.length > 2000) throw new Error('Description must be at most 2000 characters.');
  if (!statuses.includes(status)) throw new Error('Invalid status.');
  return { name, description, status };
}

export function radialLayout(model, expanded) {
  const root = hierarchy(model.root, node => expanded.has(node.id) ? node.children : []);
  tree().size([Math.PI * 2, 1]).separation((a, b) => (a.parent === b.parent ? 1 : 1.4) / Math.max(1, a.depth))(root);
  return root.descendants().map(node => ({
    ...node.data, depth: node.depth,
    x: node.depth * 180 * Math.sin(node.x),
    y: -node.depth * 180 * Math.cos(node.x),
  }));
}
