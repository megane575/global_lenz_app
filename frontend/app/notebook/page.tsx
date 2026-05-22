// ネタ帳
'use client';

import { useMemo, useState, useEffect } from 'react';
import RequireAuth from '@/components/RequireAuth';
import EmptyState from '@/components/notebook/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { deleteFavorite } from '@/lib/api/favorites';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotebookPage() {
  const { logout, session } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  // --- DBからデータを取得する処理 ---
  const fetchFavorites = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // バックエンドの「要約付きお気に入り一覧」エンドポイントを叩く
      const res = await fetch(
        `http://localhost:8000/api/favorites/with-summaries`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('ネタ帳の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFavorites();
  }, [session]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('ログアウト失敗:', error);
    }
  };

  const isEmpty = useMemo(() => items.length === 0, [items.length]);

  // チェックボックスのON/OFF
  const toggleSelect = (item: any) => {
    setSelectedIds((prev) => {
      const exists = prev.some((i) => i.favorite_id === item.favorite_id);

      if (exists) {
        return prev.filter((i) => i.favorite_id !== item.favorite_id);
      }

      return [...prev, item];
    });
  };

  // トースト表示関数（３秒間表示）
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3000);
  };

  // 一括削除実行
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      setIsEditMode(false); // 何も選んでなければモード終了
      return;
    }

    try {
      const token = session?.access_token;

      const deletePromises = Array.from(selectedIds)
        .map((item) => {
          if (!item.target_id) return null;

          return deleteFavorite({
            token,
            id: item.target_id,
            type: item.type,
          });
        })
        .filter(Boolean);

      await Promise.all(deletePromises);

      // 最新取得
      await fetchFavorites();

      // 後片付け
      setSelectedIds([]);
      setIsEditMode(false);

      showToast(`${selectedIds.length}件のネタを削除しました！`);
    } catch (error) {
      console.error('削除失敗:', error);
      showToast('削除に失敗しました');
    }
  };

  console.log('ネタ帳の生データ:', items);
  // 届いたデータをトピック名でグループ化する
  const groupedTopics = items.reduce((acc: any[], current: any) => {
    const topicName =
      current.comparison_summary?.topic_name ||
      current.country_summaries?.topic_name ||
      current.topic_name;
    // すでに同じトピック名の箱があるか探す
    const existingGroup = acc.find((g) => g.topic_name === topicName);

    const linkInfo = {
      favorite_id: current.favorite_id,
      label:
        current.label ||
        (current.type === current.country_summary_id
          ? '各国詳細'
          : '5カ国比較要約'),
      target_id: current.target_id,
      type: current.type,
    };

    if (existingGroup) {
      // すでにカードがあれば、そこにリンク（ボタン）を追加
      existingGroup.links.push(linkInfo);
    } else {
      // なければ、新しいトピックの箱を作る
      acc.push({
        topic_name: topicName,
        created_at: current.created_at,
        links: [current],
      });
    }
    return acc;
  }, []);

  return (
    <RequireAuth>
      <div className="relative min-h-screen pt-10 bg-brand-canvas p-5 pb-32">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          {/* --- ヘッダー部分 --- */}
          <div className="relative mb-10 flex items-center justify-between pb-3 border-b-2 border-[#1E2761]">
            <h1 className="text-2xl font-extrabold tracking-tighter">
              ネタ帳リスト
            </h1>

            {/* 編集・削除ボタン */}
            <button
              onClick={() => {
                if (isEditMode) {
                  if (selectedIds.length > 0) {
                    handleDeleteSelected();
                  } else {
                    setIsEditMode(false);
                  }
                } else {
                  setIsEditMode(true);
                }
              }}
              className={`flex items-center justify-center rounded-full border transition-all px-4 py-1.5 active:opacity-70 ${
                isEditMode && selectedIds.length > 0
                  ? 'border-[#E8603C] bg-[#E8603C]/400'
                  : 'border-brand-border/70 bg-brand-accent-softer/40'
              }`}
            >
              <span
                className={`text-[11px] font-bold ${
                  !isEditMode
                    ? 'text-[#1E2761]' // 通常時はネイビー
                    : selectedIds.length > 0
                      ? 'text-white' // 🌟 削除ボタン時は背景に合わせて白文字
                      : 'text-[#E8603C]' // キャンセルはコーラルレッド
                }`}
              >
                {isEditMode
                  ? selectedIds.length > 0
                    ? `${selectedIds.length}件を削除`
                    : 'キャンセル'
                  : '編集'}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center pt-20 text-[#FAF0E6]/80 font-medium">
              読み込み中...
            </div>
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-6">
              {groupedTopics.map((group: any, index: number) => (
                <div
                  key={`group-${index}`}
                  className="bg-gray-50 text-[#1E2761] p-7 rounded-3xl shadow-lg relative overflow-hidden border border-[#1E2761]/30"
                >
                  {/* 日付 */}
                  <div className="flex items-center gap-4 mb-5 pb-2 border-b border-[#028090]/20">
                    <span className="tabular-nums font-extrabold text-lg">
                      {group.created_at
                        ? new Date(group.created_at).toLocaleDateString(
                            'ja-JP',
                            { month: 'numeric', day: 'numeric' }
                          )
                        : '--/--'}
                    </span>
                    {/* トピック名 */}
                    <span className="text-lg font-extrabold tracking-tight">
                      {group.country_summaries?.topic_name ||
                        group.comparison_summary?.topic_name ||
                        group.topic_name ||
                        '読み込み中...'}
                    </span>
                  </div>

                  {/* リンク/選択ボタンをまとまって表示 */}
                  <div className="flex flex-wrap gap-3">
                    {group.links.map((link: any) => (
                      <div key={link.favorite_id} className="relative">
                        {isEditMode ? (
                          // 編集モード時のチェックボタン
                          <button
                            onClick={() =>
                              toggleSelect({
                                favorite_id: link.favorite_id,
                                type: link.type,
                                target_id: link.target_id,
                              })
                            }
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[14px] border transition-all ${
                              selectedIds.some(
                                (item) => item.favorite_id === link.favorite_id
                              )
                                ? 'bg-[#E8603C] text-white border-[#E8603C]/400'
                                : 'bg-white/40 text-[#2D4A36] border-[#2D4A36]/10'
                            }`}
                          >
                            {/* チェックボックス */}
                            <input
                              type="checkbox"
                              readOnly
                              checked={selectedIds.some(
                                (item) => item.favorite_id === link.favorite_id
                              )}
                              className="pointer-events-none h-3 w-3 accent-[#E8603C]"
                            />
                            {link.label}
                          </button>
                        ) : (
                          // 通常モード時のリンクボタン
                          <Link
                            href={
                              link.type === 'country'
                                ? `/topic/${link.target_id}`
                                : `/comparison/${link.target_id}`
                            }
                            className="px-5 py-2.5 bg-gray-50 text-[#1E2761] rounded-xl text-sm font-bold shadow hover:bg-[#FAF0E6]/90 transition-colors flex items-center gap-2"
                          >
                            {/* アイコン */}
                            <span>{link.label}</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ログアウトボタン */}
        <div className="mx-auto mt-12 w-full flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-[#1E2761]/40 hover:text-[#E8603C] transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* --- トースト表示 --- */}
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
    </RequireAuth>
  );
}
