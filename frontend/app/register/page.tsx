'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function RegisterContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleRegister = async () => {
    // バリデーションチェック
    setErrorMessage(''); // 一旦クリア

    // 1. メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('正しいメールアドレスを入力してください');
      return;
    }

    // 2. パスワードの長さチェック（例: 8文字以上）
    if (password.length < 8) {
      setErrorMessage('パスワードは8文字以上で入力してください');
      return;
    }

    // 3. パスワードの一致チェック
    if (password !== confirmPassword) {
      setErrorMessage('パスワードが一致しません');
      return;
    }

    // 新規登録
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }
    // 自動ログイン
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      alert(loginError.message);
      return;
    }

    alert('登録完了しました');

    router.push(redirect);
  };

  return (
    <div className="mx-auto mt-10 max-w-md px-4">
      <div className="card-on-canvas rounded-3xl border border-brand-border/80 p-6 sm:p-8">
        <h2 className="mb-6 text-2xl font-bold text-brand-text">新規登録</h2>

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

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-brand-text">
            パスワード（8文字以上）
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-brand-text outline-none ring-brand-accent-secondary/30 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-brand-text">
            パスワード（確認用）
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-brand-text outline-none ring-brand-accent-secondary/30 focus:ring-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleRegister}
          className="w-full rounded-3xl bg-brand-accent p-3 font-semibold text-white transition-opacity hover:opacity-95"
        >
          登録
        </button>

        <p className="mt-4 text-sm text-brand-muted">
          すでにアカウントがある場合は
          <Link
            href="/login"
            className="ml-1 font-medium text-brand-accent-secondary underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-10 max-w-md px-4 text-center text-brand-muted">
          読み込み中...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
