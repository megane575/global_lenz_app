import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import LoginPage from './page';

const loginNav = vi.hoisted(() => ({
  redirect: '/notebook',
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: loginNav.push,
    replace: loginNav.replace,
  }),
  useSearchParams: () => ({
    get: (k: string) => (k === 'redirect' ? loginNav.redirect : null),
  }),
}));

const authLogin = vi.hoisted(() => ({
  user: null as unknown,
  loading: false,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: authLogin.user,
    loading: authLogin.loading,
  }),
}));

const { signInWithPassword } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword },
  },
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

describe('LoginPage (結合寄り)', () => {
  const lsSetItem = vi.fn();

  beforeEach(() => {
    authLogin.user = null;
    authLogin.loading = false;
    loginNav.redirect = '/notebook';
    loginNav.push.mockReset();
    loginNav.replace.mockReset();
    signInWithPassword.mockReset();
    lsSetItem.mockReset();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: lsSetItem,
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('空入力でバリデーションエラー', async () => {
    render(<LoginPage />);
    await screen.findByRole('heading', { name: 'ログイン' });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    expect(
      await screen.findByText('メールアドレスとパスワードを入力してください'),
    ).toBeInTheDocument();
  });

  it('不正なメール形式でエラー', async () => {
    render(<LoginPage />);
    await screen.findByRole('heading', { name: 'ログイン' });
    const email = document.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    const password = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    expect(
      await screen.findByText('メールアドレスの形式が正しくありません'),
    ).toBeInTheDocument();
  });

  it('ログイン成功で redirect へ push とトークン保存', async () => {
    signInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'jwt-1' },
        user: { id: 'u' },
      },
      error: null,
    });
    render(<LoginPage />);
    await screen.findByRole('heading', { name: 'ログイン' });
    fireEvent.change(document.querySelector('input[type="email"]')!, {
      target: { value: 'a@example.com' },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'a@example.com',
        password: 'password123',
      });
      expect(lsSetItem).toHaveBeenCalledWith('access_token', 'jwt-1');
      expect(loginNav.push).toHaveBeenCalledWith('/notebook');
    });
  });
});
