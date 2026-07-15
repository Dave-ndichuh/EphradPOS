'use server';

import prisma from '@/lib/prisma';
import { logAction } from '@/lib/logger';
import { formatTransId } from '@/utils/formatters';

export async function getTransactions(employeeId, role, branchId) {
  try {
    const where = {};
    if (role === 'staff' && employeeId) {
      where.EMPLOYEE_ID = parseInt(employeeId, 10);
    }
    if (branchId) {
      where.BRANCH_ID = parseInt(branchId, 10);
    }

    const data = await prisma.transaction.findMany({
      where,
      include: {
        customer: {
          select: { FIRST_NAME: true, LAST_NAME: true }
        },
        credit_customer: {
          select: { FIRST_NAME: true, LAST_NAME: true }
        },
        transaction_details: {
          include: {
            product: {
              select: { NAME: true, BRAND: true, PRODUCT_CODE: true, MODEL: true }
            }
          }
        }
      },
      orderBy: { TRANS_ID: 'desc' }
    });

    const serializedData = data.map(t => ({
      ...t,
      SUBTOTAL: t.SUBTOTAL ? Number(t.SUBTOTAL) : null,
      LESSVAT: t.LESSVAT ? Number(t.LESSVAT) : null,
      NETVAT: t.NETVAT ? Number(t.NETVAT) : null,
      ADDVAT: t.ADDVAT ? Number(t.ADDVAT) : null,
      GRANDTOTAL: t.GRANDTOTAL ? Number(t.GRANDTOTAL) : null,
      GRAND_TOTAL: t.GRAND_TOTAL ? Number(t.GRAND_TOTAL) : null,
      ADJUSTED_TOTAL: t.ADJUSTED_TOTAL ? Number(t.ADJUSTED_TOTAL) : null,
      CASH: t.CASH ? Number(t.CASH) : null,
      CASH_AMOUNT: t.CASH_AMOUNT ? Number(t.CASH_AMOUNT) : null,
      MPESA_AMOUNT: t.MPESA_AMOUNT ? Number(t.MPESA_AMOUNT) : null,
      CASH_TENDERED: t.CASH_TENDERED ? Number(t.CASH_TENDERED) : null,
      DISCOUNT_AMOUNT: t.DISCOUNT_AMOUNT ? Number(t.DISCOUNT_AMOUNT) : null,
      transaction_details: t.transaction_details?.map(d => ({
        ...d,
        UNIT_PRICE: d.UNIT_PRICE ? Number(d.UNIT_PRICE) : null,
        PRICE: d.PRICE ? Number(d.PRICE) : null,
        SUBTOTAL: d.SUBTOTAL ? Number(d.SUBTOTAL) : null,
      })) || []
    }));

    return serializedData;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

export async function settleTransaction(transId, paymentMode, cashAmount, mpesaAmount, totalDue) {
  try {
    let finalCash = 0;
    let finalMpesa = 0;
    let isHybrid = false;

    if (paymentMode === 'Cash') finalCash = totalDue;
    else if (paymentMode === 'M-Pesa') finalMpesa = totalDue;
    else if (paymentMode === 'Hybrid') {
      finalCash = Number(cashAmount);
      finalMpesa = Number(mpesaAmount);
      isHybrid = true;
    }

    const updated = await prisma.transaction.update({
      where: { TRANS_ID: transId },
      data: {
        PAYMENT_METHOD: paymentMode,
        CASH_AMOUNT: finalCash,
        MPESA_AMOUNT: finalMpesa,
        HYBRID_PAYMENT: isHybrid,
        IS_SETTLED: true,
        CASH_TENDERED: totalDue
      }
    });

    return {
      ...updated,
      SUBTOTAL: updated.SUBTOTAL ? Number(updated.SUBTOTAL) : null,
      LESSVAT: updated.LESSVAT ? Number(updated.LESSVAT) : null,
      NETVAT: updated.NETVAT ? Number(updated.NETVAT) : null,
      ADDVAT: updated.ADDVAT ? Number(updated.ADDVAT) : null,
      GRANDTOTAL: updated.GRANDTOTAL ? Number(updated.GRANDTOTAL) : null,
      GRAND_TOTAL: updated.GRAND_TOTAL ? Number(updated.GRAND_TOTAL) : null,
      ADJUSTED_TOTAL: updated.ADJUSTED_TOTAL ? Number(updated.ADJUSTED_TOTAL) : null,
      CASH: updated.CASH ? Number(updated.CASH) : null,
      CASH_AMOUNT: updated.CASH_AMOUNT ? Number(updated.CASH_AMOUNT) : null,
      MPESA_AMOUNT: updated.MPESA_AMOUNT ? Number(updated.MPESA_AMOUNT) : null,
      CASH_TENDERED: updated.CASH_TENDERED ? Number(updated.CASH_TENDERED) : null,
      DISCOUNT_AMOUNT: updated.DISCOUNT_AMOUNT ? Number(updated.DISCOUNT_AMOUNT) : null
    };
  } catch (error) {
    console.error('Error settling transaction:', error);
    throw new Error('Failed to settle transaction');
  }
}

export async function reverseTransaction(transId, reason, employeeId) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Mark transaction as reversed
      const updated = await tx.transaction.update({
        where: { TRANS_ID: transId },
        data: {
          status: 'Reversed',
          reversal_reason: reason
        }
      });

      // 2. Get transaction details to restore stock
      const details = await tx.transaction_details.findMany({
        where: { TRANS_ID: transId },
        select: { PRODUCT_ID: true, QTY: true }
      });

      // 3. Restore stock
      if (details.length > 0) {
        for (const item of details) {
          if (item.PRODUCT_ID) {
            await tx.product.update({
              where: { PRODUCT_ID: item.PRODUCT_ID },
              data: { ON_HAND: { increment: item.QTY } }
            });
          }
        }
      }

      // 4. Log Action
      await logAction({
        action: 'Reversed Transaction',
        details: `Reversed TRX-${formatTransId(transId)}. Reason: ${reason}`,
        severity: 'warning',
        employeeId: employeeId
      });

      return {
        ...updated,
        SUBTOTAL: updated.SUBTOTAL ? Number(updated.SUBTOTAL) : null,
        LESSVAT: updated.LESSVAT ? Number(updated.LESSVAT) : null,
        NETVAT: updated.NETVAT ? Number(updated.NETVAT) : null,
        ADDVAT: updated.ADDVAT ? Number(updated.ADDVAT) : null,
        GRANDTOTAL: updated.GRANDTOTAL ? Number(updated.GRANDTOTAL) : null,
        GRAND_TOTAL: updated.GRAND_TOTAL ? Number(updated.GRAND_TOTAL) : null,
        ADJUSTED_TOTAL: updated.ADJUSTED_TOTAL ? Number(updated.ADJUSTED_TOTAL) : null,
        CASH: updated.CASH ? Number(updated.CASH) : null,
        CASH_AMOUNT: updated.CASH_AMOUNT ? Number(updated.CASH_AMOUNT) : null,
        MPESA_AMOUNT: updated.MPESA_AMOUNT ? Number(updated.MPESA_AMOUNT) : null,
        CASH_TENDERED: updated.CASH_TENDERED ? Number(updated.CASH_TENDERED) : null,
        DISCOUNT_AMOUNT: updated.DISCOUNT_AMOUNT ? Number(updated.DISCOUNT_AMOUNT) : null
      };
    });
  } catch (error) {
    console.error('Error reversing transaction:', error);
    throw new Error('Failed to reverse transaction');
  }
}
