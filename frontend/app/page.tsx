'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

// 国画像
const flagImages: { [key: string]: string } = {
  日本: '/images/JP.png',
  イギリス: '/images/UK.png',
  アメリカ: '/images/US.png',
  インド: '/images/India.png',
  カタール: '/images/qatar.png',
};

export default function HomePage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const router = useRouter();

  const [summaries, setSummaries] = useState<any[]>([]);
  const [searchResult, setSearchResult] = useState<any | null>(null); // 検索結果専用
  const [tabs, setTabs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState(query || '');
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState('');

  // useEffect 内のロジックを整理
  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true);
      try {
        // 1. まず「今日のトピック（朝のニュース）」を取得
        const token = localStorage.getItem('access_token');
        const resToday = await fetch(
          'http://localhost:8000/api/country-summaries/home',
          {
            cache: 'no-store',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          }
        );
        const jsonToday = await resToday.json();

        const rawTodayData = jsonToday.data || [];

        // ★ここで「翻訳（マッピング）」を行う
        // バックエンドの s.country をフロントエンド用の s.country_name に変換します
        const formattedTodayData = rawTodayData.map((topic: any) => ({
          ...topic,
          comparison_id: topic.comparison_id ?? topic.topic_id,

          is_comparison_favoritable: topic.is_comparison_favoritable ?? false,

          summaries:
            topic.summaries?.map((s: any) => ({
              id: s.id,
              country_name: s.country_name || '不明',
              summary: s.summary || '要約がありません',
              recommend_score: s.recommend_score,
              locked: s.locked,
              is_favorited: s.is_favorited,
            })) || [],
        }));

        // 通常時のデータとしてセット
        setSummaries(formattedTodayData);

        // タブは常に「今日のトピック」から生成
        const uniqueTopics = formattedTodayData.map((item: any) => ({
          topic_id: item.topic_id,
          topic_name: item.topic_name,
          comparison_id: item.topic_id,
        }));
        setTabs(uniqueTopics);

        // 2. 検索クエリがある場合は、検索結果を別途取得
        if (query) {
          const resSearch = await fetch('http://localhost:8000/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: query }),
            cache: 'no-store',
          });
          const result = await resSearch.json();

          const searchData = {
            topic_id: result.topic_id,
            topic_name: result.topic_name,
            comparison_id: result.topic_id,
            summaries: result.report.country_summaries.map((s: any) => ({
              id: s.id,
              country_name: s.country_name || s.country || '不明',
              summary: s.country_summary || s.summary || '要約がありません',
              recommend_score: s.recommend_score,
            })),
          };
          setSearchResult(searchData);
          setActiveTab(null); // 検索中はタブの選択を外す
        } else {
          // 通常時は検索結果をクリアし、最初のタブを選択
          setSearchResult(null);
          if (uniqueTopics && uniqueTopics.length > 0) {
            setActiveTab(uniqueTopics[0].topic_id);
          }
        }
      } catch (err) {
        console.error('通信に失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [query]);

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    setToday(dateStr);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    // router.push('/search...') ではなく '/' を指定
    router.push(`/?q=${encodeURIComponent(searchKeyword.trim())}`);
  };

  // 1. 表示するトピックを決定するロジック
  const displayData =
    query && searchResult
      ? [searchResult] // 検索中なら検索結果（1つ）を配列にする
      : summaries.filter((t: any) => t.topic_id === activeTab); // 通常時は選ばれたタブでフィルタリング
  // --------------------

  return (
    <div className="min-h-screen bg-brand-canvas">
      <div className="relative mx-auto min-h-screen w-full max-w-md border-x border-b border-brand-border/50 bg-brand-canvas text-brand-text shadow-soft sm:rounded-b-[2rem] flex flex-col pt-10">
        {/* 日付 + 検索窓 */}
        {/* ヘッダー全体 */}
        <header className="p-4 px-6 flex items-center justify-between gap-4">
          {/* 日付 */}
          <h1 className="whitespace-nowrap text-lg font-bold tracking-tight text-brand-text">
            {today}
          </h1>

          <form
            onSubmit={handleSearch}
            /* borderの色を [#028090] に固定し、少し太さを持たせたい場合は border-2 に変更 */
            className="ml-auto flex max-w-[180px] flex-grow items-center rounded-full border bg-gray-50 px-3 py-1.5 transition-all focus-within:ring-1 focus-within:ring-[#028090]"
          >
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full flex-grow bg-transparent text-xs text-brand-text outline-none placeholder:text-brand-muted"
              placeholder="検索..."
            />

            {/* 虫眼鏡アイコン */}
            <button
              type="submit"
              className="ml-1 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </header>

        {/* タブ */}
        {!query && (
          <div className="px-4 mb-6 flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.topic_id}
                onClick={() => setActiveTab(tab.topic_id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === tab.topic_id
                    ? 'bg-[#E8603C] text-white shadow-sm'
                    : 'border bg-brand-canvas/90 text-brand-muted'
                }`}
              >
                {tab.topic_name}
              </button>
            ))}
          </div>
        )}

        <div className="px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              {/* 1. アニメーションアイコン（知的な回転体） */}
              <div className="relative mb-6 h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-brand-accent-soft"></div>
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-brand-accent"></div>
                <div className="absolute inset-2 animate-[spin_1.5s_linear_infinite_reverse] rounded-full border-4 border-b-brand-accent-secondary"></div>
              </div>

              {/* 2. テキスト演出 */}
              <div className="space-y-2 text-center">
                <h2 className="animate-pulse text-xl font-bold text-brand-text">
                  {query ? 'AIが世界中を分析中...' : '最新ニュースを取得中...'}
                </h2>
                <div className="flex flex-col items-center">
                  {query ? (
                    <p className="text-sm font-medium text-brand-muted">
                      「{searchKeyword}」に関する視点を抽出しています
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-brand-muted">
                      今日のトピックを読み込んでいます
                    </p>
                  )}
                </div>
              </div>

              {/* 3. プログレスバー（視覚的な進捗感） */}
              <div className="mt-8 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-brand-border-muted">
                <div className="h-full animate-[loading-bar_3s_infinite] bg-gradient-to-r from-brand-accent-secondary to-brand-accent"></div>
              </div>

              {/* Tailwind CSSのカスタムアニメーションをインラインで追加 */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                @keyframes loading-bar {
                  0% { transform: translateX(-100%); }
                  50% { transform: translateX(0); }
                  100% { transform: translateX(100%); }
                }
              `,
                }}
              />
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm font-bold text-brand-text">
                  {query ? `「${query}」の分析結果` : '各国要約'}
                </p>
              </div>

              {displayData.map((topic: any) => (
                <div key={topic.topic_id}>
                  {/* recommend_score順に並べ替え */}
                  <div className="grid grid-cols-2 gap-4 px-1">
                    {[...topic.summaries]
                      .sort(
                        (a, b) =>
                          (b.recommend_score || 0) - (a.recommend_score || 0)
                      )
                      .map((summary: any) => {
                        const isNoData =
                          !summary.summary ||
                          summary.summary.includes('確認されませんでした') ||
                          summary.recommend_score <= 1;

                        return (
                          <div
                            key={`${topic.topic_id}-${summary.id}`}
                            className={`flex flex-col transition-opacity ${isNoData ? 'opacity-40 grayscale' : 'opacity-100'}`}
                          >
                            <div className="mb-1.5 ml-0.5 flex items-center gap-1">
                              <span className="text-[11px] font-bold text-brand-text">
                                {summary.country_name}：
                              </span>
                              {!isNoData && (
                                <span className="text-[11px] tracking-wider">
                                  {/* 該当するスコア分の星（黄色） */}
                                  <span className="text-yellow-500">
                                    {'★'.repeat(summary.recommend_score || 0)}
                                  </span>
                                  {/* 残りの星（グレー） */}
                                  <span className="text-gray-200">
                                    {'★'.repeat(
                                      5 - (summary.recommend_score || 0)
                                    )}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* 国旗を背景として配置 */}
                            <div className="relative aspect-[3/2] w-full overflow-hidden border border-brand-border/70 bg-brand-accent-softer/40">
                              {flagImages[summary.country_name] && (
                                <div className="absolute inset-0 z-0">
                                  <Image
                                    src={flagImages[summary.country_name]}
                                    alt={summary.country_name}
                                    fill
                                    className="object-cover mix-blend-multiply opacity-15"
                                  />
                                </div>
                              )}

                              {/* テキストコンテンツを前面に配置 */}
                              <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                                <p className="text-sm font-bold leading-snug text-brand-text">
                                  {isNoData
                                    ? 'このトピックに関する報道は確認されませんでした。'
                                    : summary.summary.length > 35
                                      ? summary.summary.substring(0, 35) + '...'
                                      : summary.summary}
                                </p>
                                {!isNoData && (
                                  <Link
                                    href={`/topic/${summary.id}`}
                                    className="self-end text-[10px] font-bold text-brand-accent underline"
                                  >
                                    ...もっと見る
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-8">
                    <Link
                      href={`/comparison/${topic.comparison_id}`}
                      className="block w-full rounded-3xl bg-[#E8603C] py-4 text-center font-bold text-white shadow-md transition-opacity hover:opacity-95"
                    >
                      5カ国比較要約を見る
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
