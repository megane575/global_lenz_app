import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AboutModal from './AboutModal';

describe('AboutModal', () => {
  it('閉じているときは何も出さない', () => {
    const { container } = render(
      <AboutModal open={false} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('開いているときダイアログと主要コピーを表示し閉じるで onClose', () => {
    const onClose = vi.fn();
    render(<AboutModal open onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Global Lenz について' }),
    ).toBeInTheDocument();
    expect(screen.getByText('参照ソース')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
