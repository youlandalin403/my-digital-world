import { database, ownerId, result } from '../observatory/client';
import { getSession, isOwner } from '../observatory/auth';
import { createConstellationService } from './service.js';

const table = () => database().from('constellation_nodes');
const confirmed = response => {
  const data = result(response);
  if (!data) throw new Error('Operation was not confirmed. Reload and try again.');
  return data;
};
export const constellationService = createConstellationService({
  async requireOwner() {
    if (!isOwner(await getSession())) throw new Error('Owner authentication required.');
  },
  async list() { return result(await table().select('*').eq('owner_id', ownerId)); },
  async create(parentId, fields) {
    return result(await database().rpc('add_constellation_node', { target_parent: parentId, node_name: fields.name, node_description: fields.description, node_status: fields.status }));
  },
  async update(id, fields) { return confirmed(await table().update(fields).eq('id', id).eq('owner_id', ownerId).select().single()); },
  async move(id, parentId) { return result(await database().rpc('move_constellation_node', { target_node: id, target_parent: parentId })); },
  async reorder(parentId, ids) { return result(await database().rpc('reorder_constellation_nodes', { target_parent: parentId, node_ids: ids })); },
  async remove(id) { return confirmed(await table().delete().eq('id', id).eq('owner_id', ownerId).select().single()); },
});
