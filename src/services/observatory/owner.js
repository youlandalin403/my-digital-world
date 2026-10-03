export function matchesOwner(session, ownerId) {
  return Boolean(ownerId && session?.user?.id && session.user.id === ownerId);
}
