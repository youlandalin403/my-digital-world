import { loadProjects } from './projectSchema';

const files = import.meta.glob('../../content/projects/*.md', {
  query: '?raw', import: 'default', eager: true,
});
export const projects = loadProjects(files, import.meta.env.DEV ? console.warn : undefined);
