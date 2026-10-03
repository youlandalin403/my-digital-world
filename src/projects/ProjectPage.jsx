import { useEffect, useRef } from 'react';
import { projects } from './loadProjects';
import { followLocalLink } from '../navigation';
import GalleryPage from '../gallery/GalleryPage';
import LaboratoryPage from '../laboratory/LaboratoryPage';
import IdeaGardenPage from '../idea-garden/IdeaGardenPage';
import { STAGE_VIEWS } from './projectSchema';
import ProjectDetail from './ProjectDetail';
import '../gallery/gallery.css';

export default function ProjectPage({ path }) {
  const root = useRef();
  const isDetail = /^\/(projects|gallery)\/.+/.test(path.replace(/\/$/, ''));
  const slug = isDetail ? path.replace(/^\/(projects|gallery)\//, '').replace(/\/$/, '') : '';
  const project = projects.find(p => p.slug === slug);
  const laboratory = path.replace(/\/$/, '') === '/laboratory';
  const garden = path.replace(/\/$/, '') === '/idea-garden';
  const parent = STAGE_VIEWS[project?.stage || 'completed'];
  const title = isDetail ? project?.title || 'Project not found' : garden ? 'Idea Garden' : laboratory ? 'Laboratory' : 'Gallery';
  useEffect(() => {
    root.current.scrollTop = 0;
    root.current.querySelector('h1')?.focus({ preventScroll: true });
    document.title = `${title} — Yunhan Lin`;
    return () => { document.title = 'My Digital World — Yunhan Lin'; };
  }, [path, title]);
  return <main className="gallery-page" ref={root} aria-label={isDetail ? 'Project' : title}>
    <div className="gallery-container">
      <header className="gallery-header"><a href="/map" onClick={followLocalLink}>← World map</a>
        {isDetail ? <a href={parent.path} onClick={followLocalLink}>← {parent.name}</a> : <>
          {!garden && <a href="/idea-garden" onClick={followLocalLink}>Idea Garden</a>}
          {(laboratory || garden) && <a href="/gallery" onClick={followLocalLink}>Gallery</a>}
          {!laboratory && <a href="/laboratory" onClick={followLocalLink}>Laboratory</a>}
        </>}
        <span>Yunhan Lin</span>
      </header>
      {isDetail ? project ? <ProjectDetail project={project} key={project.slug} /> : <section><h1 tabIndex={-1}>Project not found</h1><p>This work is not in the project collection.</p><a href="/gallery" onClick={followLocalLink}>Return to Gallery</a></section> : garden ? <IdeaGardenPage projects={projects} /> : laboratory ? <LaboratoryPage projects={projects} /> : <GalleryPage projects={projects} />}
    </div>
  </main>;
}
