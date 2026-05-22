// 5カ国比較要約（非認証）
'use client';

import React, { useState, useEffect, useId, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { deleteFavorite } from '@/lib/api/favorites';
import { normalizeDifficultWords } from '@/lib/normalizeDifficultWords';
import {
  DifficultWordsGlossaryModal,
  DifficultWordsListSection,
} from '@/components/glossary/DifficultWordsGlossary';

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const id = params?.id as string;

  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダルの開閉
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryFocusedTerm, setGlossaryFocusedTerm] = useState<string | null>(
    null
  );
  const glossaryTitleId = useId();

  const terms = useMemo(
    () => normalizeDifficultWords(comparison?.difficult_word),
    [comparison?.difficult_word]
  );

  const closeGlossary = useCallback(() => {
    setGlossaryOpen(false);
    setGlossaryFocusedTerm(null);
  }, []);

  const fetchComparisonData = async () => {
    try {
      if (!id) return;

      setLoading(true);

      const token = session?.access_token;

      const res = await fetch(
        `http://localhost:8000/api/comparison-summaries/${id}/detail`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) throw new Error('取得に失敗しました');
      const data = await res.json();

      // データ保存
      setComparison(data);

      // 保存状態をそのまま反映
      setIsSaved(data?.is_already_saved);
    } catch (err) {
      console.error('比較データの取得に失敗しました:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [id, session]);

  // ネタ帳保存処理
  const handleSaveToNotebook = async () => {
    try {
      // 未ログインならモーダル
      if (!session) {
        setIsModalOpen(true);
        return;
      }

      const token = session.access_token;

      // ログイン済み→保存処理
      if (isSaved) {
        // 削除処理
        await deleteFavorite({
          token,
          id,
          type: 'comparison',
        });

        // DB状態を再取得
        await fetchComparisonData();

        showToast('ネタ帳から削除しました');
      } else {
        // 保存処理
        console.log('ネタ帳に追加中...');
        const isComparisonPage =
          window.location.pathname.includes('comparison');
        const realId = comparison?.comparison_id || comparison?.id;

        if (!realId) {
          alert('データの読み込みが完了するまで保存できません');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/favorites/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            [isComparisonPage ? 'comparison_summary_id' : 'country_summary_id']:
              realId,
            topic_name: comparison.topic_name,
            type: isComparisonPage ? 'comparison' : 'country',
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          if (err.detail?.includes('already exists')) {
            await fetchComparisonData();
            return;
          }
          alert('保存失敗: ' + (err.detail || 'エラー'));
          return;
        }
        // DB状態を再取得
        await fetchComparisonData();

        showToast('ネタ帳に追加しました！');
      }
    } catch (error) {
      console.error('操作に失敗しました:', error);
    }
  };

  // トースト表示関数
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 1500); // 1.5秒後に消える
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-canvas p-10 text-center text-brand-muted">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-canvas">
      <div className="mx-auto min-h-screen w-full max-w-md border border-brand-border/50 bg-brand-canvas pt-10 p-6 shadow-soft sm:rounded-b-[2rem]">
        {/* ヘッダーエリア*/}
        <header className="mb-8 flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-brand-text">
              {new Date().toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </h1>
          </div>

          {/* ネタ帳保存ボタン（アイコン）*/}
          <button
            onClick={handleSaveToNotebook}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              isSaved
                ? 'bg-[#E8603C]/10 text-[#E8603C]' // 保存済み
                : 'text-gray-400 hover:bg-[#E8603C]/5 hover:text-[#E8603C]' // 未保存
            }`}
            title={isSaved ? '保存済み' : 'ネタ帳に追加'}
          >
            {/* ネタ帳アイコン */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill={isSaved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </button>
        </header>

        {/* タイトルと星をまとめて中央揃え */}
        <div className="flex flex-col items-center mb-6">
          <p className="font-bold text-brand-text">5カ国比較要約</p>

          {/* バラつき度の表示（カプセルなし・中央揃え） */}
          <div className="flex items-center gap-1 mt-1 pb-10">
            <span className="text-[11px] font-bold text-brand-text">
              バラつき度：
            </span>
            {comparison && (
              <span className="text-[11px] text-amber-500 tracking-wider">
                {'★'.repeat(comparison.variance_score || 0)}
                <span className="text-gray-200">
                  {'★'.repeat(5 - (comparison.variance_score || 0))}
                </span>
              </span>
            )}
          </div>

          {comparison ? (
            <div className="space-y-6">
              {/* 比較要約 */}
              <div className="border-l-4 border-[#E8603C] py-2 pl-4">
                <h2 className="mb-2 font-bold text-brand-text">
                  {comparison.topic_name}について
                </h2>

                <p className="text-sm leading-relaxed text-brand-text pb-10">
                  {comparison.comparison_summary}
                </p>

                <DifficultWordsListSection
                  terms={terms}
                  sectionClassName="mt-6"
                  onSelectTerm={(term) => {
                    setGlossaryFocusedTerm(term);
                    setGlossaryOpen(true);
                  }}
                />
              </div>

              <div className="space-y-4 mt-16">
                {comparison.country_summaries
                  ?.filter((country: any) => country.url !== null)
                  .map((country: any, index: number) => (
                    <div
                      key={index}
                      className="text-xs text-gray-500 border rounded-lg p-4 bg-gray-50"
                    >
                      {/* 引用元 */}
                      <span className="font-semibold">引用元</span>
                      <span className="ml-1">{country.media_name}</span>

                      <div className="mt-1">
                        <a
                          href={country.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                        >
                          {country.url}
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-brand-muted">
              比較データが見つかりませんでした。
            </div>
          )}
        </div>
      </div>

      <DifficultWordsGlossaryModal
        open={glossaryOpen}
        onClose={closeGlossary}
        titleId={glossaryTitleId}
        terms={terms}
        focusedTerm={glossaryFocusedTerm}
        emptyMessage="この比較に紐づく用語解説データ（difficult_word）はまだありません。"
      />

      {/* ログイン案内モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-text/25 p-4 backdrop-blur-sm">
          <div className="card-on-canvas w-full max-w-sm animate-in rounded-3xl border border-brand-border/80 p-8 shadow-2xl fade-in zoom-in duration-300">
            <div className="text-center space-y-4">
              {/* アイコン */}
              <div className="flex justify-center">
                <div className="rounded-full bg-brand-accent-soft p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-brand-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-bold text-brand-text">
                ネタ帳を使ってみませんか？
              </h3>
              <p className="text-sm leading-relaxed text-brand-muted">
                ログインすると、気になったニュースを自分だけの「ネタ帳」に保存して、いつでも読み返せるようになります。
              </p>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() =>
                    router.push(`/login?redirect=${window.location.pathname}`)
                  }
                  className="w-full rounded-full bg-brand-accent py-3 font-bold text-white shadow-md transition-opacity hover:opacity-95"
                >
                  ログインして保存する
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full text-sm font-medium text-brand-muted transition-colors hover:text-brand-text"
                >
                  今はしない
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* トースト表示 */}
      {toast.visible && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#E8603C] text-white px-7 py-3.5 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
