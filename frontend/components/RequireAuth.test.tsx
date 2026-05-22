import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RequireAuth from '@/components/RequireAuth';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const useAuthMock = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    push.mockClear();
    useAuthMock.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/notebook' },
    });
  });

  it('loading 中は子ではなくプレースホルダのみ', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    const { container } = render(
      <RequireAuth>
        <span>子コンテンツ</span>
      </RequireAuth>,
    );
    expect(container.querySelector('.min-h-screen')).toBeTruthy();
    expect(screen.queryByText('子コンテンツ')).not.toBeInTheDocument();
  });

  it('user が undefined のときもプレースホルダ', () => {
    useAuthMock.mockReturnValue({ user: undefined, loading: false });
    const { container } = render(
      <RequireAuth>
        <span>子コンテンツ</span>
      </RequireAuth>,
    );
    expect(container.querySelector('.min-h-screen')).toBeTruthy();
  });

  it('未ログインが確定したら login に現在パスを付けて遷移', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(
      <RequireAuth>
        <span>子コンテンツ</span>
      </RequireAuth>,
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/login?redirect=/notebook'),
    );
  });

  it('ログイン済みは子をそのまま表示', () => {
    useAuthMock.mockReturnValue({
      user: { id: '1' },
      loading: false,
    });
    render(
      <RequireAuth>
        <span>子コンテンツ</span>
      </RequireAuth>,
    );
    expect(screen.getByText('子コンテンツ')).toBeInTheDocument();
  });
});
