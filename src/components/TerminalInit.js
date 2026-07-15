'use client';

import { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { getBranches } from '@/actions/branch';
import { useAuth } from '@/components/AuthGuard';

export default function TerminalInit() {
  const { setBranch } = useBranch();
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getBranches();
      setBranches(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSelect = (branch) => {
    setBranch(branch.BRANCH_ID, branch.NAME);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading branches...</div>;
  }

  // If the user is an employee, they might be restricted to their own branch.
  // The backend action `getBranches` will return only their branch if they are staff.
  // If only one branch is returned and they are staff, auto-select it.
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="glass p-8 rounded-2xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-2">Terminal Initialization</h2>
        <p className="text-muted-foreground mb-6">
          Please select the physical branch location for this terminal session. All transactions will be recorded under this location.
        </p>
        
        <div className="flex flex-col gap-3">
          {branches.map(b => (
            <button 
              key={b.BRANCH_ID}
              onClick={() => handleSelect(b)}
              className="btn btn-primary w-full p-4 rounded-xl text-lg hover:scale-105 transition-transform"
            >
              {b.NAME}
            </button>
          ))}
          {branches.length === 0 && (
            <p className="text-red-500">No branches found in database.</p>
          )}
        </div>
      </div>
    </div>
  );
}
