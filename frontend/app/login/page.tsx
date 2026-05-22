'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirect);
    }
  }, [user, loading, router, redirect]);

  const handleLogin = async () => {
    setErrorMessage(''); // エラーを初期化
    // 🌟 バリデーションチェック
    if (!email || !password) {
      setErrorMessage('メールアドレスとパスワードを入力してください');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('メールアドレスの形式が正しくありません');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage('メールアドレスまたはパスワードが正しくありません');
        return;
      }

      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token);
      }
      router.push(redirect);
    } catch (error) {
      console.error(error);
      setErrorMessage('予期せぬエラーが発生しました');
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md px-4">
      <div className="card-on-canvas rounded-3xl border border-brand-border/80 p-6 sm:p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-brand-text">ログイン</h2>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-brand-text">
            メールアドレス
          </label>
          <input
            type="email"
            className="w-full rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-brand-text outline-none ring-brand-accent-secondary/30 focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-brand-text">
            パスワード
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-brand-text outline-none ring-brand-accent-secondary/30 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-3xl bg-brand-accent p-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          ログイン
        </button>

        <p className="mt-6 text-sm text-brand-muted">
          アカウントがない場合は
          <Link
            href="/register"
            className="ml-1 font-medium text-brand-accent-secondary underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-10 max-w-md px-4 text-center text-brand-muted">
          読み込み中...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
