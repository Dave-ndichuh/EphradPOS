'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // Define routes that should NOT have the internal dashboard layout
  const isPublicRoute = pathname?.startsWith('/shop') || pathname?.startsWith('/login') || pathname?.startsWith('/employee-login');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
