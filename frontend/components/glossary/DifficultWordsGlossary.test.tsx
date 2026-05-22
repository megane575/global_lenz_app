import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  DifficultWordsGlossaryModal,
  DifficultWordsListSection,
} from './DifficultWordsGlossary';

describe('DifficultWordsListSection', () => {
  it('用語が空なら何も描画しない', () => {
    const { container } = render(
      <DifficultWordsListSection
        terms={[]}
        onSelectTerm={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('用語タグをクリックすると onSelectTerm が呼ばれる', () => {
    const onSelectTerm = vi.fn();
    render(
      <DifficultWordsListSection
        terms={[{ term: 'GDP', description: '…' }]}
        onSelectTerm={onSelectTerm}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /「GDP」の用語解説を開く/ }),
    );
    expect(onSelectTerm).toHaveBeenCalledWith('GDP');
  });
});

describe('DifficultWordsGlossaryModal', () => {
  const titleId = 'glossary-title';

  it('open が false のときは null', () => {
    const { container } = render(
      <DifficultWordsGlossaryModal
        open={false}
        onClose={() => {}}
        titleId={titleId}
        terms={[{ term: 'A', description: 'd' }]}
        focusedTerm={null}
        emptyMessage="空です"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('用語がなく focused もないとき emptyMessage を出す', () => {
    render(
      <DifficultWordsGlossaryModal
        open
        onClose={() => {}}
        titleId={titleId}
        terms={[]}
        focusedTerm={null}
        emptyMessage="用語がありません"
      />,
    );
    expect(screen.getByText('用語がありません')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('用語解説');
  });

  it('focusedTerm に一致する項目は詳細ビュー（説明なしはフォールバック）', () => {
    render(
      <DifficultWordsGlossaryModal
        open
        onClose={() => {}}
        titleId={titleId}
        terms={[{ term: '関税', description: '' }]}
        focusedTerm="関税"
        emptyMessage="x"
      />,
    );
    expect(screen.getByText('関税')).toBeInTheDocument();
    expect(
      screen.getByText('解説文がありません。'),
    ).toBeInTheDocument();
  });

  it('focused が無いときは一覧（説明なしはダッシュ）', () => {
    render(
      <DifficultWordsGlossaryModal
        open
        onClose={() => {}}
        titleId={titleId}
        terms={[
          { term: 'A', description: '本文A' },
          { term: 'B', description: '' },
        ]}
        focusedTerm={null}
        emptyMessage="x"
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('本文A')).toBeInTheDocument();
    expect(within(dialog).getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('閉じるボタンで onClose が呼ばれる', () => {
    const onClose = vi.fn();
    render(
      <DifficultWordsGlossaryModal
        open
        onClose={onClose}
        titleId={titleId}
        terms={[{ term: 'A', description: 'd' }]}
        focusedTerm="A"
        emptyMessage="x"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
