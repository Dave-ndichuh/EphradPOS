'use server';

import prisma from '@/lib/prisma';

export async function getReportData(startDateTime, endDateTime) {
  try {
    // 1. Fetch Transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        CREATED_AT: {
          gte: new Date(startDateTime),
          lte: new Date(endDateTime)
        },
        OR: [
          { IS_CREDIT: false },
          { IS_SETTLED: true }
        ]
      },
      include: {
        transaction_details: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // 2. Fetch All Products
    const products = await prisma.product.findMany({
      include: {
        category: true
      }
    });

    // Map the Prisma data format to match the legacy Supabase format expected by the frontend
    const formattedTransactions = transactions.map(t => ({
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
      transaction_details: t.transaction_details.map(d => ({
        PRODUCT_ID: d.PRODUCT_ID,
        QTY: d.QTY,
        UNIT_PRICE: d.UNIT_PRICE ? Number(d.UNIT_PRICE) : null,
        PRICE: d.PRICE ? Number(d.PRICE) : null,
        SUBTOTAL: d.SUBTOTAL ? Number(d.SUBTOTAL) : null,
        product: d.product ? {
          NAME: d.product.NAME,
          BRAND: d.product.BRAND,
          PRODUCT_CODE: d.product.PRODUCT_CODE,
          COST_PRICE: d.product.COST_PRICE ? Number(d.product.COST_PRICE) : null,
          CATEGORY_ID: d.product.CATEGORY_ID,
          ON_HAND: d.product.ON_HAND,
          category: d.product.category ? { CNAME: d.product.category.CNAME } : null
        } : null
      }))
    }));

    const formattedProducts = products.map(p => ({
      ...p,
      PRICE: p.PRICE ? Number(p.PRICE) : null,
      COST_PRICE: p.COST_PRICE ? Number(p.COST_PRICE) : null,
      TAX_RATE: p.TAX_RATE ? Number(p.TAX_RATE) : null,
      category: p.category ? { CNAME: p.category.CNAME } : null
    }));

    return {
      success: true,
      transactions: formattedTransactions,
      products: formattedProducts
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    return { success: false, error: 'Failed to fetch report data' };
  }
}
