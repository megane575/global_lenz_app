import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ComparePage from './page';

const cmp = vi.hoisted(() => ({
  id: '42',
  push: vi.fn(),
  session: null as { access_token: string } | null,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: cmp.id }),
  useRouter: () => ({ push: cmp.push }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: cmp.session ? { id: 'u' } : null,
    session: cmp.session,
  }),
}));

describe('ComparePage (結合寄り)', () => {
  beforeEach(() => {
    cmp.session = null;
    cmp.push.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/comparison-summaries/42/detail')) {
          return new Response(
            JSON.stringify({
              topic_name: '比較タイトル',
              comparison_summary: '本文比較',
              variance_score: 3,
              difficult_word: [],
              is_already_saved: false,
              comparison_id: 42,
              id: 42,
              country_summaries: [
                {
                  media_name: 'NHK',
                  url: 'https://example.com/a',
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response('{}', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('詳細取得後に比較タイトル・本文・引用リンクを表示', async () => {
    render(<ComparePage />);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /比較タイトルについて/ }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('本文比較')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.com/a' })).toHaveAttribute(
      'href',
      'https://example.com/a',
    );
    expect(screen.getByText('バラツキ度：')).toBeInTheDocument();
  });

  it('未ログインで保存アイコン: ログイン案内モーダルが開く', async () => {
    cmp.session = null;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/comparison/42' },
    });
    render(<ComparePage />);
    await waitFor(() =>
      expect(screen.getByTitle('ネタ帳に追加')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTitle('ネタ帳に追加'));
    expect(
      screen.getByRole('heading', { name: 'ネタ帳を使ってみませんか？' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ログインして保存する' }));
    expect(cmp.push).toHaveBeenCalledWith('/login?redirect=/comparison/42');
  });

  it('取得失敗時は空状態メッセージ', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 500 }))),
    );
    render(<ComparePage />);
    await waitFor(() =>
      expect(
        screen.getByText('比較データが見つかりませんでした。'),
      ).toBeInTheDocument(),
    );
  });
});
