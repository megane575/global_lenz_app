'use client';

import { useState, useEffect, useId, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/components/RequireAuth';
import { deleteFavorite } from '@/lib/api/favorites';
import Image from 'next/image';

import { normalizeDifficultWords } from '@/lib/normalizeDifficultWords';
import {
  DifficultWordsGlossaryModal,
  DifficultWordsListSection,
} from '@/components/glossary/DifficultWordsGlossary';

// 国画像
const flagImages: { [key: string]: string } = {
  日本: '/images/JP.png',
  イギリス: '/images/UK.png',
  アメリカ: '/images/US.png',
  インド: '/images/India.png',
  カタール: '/images/qatar.png',
};

export default function TopicPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryFocusedTerm, setGlossaryFocusedTerm] = useState<string | null>(
    null
  );
  const glossaryTitleId = useId();

  // データを整形する
  const terms = useMemo(
    () => normalizeDifficultWords(topic?.difficult_word),
    [topic?.difficult_word]
  );

  const handleSelectTerm = useCallback((term: string) => {
    setGlossaryFocusedTerm(term);
    setGlossaryOpen(true);
  }, []);

  const closeGlossary = useCallback(() => {
    setGlossaryOpen(false);
    setGlossaryFocusedTerm(null);
  }, []);

  useEffect(() => {
    async function fetchTopic() {
      setLoading(true);
      try {
        const apiUrl = `http://localhost:8000/api/country-summaries/${id}/detail`;
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // 未ログインはログイン画面へ遷移
        if (res.status === 401) {
          router.push('/login'); // ← 未ログインは即遷移
          return;
        }

        if (!res.ok) throw new Error('データの取得に失敗しました');

        const data = await res.json();

        if (data && typeof data === 'object') {
          setTopic(data);

          setIsSaved(data.is_already_saved ?? false);
        } else {
          setTopic(null);
          setIsSaved(false);
        }
      } catch (error) {
        console.error('取得失敗:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTopic();
  }, [id]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('ログアウトしました');
    router.push('/');
  };

  // ネタ帳への保存処理
  const handleSaveToNotebook = async () => {
    try {
      // ログインユーザーを取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert('ログインしてください');
        return;
      }

      const token = session.access_token;

      if (isSaved) {
        // 削除処理
        const isComparisonPage =
          window.location.pathname.includes('comparison');

        await deleteFavorite({
          token,
          id: Number(id),
          type: isComparisonPage ? 'comparison' : 'country',
        });

        setIsSaved(false);
        showToast('ネタ帳から削除しました');
      } else {
        // 保存処理
        const isComparisonPage =
          window.location.pathname.includes('comparison');
        const response = await fetch('http://localhost:8000/api/favorites/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // バックエンドの認証を通す
          },
          body: JSON.stringify({
            [isComparisonPage ? 'comparison_summary_id' : 'country_summary_id']:
              parseInt(id),
          }),
        });

        if (!response.ok) {
          const err = await response.json();

          // 二重保存防止のメッセージチェック
          if (err.detail?.includes('already exists')) {
            setIsSaved(true);
          } else {
            alert('保存失敗: ' + err.detail);
          }
          return;
        }
        setIsSaved(true);
        showToast('ネタ帳に追加しました！');
      }
    } catch (error: any) {
      console.error('操作に失敗しました:', error);
      alert('エラーが発生しました：');
    }
  };

  // トースト表示（1.5秒後に消える）
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 1500);
  };

  if (loading) {
    return <div className="p-10 text-center">読み込み中...</div>;
  }

  if (!topic) {
    return (
      <div className="p-10 text-center bg-[#FDFBF6] min-h-screen">
        データが見つかりませんでした。
      </div>
    );
  }

  return (
    <RequireAuth>
      {' '}
      {/* これで未ログインは弾く */}
      <div className="p-6 max-w-md mx-auto bg-brand-canvas min-h-screen pt-10 text-gray-800">
        {/* ヘッダーエリア*/}
        <header className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
          <div className="flex items-baseline gap-2">
            {/* 日付*/}
            <h1 className="text-xl font-bold">
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

        {/* 要約テキスト */}
        <div className="space-y-6">
          <p className="text-center font-bold mb-6">
            {topic.topic_name}について
          </p>

          {/* 国旗画像エリア */}
          <div className="flex justify-center my-6">
            {flagImages[topic.country_name] && (
              <div className="relative w-28 h-20 transition-opacity duration-300 hover:opacity-100">
                <Image
                  src={flagImages[topic.country_name]}
                  alt={`${topic.country_name}の国旗`}
                  fill
                  sizes="112px"
                  priority
                  className="object-contain mix-blend-multiply opacity-60" // 透過率を少し上げて、より馴染ませる
                />
              </div>
            )}
          </div>

          <div className="border-l-4 border-[#E8603C] py-2 pl-4">
            {/* 要約本文 */}
            <p className="text-sm leading-relaxed tracking-wider pb-10">
              {topic.summary}
            </p>

            {/* 重要用語 */}
            <DifficultWordsListSection
              terms={terms}
              onSelectTerm={handleSelectTerm}
              sectionClassName="mt-6"
            />
          </div>

          {/* 引用元 */}
          <div className="text-xs text-gray-500 border rounded-lg p-4 mt-16 bg-gray-50">
            <span className="font-semibold">引用元</span>

            <span className="ml-1">{topic?.media_name}</span>

            <div className="mt-1">
              <a
                href={topic?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {topic?.url}
              </a>
            </div>
          </div>
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

        {/* 重要用語モーダル */}
        <DifficultWordsGlossaryModal
          open={glossaryOpen}
          onClose={closeGlossary}
          titleId={glossaryTitleId}
          terms={terms}
          focusedTerm={glossaryFocusedTerm}
          emptyMessage="この記事には重要用語の解説がありません。"
        />
      </div>
    </RequireAuth>
  );
}
