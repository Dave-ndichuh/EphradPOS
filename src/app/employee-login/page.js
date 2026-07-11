'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, KeyRound, Delete, ScanLine, MonitorSmartphone } from 'lucide-react';
import Link from 'next/link';
import InstallPrompt from '@/components/InstallPrompt';
import { logAction } from '@/lib/logger';

export default function EmployeeLoginPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleKeypadPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(null);
    }
  };

  const handleKeypadDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleEmployeeLogin = async (e) => {
    e?.preventDefault();
    if (!pin) {
      setError('Please enter your PIN.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { signIn } = await import('next-auth/react');
      
      const res = await signIn('credentials', {
        pin,
        isEmployee: 'true',
        redirect: false
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      await logAction({
        action: 'Employee Login',
        details: `Employee logged in via PIN using NextAuth.`,
        severity: 'info',
        userEmail: `Employee (PIN: ***)`
      });

      router.push('/pos');
    } catch (err) {
      setError(err.message);
      setPin(''); // Clear pin on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kiosk-layout">
      <style jsx>{`
        .kiosk-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #020817;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          animation: floatOrb 25s infinite ease-in-out alternate;
        }

        .orb-1 {
          top: -10%; left: -10%;
          width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(0, 180, 216, 0.35) 0%, transparent 60%);
        }

        .orb-2 {
          bottom: -20%; right: -10%;
          width: 70vw; height: 70vw;
          background: radial-gradient(circle, rgba(217, 4, 41, 0.25) 0%, transparent 60%);
          animation-direction: alternate-reverse;
          animation-duration: 35s;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5vw, 10vh) scale(1.1); }
          100% { transform: translate(-5vw, -5vh) scale(0.9); }
        }

        .kiosk-card {
          width: 100%;
          max-width: 500px;
          background: rgba(10, 36, 99, 0.5);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(0, 180, 216, 0.3);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 180, 216, 0.15) inset;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .logo-container {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-img {
          height: 60px;
          border-radius: 12px;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
        }

        .terminal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 180, 216, 0.1);
          border: 1px solid rgba(0, 180, 216, 0.2);
          border-radius: 99px;
          color: #00B4D8;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .pin-dots {
          display: flex;
          justify-content: center;
          gap: 1.25rem;
          margin: 1.5rem 0;
          height: 24px;
        }

        .pin-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pin-dot.filled {
          background: #00B4D8;
          border-color: #00B4D8;
          box-shadow: 0 0 15px rgba(0, 180, 216, 0.6);
          transform: scale(1.1);
        }

        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          width: 100%;
          margin-bottom: 1.5rem;
        }

        .keypad-btn {
          height: 64px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: 600;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .keypad-btn:hover, .keypad-btn:active {
          background: rgba(0, 180, 216, 0.1);
          border-color: rgba(0, 180, 216, 0.3);
          color: #00B4D8;
        }

        .keypad-btn:active {
          transform: scale(0.95);
        }

        .keypad-btn.action-btn {
          font-size: 1rem;
          font-weight: 600;
          color: #94A3B8;
        }

        .keypad-btn.action-btn:hover, .keypad-btn.action-btn:active {
          background: rgba(217, 4, 41, 0.1);
          border-color: rgba(217, 4, 41, 0.3);
          color: #D90429;
        }

        .access-btn {
          width: 100%;
          padding: 1rem;
          background: #00B4D8;
          color: #FFFFFF;
          border: none;
          border-radius: 16px;
          font-size: 1.125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 25px -5px rgba(0, 180, 216, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .access-btn:hover {
          background: #0096B4;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(0, 180, 216, 0.5);
        }

        .access-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }

          :global(.switch-portal) {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-top: 0.5rem;
            padding: 1rem 1.5rem;
            width: 100%;
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.8);
            color: #94A3B8;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          :global(.switch-portal:hover) {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            color: #FFFFFF;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5);
          }

        @media (max-width: 600px) {
          .kiosk-layout {
            padding: 1rem;
          }
          .kiosk-card {
            padding: 1.5rem;
            border-radius: 20px;
          }
          .keypad-btn {
            height: 56px;
          }
        @media (max-height: 800px) {
          .kiosk-card { padding: 1.5rem; }
          .logo-img { height: 48px; margin-bottom: 0.5rem; }
          .pin-dots { margin: 1rem 0; }
          .keypad-btn { height: 56px; font-size: 1.25rem; }
          .keypad { gap: 0.5rem; margin-bottom: 1rem; }
          .switch-portal { margin-top: 0.25rem; padding: 0.75rem 1rem; }
          div[style*="marginTop: '1.5rem'"] { margin-top: 1rem !important; padding-top: 1rem !important; }
        }
      `}</style>

      {/* Dynamic Background Orbs */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      <div className="kiosk-card animate-fade-in">
        
        <div className="logo-container">
          <img src="/logo.png" alt="Ephrad POS Logo" className="logo-img" />
          <div className="terminal-badge">
            <MonitorSmartphone size={14} /> Staff Terminal
          </div>
        </div>

        {error && (
          <div style={{ width: '100%', padding: '0.75rem', background: 'rgba(217, 4, 41, 0.1)', border: '1px solid rgba(217, 4, 41, 0.2)', borderRadius: '12px', color: '#D90429', fontSize: '0.875rem', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmployeeLogin} style={{ width: '100%' }}>
          
          {/* PIN Visualizer */}
          <div className="pin-dots">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={`pin-dot ${pin.length > index ? 'filled' : ''}`} />
            ))}
          </div>

          {/* Large Touchscreen Keypad */}
          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} type="button" className="keypad-btn" onClick={() => handleKeypadPress(num.toString())}>
                {num}
              </button>
            ))}
            <button type="button" className="keypad-btn action-btn" onClick={() => setPin('')}>
              CLR
            </button>
            <button type="button" className="keypad-btn" onClick={() => handleKeypadPress('0')}>
              0
            </button>
            <button type="button" className="keypad-btn action-btn" onClick={handleKeypadDelete}>
              <Delete size={22} />
            </button>
          </div>

          <button 
            type="submit" 
            className="access-btn"
            disabled={loading || pin.length < 4}
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                <ScanLine size={20} /> Access System
              </>
            )}
          </button>
        </form>

        <div style={{ width: '100%', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '0.5rem' }}>System Administrator?</p>
          <Link href="/login" className="switch-portal">
            <ArrowLeft size={18} /> Return to Admin Portal
          </Link>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
