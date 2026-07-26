'use server';

import prisma from '@/lib/prisma';
import { logAction } from '@/lib/logger';
import { formatTransId } from '@/utils/formatters';

export async function getCreditAccounts(branchId) {
  try {
    const accounts = await prisma.credit_account.findMany({
      where: branchId && branchId !== 'ALL' ? { BRANCH_ID: parseInt(branchId, 10) } : {},
      include: {
        customer: {
          select: {
            FIRST_NAME: true,
            LAST_NAME: true,
            PHONE_NUMBER: true,
          }
        }
      },
      orderBy: {
        CURRENT_BALANCE: 'desc'
      }
    });

    return { success: true, data: accounts };
  } catch (error) {
    console.error('Error fetching credit accounts:', error);
    return { success: false, error: 'Failed to fetch credit accounts' };
  }
}

export async function createCreditAccount({ customerId, creditLimit, branchId }) {
  try {
    const newAccount = await prisma.credit_account.create({
      data: {
        CUSTOMER_ID: parseInt(customerId, 10),
        CREDIT_LIMIT: parseFloat(creditLimit),
        STATUS: 'active',
        CURRENT_BALANCE: 0,
        BRANCH_ID: branchId === 'ALL' ? 1 : parseInt(branchId, 10),
      }
    });

    await logAction({
      action: 'Created Credit Account',
      details: `Created credit account for customer ID: ${customerId} with limit: ${creditLimit}`,
      severity: 'info',
    });

    return { success: true, data: newAccount };
  } catch (error) {
    console.error('Error creating credit account:', error);
    return { success: false, error: 'Failed to create credit account' };
  }
}

export async function updateCreditAccount(accountId, data) {
  try {
    const updated = await prisma.credit_account.update({
      where: { ID: parseInt(accountId, 10) },
      data: {
        ...data
      }
    });

    await logAction({
      action: 'Updated Credit Account',
      details: `Updated credit account ID: ${accountId}`,
      severity: 'info',
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating credit account:', error);
    return { success: false, error: 'Failed to update credit account' };
  }
}

export async function getCreditAccountByCustomer(customerId) {
  try {
    const account = await prisma.credit_account.findFirst({
      where: { CUSTOMER_ID: parseInt(customerId, 10) },
      include: {
        customer: true,
      }
    });

    return { success: true, data: account };
  } catch (error) {
    console.error('Error fetching credit account:', error);
    return { success: false, error: 'Failed to fetch credit account' };
  }
}

export async function getCustomerLedger(customerId) {
  try {
    const account = await prisma.credit_account.findFirst({
      where: { CUSTOMER_ID: parseInt(customerId, 10) },
      include: { customer: true }
    });

    if (!account) return { success: false, error: 'Account not found' };

    // Fetch credit sales
    const salesTrans = await prisma.transaction.findMany({
      where: {
        CREDIT_CUSTOMER_ID: parseInt(customerId, 10),
        IS_CREDIT: true
      },
      include: {
        transaction_details: {
          include: { product: { select: { NAME: true, BRAND: true, MODEL: true } } }
        }
      }
    });

    // Fetch payments logged in system_logs
    const paymentLogs = await prisma.system_logs.findMany({
      where: {
        ACTION: 'Credit Payment',
        details: { contains: `Customer ID: ${customerId}` }
      }
    });

    const unifiedLedger = [];

    salesTrans.forEach(st => {
      const total = Number(st.ADJUSTED_TOTAL || st.GRAND_TOTAL);
      const paid = Number(st.CASH_AMOUNT || 0) + Number(st.MPESA_AMOUNT || 0);
      unifiedLedger.push({
        id: st.TRANS_ID,
        date: new Date(st.CREATED_AT).getTime(),
        dateStr: st.CREATED_AT,
        description: `Credit Sale`,
        debit: total, // Adding to debt
        credit: null,
        settled: st.IS_SETTLED,
        paid: paid,
        status: st.status,
        items: st.transaction_details
      });
    });

    paymentLogs.forEach(log => {
      // Parse amount from details if possible, e.g., "Paid 5000 via M-Pesa"
      const match = log.details.match(/Amount: (\d+(\.\d+)?)/);
      const amount = match ? parseFloat(match[1]) : 0;
      unifiedLedger.push({
        id: `pay-${log.LOG_ID}`,
        date: new Date(log.TIMESTAMP).getTime(),
        dateStr: log.TIMESTAMP,
        description: `Payment - ${log.details}`,
        debit: null,
        credit: amount
      });
    });

    unifiedLedger.sort((a, b) => a.date - b.date);

    let runningBalance = 0;
    unifiedLedger.forEach(entry => {
      if (entry.debit) runningBalance += Number(entry.debit);
      if (entry.credit) runningBalance -= Number(entry.credit);
      entry.balance = runningBalance;
    });

    return { success: true, data: { account, transactions: unifiedLedger.reverse() } };
  } catch (error) {
    console.error('Error fetching ledger:', error);
    return { success: false, error: 'Failed to fetch ledger' };
  }
}

export async function recordCreditPayment({ customerId, amount, paymentMethod, referenceNo, notes }) {
  try {
    const parsedAmount = parseFloat(amount);
    
    // Decrease balance
    const account = await prisma.credit_account.findFirst({ where: { CUSTOMER_ID: parseInt(customerId, 10) } });
    if (!account) return { success: false, error: 'Account not found' };

    await prisma.credit_account.update({
      where: { ID: account.ID },
      data: {
        CURRENT_BALANCE: { decrement: parsedAmount }
      }
    });

    // Log the payment
    await logAction({
      action: 'Credit Payment',
      details: `Customer ID: ${customerId} | Amount: ${parsedAmount} | Method: ${paymentMethod} | Ref: ${referenceNo} | Notes: ${notes}`,
      severity: 'info',
    });

    return { success: true };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { success: false, error: 'Failed to record payment' };
  }
}
