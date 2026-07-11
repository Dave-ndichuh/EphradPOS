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
      transaction_details: t.transaction_details.map(d => ({
        PRODUCT_ID: d.PRODUCT_ID,
        QTY: d.QTY,
        UNIT_PRICE: d.UNIT_PRICE,
        product: d.product ? {
          NAME: d.product.NAME,
          BRAND: d.product.BRAND,
          PRODUCT_CODE: d.product.PRODUCT_CODE,
          COST_PRICE: d.product.COST_PRICE,
          CATEGORY_ID: d.product.CATEGORY_ID,
          ON_HAND: d.product.ON_HAND,
          category: d.product.category ? { CNAME: d.product.category.CNAME } : null
        } : null
      }))
    }));

    const formattedProducts = products.map(p => ({
      ...p,
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
