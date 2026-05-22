'use client';

import { useEffect, useId } from 'react';

type AboutAppModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AboutAppModal({ open, onClose }: AboutAppModalProps) {
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
            アプリについて
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-brand-text transition-colors hover:bg-brand-accent-soft"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 p-4 text-sm leading-relaxed text-brand-text">
          <p>
            Global Lenz は、同じトピックを複数の国・メディア視点で比べられるニュース比較アプリです。
          </p>
          <p>
            主要メディアの報道を AI が比較要約し、用語解説とあわせて、商談前の話題収集をサポートします。
          </p>
          <p className="text-brand-muted">
            データソース: NHK / CNN / BBC / Al Jazeera / DD News
          </p>
        </div>
      </div>
    </div>
  );
}
