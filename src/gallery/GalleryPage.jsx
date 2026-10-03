import { useState } from 'react';
import { selectProjects } from '../projects/projectSchema';
import ProjectCard from './ProjectCard';

export default function GalleryPage({ projects }) {
  const [view, setView] = useState('all');
  const visible = selectProjects(projects, { stage: 'completed', featured: view === 'featured' });
  return <>
    <h1 tabIndex={-1}>Gallery</h1><p>Things made, finished, and shared.</p>
    <div className="gallery-controls"><nav aria-label="Gallery views"><button aria-pressed={view === 'featured'} onClick={() => setView('featured')}>Featured Works</button><button aria-pressed={view === 'all'} onClick={() => setView('all')}>All Works</button></nav></div>
    <section aria-label={view === 'all' ? 'All Works' : 'Featured Works'}><h2>{view === 'all' ? 'All Works' : 'Featured Works'} <small>({visible.length})</small></h2>
      {visible.length ? <div className="gallery-grid">{visible.map(project => <ProjectCard key={project.slug} project={project} />)}</div> : <p>No works in this view yet.</p>}
    </section>
  </>;
}
