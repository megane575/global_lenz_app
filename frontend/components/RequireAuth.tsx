'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(); // loading を必ず取る
  const router = useRouter();

  useEffect(() => {
    // loading が終わって、かつ user が「本当に null」の時だけ飛ばす
    if (!loading && user === null) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${currentPath}`);
    }
  }, [user, loading, router]);

  // loading 中は何も出さない（またはぐるぐるを出す）
  if (loading || user === undefined) {
    return <div className="min-h-screen bg-brand-canvas" />;
  }

  return user ? <>{children}</> : null;
}
