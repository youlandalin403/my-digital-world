import { database, ownerId, result } from './client';
import { matchesOwner } from './owner';

export const isOwner = session => matchesOwner(session, ownerId);
export async function getSession() {
  return result(await database().auth.getSession()).session;
}
export function subscribeAuth(callback) {
  const { data } = database().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
export async function signIn(email, password) {
  const data = result(await database().auth.signInWithPassword({ email, password }));
  if (!isOwner(data.session)) {
    await signOut();
    throw new Error('This account is not the Observatory owner.');
  }
  return data.session;
}
export async function signOut() {
  result(await database().auth.signOut({ scope: 'local' }));
}
