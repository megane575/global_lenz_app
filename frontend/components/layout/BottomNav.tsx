'use client';

import Link from 'next/link';

type BottomNavProps = {
  onOpenLinks: () => void;
  onOpenAbout: () => void;
};

export default function BottomNav({
  onOpenLinks,
  onOpenAbout,
}: BottomNavProps) {
  return (
    <footer className="fixed bottom-0 z-50 w-full border border-b-0 border-brand-border/80 bg-brand-surface/95 shadow-lg backdrop-blur-sm">
      <nav className="mx-auto flex max-w-3xl items-center justify-around px-3 py-2">
        {/* ホーム */}
        <Link
          href="/"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-brand-text transition-all duration-200 hover:scale-105 hover:bg-brand-accent-soft active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>ホーム</span>
        </Link>

        {/* アプリについて */}
        <button
          type="button"
          onClick={onOpenAbout}
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-brand-text transition-all duration-200 hover:scale-105 hover:bg-brand-accent-soft active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
            />
          </svg>
          <span>アプリについて</span>
        </button>

        {/* 便利リンク集 */}
        <button
          type="button"
          onClick={onOpenLinks}
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-brand-text transition-all duration-200 hover:scale-105 hover:bg-brand-accent-soft active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span>便利リンク集</span>
        </button>

        {/* ネタ帳 */}
        <Link
          href="/notebook"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-brand-text transition-all duration-200 hover:scale-105 hover:bg-brand-accent-soft active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
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
          <span>ネタ帳</span>
        </Link>
      </nav>
    </footer>
  );
}
