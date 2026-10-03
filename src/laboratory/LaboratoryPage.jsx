import { selectProjects } from '../projects/projectSchema';
import ProjectMeta from '../projects/ProjectMeta';
import { followLocalLink } from '../navigation';
import './laboratory.css';

export default function LaboratoryPage({ projects }) {
  const visible = selectProjects(projects, { stage: 'now' });
  return <>
    <h1 tabIndex={-1}>Laboratory</h1><p>What I'm doing now.</p>
    <section aria-label="Now Board" className="laboratory-board"><h2>Now Board <small>({visible.length})</small></h2>
      {visible.length ? visible.map(project => <article className="laboratory-note" key={project.slug}>
        <h3><a href={`/projects/${project.slug}`} onClick={followLocalLink}>{project.title}</a></h3>
        <ProjectMeta project={project} />
        <p>{project.summary}</p>
        {project.currentFocus && <p><strong>Current focus:</strong> {project.currentFocus}</p>}
        {project.tags.length > 0 && <ul className="gallery-tags" aria-label="Tags">{project.tags.map((tag, i) => <li key={`${tag}-${i}`}>{tag}</li>)}</ul>}
      </article>) : <p>No current projects have been added yet.</p>}
    </section>
  </>;
}
