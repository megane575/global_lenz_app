import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('既定ラベル', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('label を差し替え可能', () => {
    render(<LoadingSpinner label="取得中" />);
    expect(screen.getByText('取得中')).toBeInTheDocument();
  });
});
