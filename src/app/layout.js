import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/AuthGuard';
import Providers from '@/components/Providers';
import { BranchProvider } from '@/context/BranchContext';

export const metadata = {
  title: 'Ephrad Technology',
  description: 'Premium Point of Sale and Inventory Management System',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
  },
};

export const viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeProvider>
            <BranchProvider>
              <AuthProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </AuthProvider>
            </BranchProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

