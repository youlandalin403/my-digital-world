import { parse } from 'yaml';

export const STAGES = ['idea', 'now', 'completed'];
export const STAGE_VIEWS = {
  idea: { name: 'Idea Garden', path: '/idea-garden', dateKey: 'created', label: 'Idea', dateLabel: 'Created ' },
  now: { name: 'Laboratory', path: '/laboratory', dateKey: 'updated', label: 'Now', dateLabel: 'Updated ' },
  completed: { name: 'Gallery', path: '/gallery', dateKey: 'completed', label: 'Completed', dateLabel: '' },
};
const required = ['title', 'slug', 'stage', 'type', 'summary'];
export function safeLink(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
}
export function safeImage(value) {
  return typeof value === 'string' && (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value)) ? value : '';
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

// Invalid entries are isolated; one author's mistake must not take down the world.
export function parseProject(source, file, warn = () => {}) {
  const report = (message) => warn(`[Projects] ${file}: ${message}`);
  try {
    const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!match) { report('Missing YAML frontmatter.'); return null; }
    const meta = parse(match[1]);
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) { report('Frontmatter must be a mapping.'); return null; }
    const missing = required.filter(key => typeof meta[key] !== 'string' || !meta[key].trim());
    if (missing.length) { report(`Missing or invalid required fields: ${missing.join(', ')}`); return null; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) { report('slug must be lowercase kebab-case.'); return null; }
    if (!STAGES.includes(meta.stage)) { report(`stage must be one of: ${STAGES.join(', ')}`); return null; }
    const dateKey = STAGE_VIEWS[meta.stage].dateKey;
    if (!validDate(meta[dateKey])) report(`${dateKey} is recommended as a valid YYYY-MM-DD date; omitted when invalid.`);
    if (meta.stage === 'now' && (typeof meta.currentFocus !== 'string' || !meta.currentFocus.trim())) report('currentFocus is recommended for now projects.');
    if (meta.stage === 'completed' && !meta.cover) report('cover is recommended for completed projects; fallback used.');
    if (meta.featured !== undefined && typeof meta.featured !== 'boolean') report('featured must be a boolean; treated as false.');
    if (meta.tags !== undefined && (!Array.isArray(meta.tags) || meta.tags.some(t => typeof t !== 'string'))) report('tags must be a list of strings; invalid tags ignored.');
    for (const key of ['github', 'demo']) if (meta[key] && !safeLink(meta[key])) report(`${key} must be an http(s) URL; link omitted.`);
    if (meta.cover && !safeImage(meta.cover)) report('cover must be an absolute public path or http(s) URL; fallback used.');
    return { ...meta, created: validDate(meta.created) ? meta.created : '', updated: validDate(meta.updated) ? meta.updated : '', completed: validDate(meta.completed) ? meta.completed : '',
      currentFocus: typeof meta.currentFocus === 'string' ? meta.currentFocus.trim() : '', featured: meta.featured === true,
      tags: Array.isArray(meta.tags) ? meta.tags.filter(t => typeof t === 'string' && t.trim()) : [],
      cover: safeImage(meta.cover), github: safeLink(meta.github), demo: safeLink(meta.demo),
      content: match[2].trim(), source: file };
  } catch (error) { report(`Cannot parse content: ${error.message}`); return null; }
}

export function loadProjects(files, warn = () => {}) {
  const seen = new Set();
  return Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).flatMap(([file, source]) => {
    const project = parseProject(source, file, warn);
    if (!project) return [];
    if (seen.has(project.slug)) { warn(`[Projects] ${file}: duplicate slug "${project.slug}"; entry skipped.`); return []; }
    seen.add(project.slug);
    return project;
  });
}

export function selectProjects(projects, { stage = 'completed', featured = false } = {}) {
  if (!STAGES.includes(stage)) return [];
  const dateKey = STAGE_VIEWS[stage].dateKey;
  return projects.filter(project => project.stage === stage && (!featured || project.featured))
    .sort((a, b) => (stage === 'completed' ? Number(b.featured) - Number(a.featured) : 0) || b[dateKey].localeCompare(a[dateKey]) || a.slug.localeCompare(b.slug));
}
