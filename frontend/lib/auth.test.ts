import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from './auth';

const { signInWithPassword } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: {
    auth: { signInWithPassword },
  },
}));

describe('login', () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
  });

  it('成功時は user を返す', async () => {
    const user = { id: 'u1' };
    signInWithPassword.mockResolvedValue({
      data: { user },
      error: null,
    });
    await expect(login('a@b.com', 'secret')).resolves.toEqual(user);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    });
  });

  it('Supabase が error を返したらそのまま throw', async () => {
    const err = new Error('Invalid login');
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: err,
    });
    await expect(login('a@b.com', 'bad')).rejects.toBe(err);
  });
});
