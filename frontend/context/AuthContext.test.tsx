import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const { getSession, unsubscribe, onAuthStateChange } = vi.hoisted(() => {
  const unsubscribe = vi.fn();
  const getSession = vi.fn();
  const onAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe } },
  }));
  return { getSession, unsubscribe, onAuthStateChange };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
      signOut: vi.fn(),
    },
  },
}));

function Probe() {
  const { user, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div data-testid="user">{user ? String((user as { id: string }).id) : 'null'}</div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    getSession.mockReset();
    onAuthStateChange.mockClear();
    unsubscribe.mockClear();
  });

  it('useAuth は Provider の外では throw', () => {
    expect(() => render(<Probe />)).toThrow(
      'useAuth must be used within AuthProvider',
    );
  });

  it('セッションなしで初期化すると user は null', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('null'),
    );
    expect(onAuthStateChange).toHaveBeenCalled();
  });

  it('セッションに user があれば子に渡る', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'usr-9' } } },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('usr-9'),
    );
  });
});
