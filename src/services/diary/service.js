import { parseDateKey } from '../observatory/date.js';

export function createDiaryService(adapter) {
  const run = async (date, operation) => {
    parseDateKey(date);
    await adapter.requireOwner();
    return operation();
  };
  return {
    getDiaryEntry: date => run(date, () => adapter.get(date)),
    saveDiaryEntry: (date, title, bodyMarkdown) => run(date, () => {
      if (typeof title !== 'string' || typeof bodyMarkdown !== 'string') throw new Error('Diary content must be text.');
      return adapter.save({ date, title, body_markdown: bodyMarkdown });
    }),
    deleteDiaryEntry: date => run(date, () => adapter.remove(date)),
  };
}
