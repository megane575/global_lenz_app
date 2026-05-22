import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('子要素を包む', () => {
    render(
      <Card>
        <p>中身</p>
      </Card>,
    );
    expect(screen.getByText('中身')).toBeInTheDocument();
  });

  it('as でタグを変えられる', () => {
    const { container } = render(
      <Card as="section" className="extra">
        <h2>見出し</h2>
      </Card>,
    );
    const section = container.querySelector('section');
    expect(section?.tagName).toBe('SECTION');
    expect(section?.className).toContain('extra');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('見出し');
  });
});
