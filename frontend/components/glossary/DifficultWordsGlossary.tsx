'use client';

import { useEffect, useMemo } from 'react';
import type { DifficultWordItem } from '@/lib/normalizeDifficultWords';

type ListProps = {
  terms: DifficultWordItem[];
  onSelectTerm: (term: string) => void;
  sectionClassName?: string;
};

/** 用語一覧をタグ形式（横並び） */
export function DifficultWordsListSection({
  terms,
  onSelectTerm,
  sectionClassName = 'mt-16',
}: ListProps) {
  if (terms.length === 0) return null;

  return (
    <section
      className={`${sectionClassName} rounded-2xl border border-brand-border/60 bg-brand-surface/50 p-4 shadow-sm`}
    >
      {/* タイトル */}
      <h3 className="mb-3 text-sm font-bold text-brand-text uppercase tracking-wider">
        重要用語一覧
      </h3>
      <div className="flex flex-wrap gap-2">
        {terms.map((item) => (
          <button
            key={item.term}
            type="button"
            onClick={() => onSelectTerm(item.term)}
            aria-label={`「${item.term}」の用語解説を開く`}
            className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm font-medium text-brand-text shadow-sm transition-all hover:border-brand-accent-secondary/50 hover:bg-brand-canvas"
          >
            <span>{item.term}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-canvas text-[10px] text-brand-muted border border-brand-border/50">
              ?
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  terms: DifficultWordItem[];
  focusedTerm: string | null;
  emptyMessage: string;
};

/** モーダル */
export function DifficultWordsGlossaryModal({
  open,
  onClose,
  titleId,
  terms,
  focusedTerm,
  emptyMessage,
}: ModalProps) {
  const focusedEntry = useMemo(() => {
    if (!focusedTerm) return null;
    return terms.find((t) => t.term === focusedTerm) ?? null;
  }, [focusedTerm, terms]);

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-4">
      <button
        type="button"
        aria-label="背景をクリックして閉じる"
        className="animate-backdrop-fade-in absolute inset-0 z-0 bg-brand-text/20 backdrop-blur-[4px]" // ブラーを少し弱めて軽やかに
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-glossary-modal-in relative z-10 flex max-h-[min(80vh,480px)] w-full max-w-md flex-col rounded-2xl border border-brand-border bg-brand-surface shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-brand-text">
            用語解説
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg text-brand-muted transition-all hover:bg-brand-accent-soft hover:text-brand-text"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          {terms.length === 0 ? (
            <p className="text-xs leading-relaxed text-brand-muted">
              {emptyMessage}
            </p>
          ) : focusedEntry ? (
            <div className="rounded-xl border border-brand-border/60 bg-brand-accent-softer/50 px-4 py-4">
              <p className="text-sm font-bold text-brand-text">
                {focusedEntry.term}
              </p>
              <p className="mt-2 text-sm font-normal leading-relaxed text-brand-text">
                {focusedEntry.description || '解説文がありません。'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {terms.map((item) => (
                <li
                  key={item.term}
                  className="rounded-xl border border-brand-border/60 bg-brand-accent-softer/50 px-4 py-3"
                >
                  <p className="text-sm font-bold text-brand-text">
                    {item.term}
                  </p>
                  <p className="mt-1 text-xs font-normal leading-relaxed text-brand-muted">
                    {item.description || '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
