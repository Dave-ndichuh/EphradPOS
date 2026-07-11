'use server';

import prisma from '@/lib/prisma';
import { logAction } from '@/lib/logger';

export async function getPosData() {
  try {
    const [products, categories, customers] = await Promise.all([
      prisma.product.findMany(),
      prisma.category.findMany({ orderBy: { CNAME: 'asc' } }),
      prisma.customer.findMany()
    ]);
    const serializedProducts = products.map(p => ({
      ...p,
      PRICE: p.PRICE ? Number(p.PRICE) : null,
      COST_PRICE: p.COST_PRICE ? Number(p.COST_PRICE) : null,
      TAX_RATE: p.TAX_RATE ? Number(p.TAX_RATE) : null,
    }));
    return { products: serializedProducts, categories, customers };
  } catch (error) {
    console.error('Error fetching POS data:', error);
    throw new Error('Failed to load POS catalog');
  }
}

export async function createCustomer(data) {
  try {
    const customer = await prisma.customer.create({
      data: {
        FIRST_NAME: data.FIRST_NAME,
        LAST_NAME: data.LAST_NAME,
        PHONE_NUMBER: data.PHONE_NUMBER,
        // EMAIL and ADDRESS aren't in customer prisma schema, ignoring them or they will throw error.
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

export async function createInvoice(data, cart, employeeId) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          CUST_ID: data.CUST_ID,
          TOTAL_AMOUNT: data.SUBTOTAL, // Using SUBTOTAL as total
          STATUS: 'Pending'
        }
      });

      // 2. Create Details
      const details = cart.map(item => {
        const effectivePrice = item.PRICE + (Number(item.adjustment) || 0);
        return {
          INVOICE_ID: invoice.INVOICE_ID,
          PRODUCT_ID: item.PRODUCT_ID,
          QTY: item.quantity,
          PRICE: effectivePrice
        };
      });

      await tx.invoice_details.createMany({ data: details });

      await logAction({
        action: 'Created POS Invoice',
        details: `Invoice #${invoice.INVOICE_ID} created via POS for Ksh. ${data.SUBTOTAL}`,
        severity: 'info'
      });

      return {
        ...invoice,
        invoice_details: details.map(d => ({
          ...d,
          DESCRIPTION: itemNameFromId(cart, d.PRODUCT_ID),
          TOTAL_PRICE: d.PRICE * d.QTY,
          UNIT_PRICE: d.PRICE
        }))
      };
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

function itemNameFromId(cart, id) {
  const item = cart.find(c => c.PRODUCT_ID === id);
  return item ? (item.NAME + (item.BRAND ? ' ' + item.BRAND : '')) : 'Item';
}

export async function createTransaction(data, cart, employeeId) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          SUBTOTAL: data.GRAND_TOTAL,
          GRAND_TOTAL: data.GRAND_TOTAL,
          ADJUSTED_TOTAL: data.GRAND_TOTAL,
          
          PAYMENT_METHOD: data.PAYMENT_METHOD,
          CASH_AMOUNT: data.CASH_AMOUNT,
          MPESA_AMOUNT: data.MPESA_AMOUNT,
          HYBRID_PAYMENT: data.HYBRID_PAYMENT,
          
          IS_CREDIT: data.IS_CREDIT,
          CREDIT_CUSTOMER_ID: data.CREDIT_CUSTOMER_ID,
          CREDIT_DUE_DATE: data.CREDIT_DUE_DATE ? new Date(data.CREDIT_DUE_DATE) : null,
          CREDIT_TERMS: data.CREDIT_TERMS,
          
          CASH_TENDERED: data.CASH_TENDERED,
          IS_SETTLED: !data.IS_CREDIT
        }
      });

      // 2. Create Details
      const details = cart.map(item => {
        const effectivePrice = item.PRICE + (Number(item.adjustment) || 0);
        return {
          TRANS_ID: transaction.TRANS_ID,
          PRODUCT_ID: item.PRODUCT_ID,
          QTY: item.quantity,
          UNIT_PRICE: effectivePrice,
          PRICE: effectivePrice
        };
      });

      await tx.transaction_details.createMany({ data: details });

      // 3. Decrement Stock
      for (const item of cart) {
        await tx.product.update({
          where: { PRODUCT_ID: item.PRODUCT_ID },
          data: { ON_HAND: { decrement: item.quantity } }
        });
      }

      await logAction({
        action: 'Completed Sale',
        details: `Transaction #${transaction.TRANS_ID} completed via ${data.PAYMENT_METHOD} for Ksh. ${data.GRAND_TOTAL}`,
        severity: 'info'
      });

      return transaction;
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to complete sale');
  }
}
