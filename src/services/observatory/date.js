export function localDateKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Invalid date');
  const date = new Date(`${key}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || localDateKey(date) !== key) throw new Error('Invalid date');
  return date;
}

export function shiftDate(key, days) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  const next = localDateKey(date);
  parseDateKey(next);
  return next;
}
