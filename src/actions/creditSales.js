'use server';

import prisma from '@/lib/prisma';
import { logAction } from '@/lib/logger';
import { formatTransId } from '@/utils/formatters';

export async function getCreditSales() {
  try {
    const data = await prisma.transaction.findMany({
      where: {
        IS_CREDIT: true,
        IS_SETTLED: false
      },
      select: {
        TRANS_ID: true,
        CREATED_AT: true,
        ADJUSTED_TOTAL: true,
        GRAND_TOTAL: true,
        CREDIT_DUE_DATE: true,
        CREDIT_TERMS: true,
        IS_SETTLED: true,
        credit_customer: {
          select: {
            FIRST_NAME: true,
            LAST_NAME: true
          }
        }
      },
      orderBy: {
        CREDIT_DUE_DATE: 'asc'
      }
    });
    
    const serializedData = data.map(t => ({
      ...t,
      ADJUSTED_TOTAL: t.ADJUSTED_TOTAL ? Number(t.ADJUSTED_TOTAL) : null,
      GRAND_TOTAL: t.GRAND_TOTAL ? Number(t.GRAND_TOTAL) : null
    }));
    
    return serializedData;
  } catch (error) {
    console.error('Error fetching credit sales:', error);
    throw new Error('Failed to fetch credit sales');
  }
}

export async function settleCreditSale(transId, settlementMode, cashAmount, mpesaAmount) {
  try {
    if (settlementMode === 'Return') {
      // 1. Fetch transaction details to restore stock
      const details = await prisma.transaction_details.findMany({
        where: { TRANS_ID: transId },
        select: { PRODUCT_ID: true, QTY: true }
      });

      // 2. Restore stock for each item using a transaction
      if (details.length > 0) {
        await prisma.$transaction(
          details.map(item =>
            prisma.product.update({
              where: { PRODUCT_ID: item.PRODUCT_ID },
              data: { ON_HAND: { increment: item.QTY } }
            })
          )
        );
      }

      // 3. Mark transaction as returned and zero out totals
      await prisma.transaction.update({
        where: { TRANS_ID: transId },
        data: {
          IS_SETTLED: true,
          PAYMENT_METHOD: 'Returned',
          ADJUSTED_TOTAL: 0,
          GRAND_TOTAL: 0,
          CASH_AMOUNT: 0,
          MPESA_AMOUNT: 0
        }
      });

      await logAction({
        action: 'Returned Credit Sale',
        details: `Transaction #TRX-${formatTransId(transId)} was returned. Items added back to stock and amounts zeroed out.`,
        severity: 'warning'
      });

    } else {
      // Normal settlement (Cash, M-Pesa, Hybrid)
      let updateData = {
        IS_SETTLED: true,
        PAYMENT_METHOD: settlementMode
      };

      if (settlementMode === 'Hybrid') {
        updateData.CASH_AMOUNT = cashAmount || 0;
        updateData.MPESA_AMOUNT = mpesaAmount || 0;
      }

      await prisma.transaction.update({
        where: { TRANS_ID: transId },
        data: updateData
      });

      await logAction({
        action: 'Settled Credit Sale',
        details: `Transaction #TRX-${formatTransId(transId)} was settled via ${settlementMode}.`,
        severity: 'info'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error settling credit sale:', error);
    throw new Error(error.message || 'Failed to settle credit sale');
  }
}
