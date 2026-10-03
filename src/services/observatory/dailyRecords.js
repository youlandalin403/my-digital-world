import { database, ownerId, result } from './client';
import { parseDateKey } from './date';

export async function getDailyRecord(date) {
  parseDateKey(date);
  const record = result(await database().from('daily_records')
    .select('id,owner_id,date,reflection,visibility,created_at,updated_at,daily_tasks(*)')
    .eq('owner_id', ownerId).eq('date', date).maybeSingle());
  if (!record) return null;
  const { daily_tasks, ...fields } = record;
  return { ...fields, tasks: daily_tasks.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)) };
}

export async function ensureDailyRecord(date) {
  parseDateKey(date);
  // Conflict-ignore prevents another tab's existing reflection/visibility being overwritten.
  result(await database().from('daily_records').upsert({ owner_id: ownerId, date },
    { onConflict: 'owner_id,date', ignoreDuplicates: true }));
  return result(await database().from('daily_records').select('id')
    .eq('owner_id', ownerId).eq('date', date).single());
}

async function updateRecord(date, changes) {
  const { id } = await ensureDailyRecord(date);
  return result(await database().from('daily_records').update(changes).eq('id', id)
    .select('id,reflection,visibility,updated_at').single());
}
export const saveReflection = (date, reflection) => updateRecord(date, { reflection });
export function setVisibility(date, visibility) {
  if (!['private', 'public'].includes(visibility)) throw new Error('Invalid visibility');
  return updateRecord(date, { visibility });
}
