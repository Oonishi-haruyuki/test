
import { ReactNode } from 'react';
import { AppHeader } from '@/components/header';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
}
