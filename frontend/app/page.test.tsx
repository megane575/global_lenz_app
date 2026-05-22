import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import HomePage from './page';

const nav = vi.hoisted(() => ({
  q: null as string | null,
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'q' ? nav.q : null),
  }),
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

vi.mock('next/image', () => ({
  default: ({ alt, src, fill: _f, ...rest }: { alt?: string; src?: string }) => (
    <img alt={alt ?? ''} src={typeof src === 'string' ? src : ''} {...rest} />
  ),
}));

function homeJson() {
  return {
    data: [
      {
        topic_id: 1,
        topic_name: '朝のトピック',
        summaries: [
          {
            id: 10,
            country_name: '日本',
            summary: 'これは35文字を超える要約テキストのダミーです。続きがあります。',
            recommend_score: 4,
            locked: false,
            is_favorited: false,
          },
        ],
      },
      {
        topic_id: 2,
        topic_name: '別トピック',
        summaries: [
          {
            id: 11,
            country_name: 'アメリカ',
            summary: '短い',
            recommend_score: 3,
          },
        ],
      },
    ],
  };
}

describe('HomePage (結合寄り)', () => {
  beforeEach(() => {
    nav.q = null;
    nav.push.mockReset();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/country-summaries/home')) {
          return new Response(JSON.stringify(homeJson()), { status: 200 });
        }
        if (url.includes('/api/search')) {
          return new Response(
            JSON.stringify({
              topic_id: 99,
              topic_name: '検索ヒット',
              report: {
                country_summaries: [
                  {
                    id: 20,
                    country_name: 'イギリス',
                    country_summary: '検索要約',
                    recommend_score: 5,
                  },
                ],
              },
            }),
            { status: 200 },
          );
        }
        return new Response('not found', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('クエリなし: ホーム取得後にタブと要約・比較リンクが出る', async () => {
    nav.q = null;
    render(<HomePage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '朝のトピック' })).toBeInTheDocument(),
    );
    expect(screen.getByText('各国要約')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '...もっと見る' }),
    ).toHaveAttribute('href', '/topic/10');
    expect(
      screen.getByRole('link', { name: '5カ国比較要約を見る' }),
    ).toHaveAttribute('href', '/comparison/1');
  });

  it('クエリあり: 検索 API を叩き分析結果見出しと検索要約を表示', async () => {
    nav.q = '気候';
    render(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText('「気候」の分析結果')).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: '朝のトピック' })).not.toBeInTheDocument();
    expect(screen.getByText('検索要約')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '5カ国比較要約を見る' }),
    ).toHaveAttribute('href', '/comparison/99');
  });

  it('検索フォーム送信で router.push に q を付ける', async () => {
    nav.q = null;
    render(<HomePage />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText('検索...'), {
      target: { value: '  AI 規制  ' },
    });
    fireEvent.submit(screen.getByPlaceholderText('検索...').closest('form')!);
    expect(nav.push).toHaveBeenCalledWith('/?q=AI%20%E8%A6%8F%E5%88%B6');
  });
});
