'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import TerminalInit from '@/components/TerminalInit';
import { useBranch } from '@/context/BranchContext';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // Define routes that should NOT have the internal dashboard layout
  const isPublicRoute = pathname?.startsWith('/shop') || pathname?.startsWith('/login') || pathname?.startsWith('/employee-login');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const { currentBranchId, isInitialized } = useBranch();

  // Wait for localStorage to hydrate before enforcing initialization
  if (!isInitialized) {
    return <div className="app-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading session...</div>;
  }

  // Force terminal initialization if no branch is selected
  if (currentBranchId === null) {
    return (
      <div className="app-layout" style={{ background: 'var(--background)' }}>
        <TerminalInit />
      </div>
    );
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
