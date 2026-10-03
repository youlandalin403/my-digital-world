import { database, ownerId, result } from '../observatory/client';
import { getSession, isOwner } from '../observatory/auth';
import { createDiaryService } from './service';

const table = () => database().from('diary_entries');
const confirmed = response => {
  const data = result(response);
  if (!data) throw new Error('Diary operation was not confirmed. Please retry.');
  return data;
};
export const diaryService = createDiaryService({
  async requireOwner() { if (!isOwner(await getSession())) throw new Error('Owner authentication required.'); },
  async get(date) { return result(await table().select('*').eq('owner_id', ownerId).eq('date', date).maybeSingle()); },
  async save(entry) { return confirmed(await table().upsert({ ...entry, owner_id: ownerId }, { onConflict: 'owner_id,date' }).select().single()); },
  async remove(date) { return confirmed(await table().delete().eq('owner_id', ownerId).eq('date', date).select().single()); },
});
