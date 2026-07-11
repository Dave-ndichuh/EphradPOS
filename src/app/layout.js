import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/AuthGuard';
import Providers from '@/components/Providers';

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
            <AuthProvider>
              <div className="app-layout">
                <Sidebar />
                <div className="main-content">
                  <Topbar />
                  <main className="page-content">
                    {children}
                  </main>
                </div>
              </div>
            </AuthProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

