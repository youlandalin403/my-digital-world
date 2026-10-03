import { database, result } from './client';
import { ensureDailyRecord } from './dailyRecords';

export async function addTask(date, text) {
  const { id } = await ensureDailyRecord(date);
  return result(await database().from('daily_tasks').insert({ record_id: id, text: text.trim(), position: Date.now() })
    .select().single());
}
export async function updateTask(taskId, changes) {
  const allowed = {};
  if ('text' in changes) allowed.text = changes.text.trim();
  if ('done' in changes) allowed.done = changes.done;
  return result(await database().from('daily_tasks').update(allowed).eq('id', taskId).select().single());
}
export async function deleteTask(taskId) {
  return result(await database().from('daily_tasks').delete().eq('id', taskId).select('id').single());
}
export async function reorderTasks(recordId, taskIds) {
  result(await database().rpc('reorder_daily_tasks', { target_record: recordId, task_ids: taskIds }));
}
