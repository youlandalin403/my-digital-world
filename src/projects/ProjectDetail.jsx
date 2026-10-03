import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Cover } from '../gallery/ProjectCard';
import ProjectMeta from './ProjectMeta';

export default function ProjectDetail({ project }) {
  return <article className="gallery-detail">
    <ProjectMeta project={project} />
    <h1 tabIndex={-1}>{project.title}</h1>
    <p className="gallery-summary">{project.summary}</p>
    {project.stage === 'now' && project.currentFocus && <p><strong>Current focus:</strong> {project.currentFocus}</p>}
    {(project.stage === 'completed' || project.cover) && <Cover key={project.cover} src={project.cover} title={project.title} />}
    {project.tags.length > 0 && <ul className="gallery-tags" aria-label="Tags">{project.tags.map((tag, i) => <li key={`${tag}-${i}`}>{tag}</li>)}</ul>}
    {(project.github || project.demo) && <nav className="gallery-links" aria-label="Project links">
      {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
      {project.demo && <a href={project.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
    </nav>}
    <div className="gallery-markdown"><ReactMarkdown skipHtml components={{ img: ({ node, ...props }) => <MarkdownImage {...props} /> }}>{project.content}</ReactMarkdown></div>
  </article>;
}
function MarkdownImage(props) {
  const [failed, setFailed] = useState(false);
  return failed ? <span>{props.alt || 'Image unavailable'}</span> : <img {...props} loading="lazy" onError={() => setFailed(true)} />;
}
