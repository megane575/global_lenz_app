import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import NotebookPage from './page';

vi.mock('@/components/RequireAuth', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const nb = vi.hoisted(() => ({
  session: { access_token: 'test-token' } as { access_token: string } | null,
  logout: vi.fn().mockResolvedValue(undefined),
  push: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    logout: nb.logout,
    session: nb.session,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nb.push }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/favorites', () => ({
  deleteFavorite: vi.fn().mockResolvedValue({}),
}));

describe('NotebookPage (結合寄り)', () => {
  beforeEach(() => {
    nb.session = { access_token: 'test-token' };
    nb.push.mockReset();
    nb.logout.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/favorites/with-summaries')) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response('', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('一覧が空のとき EmptyState を表示', async () => {
    render(<NotebookPage />);
    await waitFor(() =>
      expect(
        screen.getByText('まだお気に入りがありません'),
      ).toBeInTheDocument(),
    );
  });

  it('お気に入りがあるときトピック名と遷移リンクを表示', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/api/favorites/with-summaries')) {
          return new Response(
            JSON.stringify([
              {
                favorite_id: 7,
                topic_name: '保存トピック',
                type: 'comparison',
                target_id: 55,
                created_at: '2025-02-10T08:00:00.000Z',
                label: '5カ国比較要約',
              },
            ]),
            { status: 200 },
          );
        }
        return new Response('', { status: 404 });
      }),
    );
    render(<NotebookPage />);
    await waitFor(() =>
      expect(screen.getByText('保存トピック')).toBeInTheDocument(),
    );
    const link = screen.getByRole('link', { name: /5カ国比較要約/ });
    expect(link).toHaveAttribute('href', '/comparison/55');
  });

  it('ログアウトで logout の後トップへ', async () => {
    render(<NotebookPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    await waitFor(() => {
      expect(nb.logout).toHaveBeenCalled();
      expect(nb.push).toHaveBeenCalledWith('/');
    });
  });

  it('セッションが無いときは fetch せず読み込みが終わる', async () => {
    nb.session = null;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(<NotebookPage />);
    await waitFor(() =>
      expect(screen.getByText('まだお気に入りがありません')).toBeInTheDocument(),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
