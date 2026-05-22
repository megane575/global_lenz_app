import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('お気に入りがない旨の文言を表示する', () => {
    render(<EmptyState />);
    expect(
      screen.getByText('まだお気に入りがありません'),
    ).toBeInTheDocument();
  });
});
