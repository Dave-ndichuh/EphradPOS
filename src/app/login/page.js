'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import InstallPrompt from '@/components/InstallPrompt';
import { logAction } from '@/lib/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { signIn } = await import('next-auth/react');
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (res?.error) {
        throw new Error(res.error);
      }
      
      await logAction({
        action: 'Admin Login',
        details: `Admin user ${email} logged in via NextAuth.`,
        severity: 'info',
        userEmail: email
      });

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          background: #FAFAFA;
        }

        /* LEFT BRANDING PANEL */
        .brand-panel {
          flex: 1;
          background: linear-gradient(135deg, #0A2463 0%, #051234 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2rem;
          color: #FFFFFF;
          position: relative;
          overflow: hidden;
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 80%, rgba(0, 180, 216, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(217, 4, 41, 0.1) 0%, transparent 50%);
          z-index: 0;
        }

        .brand-content {
          position: relative;
          z-index: 1;
          max-width: 480px;
          text-align: center;
          margin: 0 auto;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease;
          text-align: left;
        }
        .feature-item:hover {
          transform: translateX(10px);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          background-color: #F8FAFC;
          background-image: radial-gradient(#CBD5E1 1px, transparent 1px);
          background-size: 24px 24px;
          position: relative;
        }

        .form-card {
          width: 100%;
          max-width: 440px;
          background: linear-gradient(145deg, #FFFFFF 0%, #FFF0F2 100%);
          padding: 3rem 2.5rem;
          border-radius: 24px;
          border: 1px solid rgba(217, 4, 41, 0.1);
          box-shadow: 0 25px 50px -12px rgba(217, 4, 41, 0.08), 0 0 0 1px rgba(217, 4, 41, 0.05);
          position: relative;
          z-index: 10;
        }

        .form-wrapper {
          width: 100%;
        }

        .login-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          background: #FFFFFF;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.95rem;
          height: 48px;
          color: #0A2463;
          transition: all 0.2s ease;
        }

        .login-input:focus {
          outline: none;
          border-color: #00B4D8;
          box-shadow: 0 4px 15px rgba(0, 180, 216, 0.1);
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
          transition: color 0.2s ease;
        }

        .input-group:focus-within .input-icon {
          color: #00B4D8;
        }

        .login-btn {
          width: 100%;
          padding: 0.875rem;
          background: #0A2463;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(10, 36, 99, 0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        .login-btn:hover {
          background: #081D52;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(10, 36, 99, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        :global(.switch-portal) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          width: 100%;
          border-radius: 12px;
          background: #FFFFFF;
          color: #0A2463;
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        :global(.switch-portal:hover) {
          border-color: #00B4D8;
          background: rgba(0, 180, 216, 0.05);
          color: #00B4D8;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 180, 216, 0.15);
        }

        @media (max-width: 900px) {
          .login-container {
            flex-direction: column;
          }
          .brand-panel {
            padding: 3rem 1.5rem;
            min-height: 40vh;
            justify-content: center;
          }
          .form-panel {
            padding: 3rem 1.5rem;
          }
          .feature-list {
            display: none; /* Hide features on mobile to save space */
          }
        @media (max-height: 768px) {
          .brand-panel { padding: 1.5rem; }
          .form-panel { padding: 1.5rem; background-size: 20px 20px; }
          .form-card { padding: 2rem 1.5rem; }
          .feature-item { padding: 0.75rem; }
          .feature-list { gap: 0.75rem; }
          .brand-content h1 { font-size: 2rem !important; }
        }
      `}</style>

      {/* LEFT: Brand Panel */}
      <div className="brand-panel" style={{ alignItems: 'center' }}>
        <div className="brand-content">
          <img src="/logo.png" alt="Ephrad POS Logo" style={{ display: 'inline-block', height: '56px', marginBottom: '1.5rem', borderRadius: '8px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            Executive<br/>Dashboard
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#94A3B8', lineHeight: 1.6 }}>
            Comprehensive analytics, inventory control, and business management at your fingertips.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <TrendingUp size={24} color="#00B4D8" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Real-time Analytics</h3>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>Monitor sales trends, profit margins, and revenue growth instantly.</p>
              </div>
            </div>
            <div className="feature-item">
              <ShieldCheck size={24} color="#00B4D8" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Secure Management</h3>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>Enterprise-grade security for your financial and inventory data.</p>
              </div>
            </div>
            <div className="feature-item">
              <Users size={24} color="#00B4D8" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Workforce Control</h3>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>Track employee performance, assign services, and manage permissions.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.875rem', color: '#64748B', marginTop: '1.5rem', textAlign: 'center' }}>
          <div>&copy; {new Date().getFullYear()} Ephrad Enterprises Limited. All rights reserved.</div>
          <div style={{ marginTop: '0.5rem' }}>
            System by: <a href="https://machariandichu.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#00B4D8', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FFFFFF'} onMouseLeave={(e) => e.target.style.color = '#00B4D8'}>Nexus Solutions</a>
          </div>
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      <div className="form-panel">
        <div className="form-card animate-fade-in">
          <div className="form-wrapper">
            
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'rgba(217, 4, 41, 0.08)', borderRadius: '16px', marginBottom: '1.25rem' }}>
                <Lock size={28} color="#D90429" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0A2463', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome Back</h2>
              <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Enter your credentials to access the admin portal.</p>
            </div>

            {error && (
              <div style={{ padding: '1rem', background: 'rgba(217, 4, 41, 0.1)', border: '1px solid rgba(217, 4, 41, 0.2)', borderRadius: '12px', color: '#D90429', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  className="login-input"
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ position: 'relative' }}>
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  className="login-input"
                  placeholder="Secure Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Authenticate'}
              </button>
            </form>

            <div style={{ width: '100%', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
              <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Are you a staff member?</p>
              <Link href="/employee-login" className="switch-portal">
                Go to Staff Terminal <ArrowRight size={18} />
              </Link>
            </div>
            
          </div>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
