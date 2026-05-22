import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteFavorite } from './favorites';

describe('deleteFavorite', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('id が 0 のときは fetch せずエラー', async () => {
    await expect(
      deleteFavorite({ token: 't', id: 0, type: 'country' }),
    ).rejects.toThrow('idが不正です');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('type が country のとき country_summary_id を付ける', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await deleteFavorite({ token: 'abc', id: 42, type: 'country' });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/favorites?country_summary_id=42',
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer abc' },
      }),
    );
  });

  it('type が comparison のとき comparison_summary_id を付ける', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));
    await deleteFavorite({ token: 't', id: 7, type: 'comparison' });
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain(
      'comparison_summary_id=7',
    );
  });

  it('HTTP が非 ok のときエラー', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }));
    await expect(
      deleteFavorite({ token: 't', id: 1, type: 'country' }),
    ).rejects.toThrow('削除に失敗しました');
  });

  it('成功時はレスポンス JSON を返す', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ deleted: 1 }), { status: 200 }),
    );
    await expect(
      deleteFavorite({ token: 't', id: 1, type: 'country' }),
    ).resolves.toEqual({ deleted: 1 });
  });
});
