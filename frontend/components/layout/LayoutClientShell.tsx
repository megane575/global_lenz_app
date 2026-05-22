'use client';

import { useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import AboutModal from '@/components/ui/AboutModal';
import UsefulLinksModal from '@/components/modals/UsefulLinksModal';

type LayoutClientShellProps = {
  children: React.ReactNode;
};

export default function LayoutClientShell({
  children,
}: LayoutClientShellProps) {
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <main className="min-h-screen flex-1 bg-brand-canvas pb-16">{children}</main>
      <BottomNav
        onOpenLinks={() => setIsLinksOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />
      <AboutModal open={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <UsefulLinksModal
        open={isLinksOpen}
        onClose={() => setIsLinksOpen(false)}
      />
    </>
  );
}
