import { ensureAnonymousSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInAnonymously: jest.fn(),
    },
  },
}));

describe('ensureAnonymousSession', () => {
  const getUserMock = supabase.auth.getUser as jest.Mock;
  const signInAnonymouslyMock = supabase.auth.signInAnonymously as jest.Mock;

  beforeEach(() => {
    getUserMock.mockReset();
    signInAnonymouslyMock.mockReset();
  });

  it('returns existing user when session already exists', async () => {
    const existingUser = { id: 'user-1' };
    getUserMock.mockResolvedValue({ data: { user: existingUser }, error: null });

    const user = await ensureAnonymousSession();

    expect(user).toEqual(existingUser);
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it('creates anonymous user when no session exists', async () => {
    const anonUser = { id: 'anon-1' };
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    signInAnonymouslyMock.mockResolvedValue({ data: { user: anonUser }, error: null });

    const user = await ensureAnonymousSession();

    expect(signInAnonymouslyMock).toHaveBeenCalledTimes(1);
    expect(user).toEqual(anonUser);
  });

  it('throws when getUser fails', async () => {
    const error = new Error('getUser failed');
    getUserMock.mockResolvedValue({ data: { user: null }, error });

    await expect(ensureAnonymousSession()).rejects.toThrow('getUser failed');
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it('throws when anonymous sign-in fails', async () => {
    const error = new Error('signIn failed');
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    signInAnonymouslyMock.mockResolvedValue({ data: { user: null }, error });

    await expect(ensureAnonymousSession()).rejects.toThrow('signIn failed');
  });
});
