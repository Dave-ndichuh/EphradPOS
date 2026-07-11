'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const AuthContext = createContext({ user: null, role: null, employeeId: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  const [authorized, setAuthorized] = useState(false);
  const loading = status === 'loading';

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (status === 'unauthenticated') {
      if (pathname !== '/login' && pathname !== '/employee-login') {
        router.push('/login');
      } else {
        setAuthorized(true);
      }
      return;
    }

    if (status === 'authenticated') {
      const currentRole = session.user.role;
      const employeeId = session.user.id;

      if (currentRole === 'staff') {
        const allowedEmployeeRoutes = ['/pos', '/customers', '/transactions', '/services', '/invoices', '/login', '/employee-login'];
        if (!allowedEmployeeRoutes.includes(pathname)) {
          router.push('/pos');
          return;
        }
      }

      setAuthorized(true);
    }
  }, [status, pathname, router, session]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--background)' }} />;
  }

  if (!authorized && pathname !== '/login' && pathname !== '/employee-login') return null;

  return (
    <AuthContext.Provider value={{ 
      user: session?.user || null, 
      role: session?.user?.role || null, 
      employeeId: session?.user?.id || null, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

