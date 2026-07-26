'use client';

import { useEffect, useState, use } from 'react';
import { getCustomerLedger, recordCreditPayment } from '@/actions/credits';
import { useAuth } from '@/components/AuthGuard';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Printer, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatementPrint from '@/components/StatementPrint';

export default function CustomerLedgerPage({ params }) {
  const unwrappedParams = use(params);
  const customerId = unwrappedParams.customer_id;
  
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { employeeId, branchId } = useAuth();
  const router = useRouter();

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  useEffect(() => {
    fetchLedger();
  }, [customerId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await getCustomerLedger(customerId);
      if (!res.success) throw new Error(res.error);
      
      setAccount(res.data.account);
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error('Error fetching ledger:', err);
      alert('Failed to load customer ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    
    setProcessing(true);
    try {
      const res = await recordCreditPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod,
        referenceNo: paymentRef,
        notes: paymentNotes
      });

      if (!res.success) throw new Error(res.error);

      alert(`Payment of Ksh. ${paymentAmount} recorded successfully!`);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      fetchLedger(); // Refresh
      
    } catch (err) {
      alert('Payment failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Ledger...</div>;
  if (!account) return <div style={{ padding: '2rem' }}>Account not found.</div>;

  const available = Number(account.CREDIT_LIMIT) - Number(account.CURRENT_BALANCE);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <button className="btn btn-secondary" onClick={() => router.push('/credits')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="heading-1" style={{ margin: 0 }}>
          {account.customer?.FIRST_NAME} {account.customer?.LAST_NAME}'s Ledger
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid-cards" style={{ marginBottom: '1.5rem', flexShrink: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="glass" style={{ padding: '1.25rem', borderLeft: '4px solid var(--muted)' }}>
          <p className="text-muted" style={{ fontWeight: 600 }}>Credit Limit</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Ksh. {Number(account.CREDIT_LIMIT).toLocaleString()}</h2>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--destructive)' }}>
          <p className="text-muted" style={{ fontWeight: 600 }}>Current Debt</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--destructive)' }}>Ksh. {Number(account.CURRENT_BALANCE).toLocaleString()}</h2>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <p className="text-muted" style={{ fontWeight: 600 }}>Available Credit</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>Ksh. {Math.max(0, available).toLocaleString()}</h2>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexShrink: 0 }}>
        <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
          <CreditCard size={18} /> Record Payment
        </button>
        <button className="btn btn-secondary" onClick={() => router.push('/pos')}>
          <Plus size={18} /> New Credit Sale
        </button>
        <button className="btn btn-secondary" onClick={() => setIsPrinting(true)}>
          <Printer size={18} /> Print Statement
        </button>
      </div>

      {/* Ledger Table */}
      <div className="table-wrapper glass" style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', minHeight: 0 }}>
        <table className="table" style={{ margin: 0 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ background: 'var(--background)' }}>Date</th>
              <th style={{ background: 'var(--background)' }}>Description</th>
              <th style={{ textAlign: 'right', background: 'var(--background)' }}>Debit (Increase)</th>
              <th style={{ textAlign: 'right', background: 'var(--background)' }}>Credit (Payment)</th>
              <th style={{ textAlign: 'right', background: 'var(--background)' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No transactions found.</td></tr>
            ) : (
              transactions.map((tr, index) => (
                <tr key={`${tr.id}-${index}`}>
                  <td>{new Date(tr.dateStr).toLocaleDateString()} {new Date(tr.dateStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td>
                    {tr.description}
                    {tr.items && tr.items.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                          {tr.items.map((item, i) => (
                            <li key={i}>
                              {item.QTY}x {item.product?.NAME} @ Ksh. {Number(item.UNIT_PRICE).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--destructive)', fontWeight: 600 }}>
                    {tr.debit ? `Ksh. ${Number(tr.debit).toLocaleString()}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                    {tr.credit ? `Ksh. ${Number(tr.credit).toLocaleString()}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    Ksh. {Number(tr.balance).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass"
              style={{
                background: 'var(--background)',
                padding: '2rem', width: '100%', maxWidth: '450px',
                borderRadius: '16px', border: '1px solid var(--border)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="heading-2" style={{ margin: 0 }}>Record Payment</h2>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={20} className="text-muted" />
                </button>
              </div>
              
              <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Amount (Ksh)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    step="0.01"
                    className="input" 
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Payment Method</label>
                  <select 
                    className="input" 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Reference / Receipt No.</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. QWE123RTY"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Notes (Optional)</label>
                  <textarea 
                    className="input" 
                    rows="2"
                    placeholder="Any additional details..."
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                    {processing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StatementPrint account={account} transactions={transactions} />
    </div>
  );
}
