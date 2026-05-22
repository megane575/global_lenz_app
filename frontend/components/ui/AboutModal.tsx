'use client';

import { useEffect, useId } from 'react';

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

function IconNewspaper({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M18 18h-8" />
      <path d="M10 6h8" />
      <path d="M10 10h8" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconSplit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v18" />
      <path d="m8 7 4-4 4 4" />
      <path d="m8 17 4 4 4-4" />
    </svg>
  );
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
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
        aria-label="背景をクリックして閉じる"
        className="absolute inset-0 bg-brand-text/25 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-3xl border border-brand-border bg-brand-surface shadow-soft"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-3.5 sm:px-6">
          <h2
            id={titleId}
            className="text-base font-semibold tracking-tight text-brand-text sm:text-[1.0625rem]"
          >
            Global Lenz について
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-lg text-brand-text transition-all duration-200 hover:bg-brand-accent-soft"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 text-sm leading-[1.55] text-brand-text sm:px-7 sm:py-6">
          <section className="mb-6">
            <p className="font-medium text-brand-text">
              同じニュースを複数の国・メディア視点で比較し、多角的に理解するためのツールです。AIが主要メディアを比較要約し、商談前の話題収集や背景理解をサポートします。
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-brand-muted">
              ご利用ガイド
            </h3>

            <ul className="space-y-2">
              <li className="flex gap-3 rounded-2xl border border-brand-border bg-brand-surface p-3.5 shadow-[0_1px_0_rgb(0_0_0_/0.04)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent-soft text-brand-accent-deep">
                  <IconNewspaper className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text">
                    参照ソース
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-brand-muted">
                    NHK（
                    <strong className="font-semibold text-brand-text">
                      日本
                    </strong>
                    ）、BBC（
                    <strong className="font-semibold text-brand-text">
                      イギリス
                    </strong>
                    ）、CNN（
                    <strong className="font-semibold text-brand-text">
                      アメリカ
                    </strong>
                    ）、Doordarshan（
                    <strong className="font-semibold text-brand-text">
                      インド
                    </strong>
                    ）、Al Jazeera（
                    <strong className="font-semibold text-brand-text">
                      カタール
                    </strong>
                    ）の5媒体
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-brand-border bg-brand-surface p-3.5 shadow-[0_1px_0_rgb(0_0_0_/0.04)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent-soft text-brand-accent-deep">
                  <IconChat className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text">
                    話のネタおすすめ度
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-brand-muted">
                    アイスブレイクとして機能しやすいかの指標です
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-brand-border bg-brand-surface p-3.5 shadow-[0_1px_0_rgb(0_0_0_/0.04)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent-soft text-brand-accent-deep">
                  <IconSplit className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text">
                    主張のバラつき度
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-brand-muted">
                    メディア間の主張の違いの指標です
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
