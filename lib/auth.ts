import { supabase } from '@/lib/supabase';

export async function ensureAnonymousSession() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (user) {
    return user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Anonymous sign-in succeeded but no user was returned.');
  }

  return data.user;
}
