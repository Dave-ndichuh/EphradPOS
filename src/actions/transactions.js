'use server';

import prisma from '@/lib/prisma';
import { logAction } from '@/lib/logger';
import { formatTransId } from '@/utils/formatters';

export async function getTransactions(employeeId, role) {
  try {
    const where = (role === 'staff' && employeeId) 
      ? { EMPLOYEE_ID: parseInt(employeeId, 10) }
      : {};

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

    return data;
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

    return updated;
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

      return updated;
    });
  } catch (error) {
    console.error('Error reversing transaction:', error);
    throw new Error('Failed to reverse transaction');
  }
}
