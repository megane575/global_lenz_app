import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import LayoutClientShell from '@/components/layout/LayoutClientShell';

export const metadata = {
  title: 'Global Lenz',
  description: 'ニュース比較アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="bg-brand-canvas">
      <body className="flex min-h-screen flex-col bg-brand-canvas text-brand-text antialiased">
        <AuthProvider>
          <LayoutClientShell>{children}</LayoutClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
