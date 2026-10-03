import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { STAGES, STAGE_VIEWS, loadProjects, parseProject, selectProjects } from './projectSchema.js';

const entry = (fields = '', body = '# Body\n\n**Markdown** remains intact.') => `---\ntitle: Example\nslug: example\nstage: now\ntype: A new type\nsummary: >\n  A folded\n  summary.\nupdated: 2026-09-27\ncurrentFocus: Building the content layer.\n${fields}---\n${body}`;
test('existing YAML parsing preserves folded text, tags, optional metadata and Markdown', () => {
  const p = parseProject(entry('tags:\n  - React\n  - Three.js\nrole: Author\n'), 'example.md');
  assert.equal(p.summary.trim(), 'A folded summary.');
  assert.deepEqual(p.tags, ['React', 'Three.js']);
  assert.equal(p.role, 'Author'); assert.match(p.content, /\*\*Markdown\*\*/);
});
test('invalid required fields and malformed files are isolated with source diagnostics', () => {
  const warnings = [];
  const projects = loadProjects({ 'missing.md': '---\ntitle: Missing\n---\n', 'valid.md': entry(), 'broken.md': '---\ntitle: [broken\n---\n' }, m => warnings.push(m));
  assert.equal(projects.length, 1);
  assert.ok(warnings.some(m => /missing.md.*slug, stage, type, summary/.test(m)));
  assert.ok(warnings.some(m => /broken.md.*Cannot parse/.test(m)));
});
test('exactly three stages are valid and duplicate slugs are rejected across stages', () => {
  assert.deepEqual(STAGES, ['idea', 'now', 'completed']);
  for (const stage of ['banana', 'paused', 'archived', 'active', 'draft', 'abandoned']) {
    const warnings = [];
    assert.equal(parseProject(entry().replace('stage: now', `stage: ${stage}`), 'bad.md', m => warnings.push(m)), null);
    assert.match(warnings[0], /bad.md.*stage must be one of: idea, now, completed/);
  }
  const warnings = [];
  assert.equal(loadProjects({ 'a.md': entry(), 'b.md': entry('completed: 2026-09-27\ncover: /projects/example/cover.png\n').replace('stage: now', 'stage: completed') }, m => warnings.push(m)).length, 1);
  assert.ok(warnings.some(m => /b.md.*duplicate slug/.test(m)));
});
test('minimal ideas need no work or completion fields; only created is recommended', () => {
  const source = '---\ntitle: Seed\nslug: seed\nstage: idea\ntype: Question\nsummary: A public test question.\n---\nA short body.';
  const warnings = [];
  const p = parseProject(source, 'seed.md', m => warnings.push(m));
  assert.equal(p.stage, 'idea'); assert.equal(p.created, '');
  assert.equal(warnings.length, 1); assert.match(warnings[0], /created is recommended/);
  const dated = source.replace('stage: idea', 'stage: idea\ncreated: 2026-09-27');
  const validWarnings = [];
  assert.equal(parseProject(dated, 'seed.md', m => validWarnings.push(m)).created, '2026-09-27');
  assert.deepEqual(validWarnings, []);
});
test('idea → now → completed changes exactly one view while preserving slug and Markdown', () => {
  const base = entry('created: 2026-09-27\ncompleted: 2026-10-01\n');
  for (const stage of STAGES) {
    const projects = loadProjects({ 'one.md': base.replace('stage: now', `stage: ${stage}`) });
    assert.equal(projects[0].slug, 'example'); assert.equal(projects[0].content, '# Body\n\n**Markdown** remains intact.');
    for (const view of STAGES) assert.equal(selectProjects(projects, { stage: view }).length, stage === view ? 1 : 0);
    assert.equal(STAGE_VIEWS[stage].path, { idea: '/idea-garden', now: '/laboratory', completed: '/gallery' }[stage]);
  }
});
test('Idea Garden sorts created descending, then slug, with missing dates last', () => {
  const make = (slug, created, featured = false) => ({ slug, created, featured, stage: 'idea' });
  const seeds = [make('missing', '', true), make('older', '2025-01-01', true), make('b', '2026-09-27'), make('a', '2026-09-27')];
  assert.deepEqual(selectProjects(seeds, { stage: 'idea' }).map(p => p.slug), ['a', 'b', 'older', 'missing']);
});
test('missing recommended metadata warns but renders; invalid optional dates are omitted', () => {
  const warnings = [];
  const p = parseProject(entry().replace('updated: 2026-09-27', 'updated: 2026-02-30').replace('currentFocus: Building the content layer.', ''), 'optional.md', m => warnings.push(m));
  assert.equal(p.stage, 'now'); assert.equal(p.updated, ''); assert.equal(p.currentFocus, '');
  assert.ok(warnings.some(m => /updated/.test(m))); assert.ok(warnings.some(m => /currentFocus/.test(m)));
  const done = parseProject(entry().replace('stage: now', 'stage: completed'), 'done.md', m => warnings.push(m));
  assert.equal(done.stage, 'completed'); assert.equal(done.cover, '');
  assert.ok(warnings.some(m => /done.md.*completed/.test(m))); assert.ok(warnings.some(m => /done.md.*cover/.test(m)));
});
test('content-only stage change moves one file between views without changing slug or body', () => {
  const source = entry();
  const before = loadProjects({ 'one.md': source });
  const after = loadProjects({ 'one.md': source.replace('stage: now', 'stage: completed\ncompleted: 2026-09-27') });
  assert.equal(selectProjects(before, { stage: 'now' }).length, 1);
  assert.equal(selectProjects(before).length, 0);
  assert.equal(selectProjects(after, { stage: 'now' }).length, 0);
  assert.equal(selectProjects(after).length, 1);
  assert.equal(before[0].slug, after[0].slug); assert.equal(before[0].content, after[0].content);
});
test('Laboratory sorts updated descending, ignoring featured; Gallery sorts featured then completed', () => {
  const now = loadProjects({ 'a.md': entry('featured: true\n').replace('2026-09-27', '2025-01-01'), 'b.md': entry().replace('slug: example', 'slug: newest') });
  assert.deepEqual(selectProjects(now, { stage: 'now' }).map(p => p.slug), ['newest', 'example']);
  const done = now.map(p => ({ ...p, stage: 'completed', completed: p.updated }));
  assert.deepEqual(selectProjects(done).map(p => p.slug), ['example', 'newest']);
  assert.equal(selectProjects(done, { featured: true }).length, 1);
  assert.equal(selectProjects(done.map(p => ({ ...p, featured: false })))[0].slug, 'newest');
});
test('unsafe URLs and invalid optional types degrade safely', () => {
  const p = parseProject(entry('github: "javascript:alert(1)"\ncover: "data:text/html,test"\ntags: wrong\nfeatured: "false"\n'), 'unsafe.md');
  assert.equal(p.github, ''); assert.equal(p.cover, ''); assert.equal(p.featured, false); assert.deepEqual(p.tags, []);
});
test('canonical content loads without skipped records and local cover assets exist', () => {
  const dir = new URL('../../content/projects/', import.meta.url);
  const files = Object.fromEntries(readdirSync(dir).filter(f => f.endsWith('.md')).map(f => [f, readFileSync(new URL(f, dir), 'utf8')]));
  const projects = loadProjects(files);
  assert.equal(projects.length, Object.keys(files).length);
  for (const p of projects) if (p.cover.startsWith('/')) assert.ok(readFileSync(new URL(`../../public${p.cover}`, import.meta.url)).length > 0);
});
