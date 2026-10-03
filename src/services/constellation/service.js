import { buildTree, validateMove, validateDelete, validateFields } from '../../constellation/tree.js';

// Injected adapter keeps persistence and authentication outside presentation code.
export function createConstellationService(adapter) {
  async function ownedTree() {
    await adapter.requireOwner();
    return buildTree(await adapter.list());
  }
  return {
    getConstellationTree: async () => buildTree(await adapter.list()),
    async createNode(parentId, fields) {
      const model = await ownedTree();
      if (!model.nodes.has(parentId)) throw new Error('Parent unavailable.');
      return adapter.create(parentId, validateFields(fields));
    },
    async updateNode(id, fields) {
      const model = await ownedTree();
      if (!model.nodes.has(id)) throw new Error('Node unavailable.');
      return adapter.update(id, validateFields(fields));
    },
    async moveNode(id, parentId) {
      validateMove(await ownedTree(), id, parentId);
      return adapter.move(id, parentId);
    },
    async reorderSiblings(parentId, ids) {
      const model = await ownedTree();
      const siblings = model.nodes.get(parentId)?.children;
      if (!siblings || ids.length !== siblings.length || new Set(ids).size !== ids.length || ids.some(id => !siblings.some(node => node.id === id))) {
        throw new Error('Sibling list changed. Reload before reordering.');
      }
      return adapter.reorder(parentId, ids);
    },
    async deleteNode(id) {
      validateDelete(await ownedTree(), id);
      return adapter.remove(id);
    },
  };
}
