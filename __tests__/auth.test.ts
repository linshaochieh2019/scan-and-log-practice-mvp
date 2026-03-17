import { ensureAnonymousSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInAnonymously: jest.fn(),
    },
  },
}));

describe('ensureAnonymousSession', () => {
  const getSessionMock = supabase.auth.getSession as jest.Mock;
  const signInAnonymouslyMock = supabase.auth.signInAnonymously as jest.Mock;

  beforeEach(() => {
    getSessionMock.mockReset();
    signInAnonymouslyMock.mockReset();
  });

  it('returns existing user when session already exists', async () => {
    const existingUser = { id: 'user-1' };
    getSessionMock.mockResolvedValue({ data: { session: { user: existingUser } }, error: null });

    const user = await ensureAnonymousSession();

    expect(user).toEqual(existingUser);
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it('creates anonymous user when no session exists', async () => {
    const anonUser = { id: 'anon-1' };
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    signInAnonymouslyMock.mockResolvedValue({ data: { user: anonUser }, error: null });

    const user = await ensureAnonymousSession();

    expect(signInAnonymouslyMock).toHaveBeenCalledTimes(1);
    expect(user).toEqual(anonUser);
  });

  it('throws when getSession fails', async () => {
    const error = new Error('getSession failed');
    getSessionMock.mockResolvedValue({ data: { session: null }, error });

    await expect(ensureAnonymousSession()).rejects.toThrow('getSession failed');
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it('throws when anonymous sign-in fails', async () => {
    const error = new Error('signIn failed');
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    signInAnonymouslyMock.mockResolvedValue({ data: { user: null }, error });

    await expect(ensureAnonymousSession()).rejects.toThrow('signIn failed');
  });

  it('throws when anonymous sign-in returns no user and no error', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    signInAnonymouslyMock.mockResolvedValue({ data: { user: null }, error: null });

    await expect(ensureAnonymousSession()).rejects.toThrow(
      'Anonymous sign-in succeeded but no user was returned.'
    );
  });
});
