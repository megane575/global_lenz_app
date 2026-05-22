import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BottomNav from './BottomNav';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('BottomNav', () => {
  it('ホーム・ネタ帳へのリンクとコールバック付きボタンがある', () => {
    const onOpenLinks = vi.fn();
    const onOpenAbout = vi.fn();
    render(
      <BottomNav onOpenLinks={onOpenLinks} onOpenAbout={onOpenAbout} />,
    );

    const home = screen.getByRole('link', { name: /ホーム/ });
    expect(home).toHaveAttribute('href', '/');

    const notebook = screen.getByRole('link', { name: /ネタ帳/ });
    expect(notebook).toHaveAttribute('href', '/notebook');

    fireEvent.click(screen.getByRole('button', { name: /アプリについて/ }));
    expect(onOpenAbout).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /便利リンク集/ }));
    expect(onOpenLinks).toHaveBeenCalledTimes(1);
  });
});
