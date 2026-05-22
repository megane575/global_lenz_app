import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FavoriteCard from './FavoriteCard';

describe('FavoriteCard', () => {
  it('タイトル・日付・任意の mediaLine を表示', () => {
    render(
      <FavoriteCard
        id="1"
        title="見出し"
        publishedAt="2025-01-01"
        mediaLine="NHK ほか"
      />,
    );
    expect(screen.getByText('見出し')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('NHK ほか')).toBeInTheDocument();
  });

  it('onToggleSelect があるときボタンでラップされクリックで通知', () => {
    const onToggleSelect = vi.fn();
    render(
      <FavoriteCard
        id="1"
        title="T"
        publishedAt="d"
        onToggleSelect={onToggleSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it('selected のとき選択中の枠クラスが付く', () => {
    const { container } = render(
      <FavoriteCard
        id="1"
        title="T"
        publishedAt="d"
        selected
        onToggleSelect={() => {}}
      />,
    );
    expect(container.querySelector('.border-brand-accent-secondary')).toBeTruthy();
  });
});
