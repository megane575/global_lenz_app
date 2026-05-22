import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('positive + symbol は ○ と暗黙の aria-label', () => {
    render(<Badge variant="positive" />);
    expect(screen.getByText('○')).toBeInTheDocument();
    expect(screen.getByLabelText('あり')).toBeInTheDocument();
  });

  it('negative + word は なし', () => {
    render(<Badge variant="negative" display="word" />);
    expect(screen.getByText('なし')).toBeInTheDocument();
  });

  it('positive + word は あり', () => {
    render(<Badge variant="positive" display="word" />);
    expect(screen.getByText('あり')).toBeInTheDocument();
  });

  it('children があればデフォルト文言より優先', () => {
    render(
      <Badge variant="positive" display="symbol">
        カスタム
      </Badge>,
    );
    expect(screen.getByText('カスタム')).toBeInTheDocument();
  });
});
