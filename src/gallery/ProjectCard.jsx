import { useState } from 'react';
import { followLocalLink } from '../navigation';
import ProjectMeta from '../projects/ProjectMeta';

export function Cover({ src, title }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img className="gallery-cover" src={src} alt={`${title} project cover`} loading="lazy" onError={() => setFailed(true)} /> :
    <div className="gallery-cover gallery-cover-fallback" role="img" aria-label="Project cover not yet available">MY DIGITAL WORLD<span>Gallery</span></div>;
}
export default function ProjectCard({ project }) {
  return <article className="gallery-card">
    <a href={`/projects/${project.slug}`} onClick={followLocalLink}>
      <Cover key={project.cover} src={project.cover} title={project.title} />
      <h3>{project.title}</h3>
    </a>
    <ProjectMeta project={project} />
    <p>{project.summary}</p>
  </article>;
}
