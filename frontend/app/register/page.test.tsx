import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import RegisterPage from './page';

const regNav = vi.hoisted(() => ({
  redirect: '/',
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: regNav.push }),
  useSearchParams: () => ({
    get: (k: string) => (k === 'redirect' ? regNav.redirect : null),
  }),
}));

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

const { signUp, signInWithPassword } = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp,
      signInWithPassword,
    },
  },
}));

describe('RegisterPage (結合寄り)', () => {
  beforeEach(() => {
    regNav.push.mockReset();
    signUp.mockReset();
    signInWithPassword.mockReset();
  });

  it('パスワード8文字未満でエラー', async () => {
    render(<RegisterPage />);
    await screen.findByRole('heading', { name: '新規登録' });
    fireEvent.change(document.querySelector('input[type="email"]')!, {
      target: { value: 'user@example.com' },
    });
    const [pw, confirm] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(pw, { target: { value: 'short' } });
    fireEvent.change(confirm, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));
    expect(
      await screen.findByText('パスワードは8文字以上で入力してください'),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('確認パスワード不一致でエラー', async () => {
    render(<RegisterPage />);
    await screen.findByRole('heading', { name: '新規登録' });
    fireEvent.change(document.querySelector('input[type="email"]')!, {
      target: { value: 'user@example.com' },
    });
    const [pw, confirm] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(pw, { target: { value: 'password123' } });
    fireEvent.change(confirm, { target: { value: 'password999' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));
    expect(
      await screen.findByText('パスワードが一致しません'),
    ).toBeInTheDocument();
  });

  it('登録成功後に自動ログインして redirect へ', async () => {
    signUp.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 't' }, user: {} },
      error: null,
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<RegisterPage />);
    await screen.findByRole('heading', { name: '新規登録' });
    fireEvent.change(document.querySelector('input[type="email"]')!, {
      target: { value: 'new@example.com' },
    });
    const [pw, confirm] = document.querySelectorAll('input[type="password"]');
    fireEvent.change(pw, { target: { value: 'password123' } });
    fireEvent.change(confirm, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));
    await vi.waitFor(() => {
      expect(signUp).toHaveBeenCalled();
      expect(signInWithPassword).toHaveBeenCalled();
      expect(regNav.push).toHaveBeenCalledWith('/');
    });
    expect(alertSpy).toHaveBeenCalledWith('登録完了しました');
    alertSpy.mockRestore();
  });
});
