import { selectProjects } from '../projects/projectSchema';
import ProjectMeta from '../projects/ProjectMeta';
import { followLocalLink } from '../navigation';
import './ideaGarden.css';

export default function IdeaGardenPage({ projects }) {
  const seeds = selectProjects(projects, { stage: 'idea' });
  return <>
    <h1 tabIndex={-1}>Idea Garden</h1>
    <p>What might become something.</p>
    <p className="gallery-meta">Public preview · Only non-sensitive seeds are shown here. The private garden remains closed.</p>
    <section className="idea-seeds" aria-label="Seeds"><h2>Seeds <small>({seeds.length})</small></h2>
      {seeds.length ? seeds.map(project => <article className="idea-seed" key={project.slug}>
        <h3><a href={`/projects/${project.slug}`} onClick={followLocalLink}>{project.title}</a></h3>
        <ProjectMeta project={project} />
        <p>{project.summary}</p>
        {project.tags.length > 0 && <ul className="gallery-tags" aria-label="Tags">{project.tags.map((tag, i) => <li key={`${tag}-${i}`}>{tag}</li>)}</ul>}
      </article>) : <p>No public seeds have been planted yet.</p>}
    </section>
  </>;
}
