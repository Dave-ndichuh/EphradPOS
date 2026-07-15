'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [currentBranchId, setCurrentBranchId] = useState(null);
  const [currentBranchName, setCurrentBranchName] = useState('Global/All');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const savedBranchId = localStorage.getItem('ephrad_branch_id');
    const savedBranchName = localStorage.getItem('ephrad_branch_name');
    
    if (savedBranchId) setCurrentBranchId(parseInt(savedBranchId, 10));
    if (savedBranchName) setCurrentBranchName(savedBranchName);
    
    setIsInitialized(true);
  }, []);

  const setBranch = (id, name) => {
    setCurrentBranchId(id);
    setCurrentBranchName(name);
    
    if (id !== null) {
      localStorage.setItem('ephrad_branch_id', id);
      localStorage.setItem('ephrad_branch_name', name);
    } else {
      localStorage.removeItem('ephrad_branch_id');
      localStorage.removeItem('ephrad_branch_name');
    }
  };

  return (
    <BranchContext.Provider value={{ 
      currentBranchId, 
      currentBranchName, 
      setBranch,
      isInitialized 
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
