// The nearest physical surface must itself belong to a registered target.
// This prevents selecting objects through furniture, walls, or other objects.
export function resolveInteraction(hits, registrations) {
  const hit = hits[0];
  if (!hit) return null;
  for (let object = hit.object; object; object = object.parent) {
    const entry = registrations.get(object);
    if (entry) return hit.distance <= entry.interactionDistance ? entry : null;
  }
  return null;
}
