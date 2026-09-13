import 'server-only';
import { redirect } from 'next/navigation';
import { authClient } from './supabase/server';

export async function currentUser() {
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  return error ? null : user;
}
export async function requireUser(returnTo: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return { userId: user.id, email: user.email };
}
