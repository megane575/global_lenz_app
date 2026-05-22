import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import TopicPage from './page';

vi.mock('@/components/RequireAuth', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const getSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      signOut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

const topicNav = vi.hoisted(() => ({
  push: vi.fn(),
  id: '88',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: topicNav.push }),
  useParams: () => ({ id: topicNav.id }),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _f,
    priority: _p,
    sizes: _s,
    ...rest
  }: Record<string, unknown>) => (
    <img alt={String(alt ?? '')} {...rest} />
  ),
}));

vi.mock('@/lib/api/favorites', () => ({
  deleteFavorite: vi.fn().mockResolvedValue({}),
}));

const topicPayload = {
  topic_name: '国別記事',
  summary: '要約本文です。',
  country_name: '日本',
  media_name: 'NHK',
  url: 'https://example.jp/news',
  difficult_word: [],
  is_already_saved: false,
};

describe('TopicPage (結合寄り)', () => {
  beforeEach(() => {
    topicNav.id = '88';
    topicNav.push.mockReset();
    getSession.mockReset();
    getSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/api/country-summaries/88/detail')) {
          return new Response(JSON.stringify(topicPayload), { status: 200 });
        }
        return new Response('', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('詳細取得成功で要約と引用元が表示される', async () => {
    render(<TopicPage />);
    await waitFor(() =>
      expect(
        screen.getByText('国別記事について'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('要約本文です。')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://example.jp/news' }),
    ).toHaveAttribute('href', 'https://example.jp/news');
  });

  it('401 のときログインへ誘導', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 401 }))),
    );
    render(<TopicPage />);
    await waitFor(() =>
      expect(topicNav.push).toHaveBeenCalledWith('/login'),
    );
  });

  it('データ無しのときメッセージのみ', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify(null), { status: 200 })),
      ),
    );
    render(<TopicPage />);
    await waitFor(() =>
      expect(
        screen.getByText('データが見つかりませんでした。'),
      ).toBeInTheDocument(),
    );
  });
});
