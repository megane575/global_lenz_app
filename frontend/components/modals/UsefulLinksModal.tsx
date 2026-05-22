'use client';

import { useEffect, useId } from 'react';

type UsefulLinksModalProps = {
  open: boolean;
  onClose: () => void;
};

function ShieldCheckIcon({
  size = 20,
  strokeWidth = 1.5,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3 5 6v6c0 5 3.4 8.8 7 10 3.6-1.2 7-5 7-10V6l-7-3Z" />
      <path d="m9.5 12.5 1.8 1.8 3.2-3.3" />
    </svg>
  );
}

function SunIcon({
  size = 20,
  strokeWidth = 1.5,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

const LINKS = [
  {
    icon: 'shield',
    label: '外務省 安全情報',
    href: 'https://www.anzen.mofa.go.jp/',
  },
  { icon: 'sun', label: '各国の天気', href: 'https://www.accuweather.com/' },
] as const;

export default function UsefulLinksModal({
  open,
  onClose,
}: UsefulLinksModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="モーダルを閉じる"
        className="absolute inset-0 bg-brand-text/25 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface shadow-soft"
      >
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold text-brand-text">
            便利リンク集
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-brand-text transition-all duration-200 hover:scale-105 hover:bg-brand-accent-soft"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 p-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-brand-border/80 bg-brand-accent-softer px-4 py-3.5 text-sm font-medium leading-relaxed text-brand-text shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-brand-accent-soft"
            >
              {link.icon === 'shield' ? (
                <ShieldCheckIcon
                  size={20}
                  strokeWidth={1.5}
                  className="text-brand-text"
                />
              ) : (
                <SunIcon size={20} strokeWidth={1.5} className="text-brand-text" />
              )}
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
