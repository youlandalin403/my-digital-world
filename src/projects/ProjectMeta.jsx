import { STAGE_VIEWS } from './projectSchema';
export default function ProjectMeta({ project }) {
  const view = STAGE_VIEWS[project.stage];
  const date = project[view.dateKey];
  return <p className="gallery-meta">{project.type} · {view.label}{date && <> · {view.dateLabel}<time dateTime={date}>{date}</time></>}</p>;
}
