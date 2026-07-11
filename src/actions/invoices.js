'use server';

import prisma from '@/lib/prisma';
import { logAction } from '@/lib/logger';

export async function getInvoices(role, employeeId) {
  try {
    const where = (role === 'employee' && employeeId) 
      ? { EMPLOYEE_ID: employeeId }
      : {};

    const data = await prisma.invoice.findMany({
      where,
      include: {
        invoice_details: true
      },
      orderBy: { INVOICE_ID: 'desc' }
    });

    return data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}

export async function getActiveProducts() {
  try {
    const data = await prisma.product.findMany({
      where: { STATUS: 'active' }
    });
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function createInvoice(invoiceData, items, employeeId) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invData = await tx.invoice.create({
        data: {
          CUSTOMER_NAME: invoiceData.CUSTOMER_NAME,
          CUSTOMER_PHONE: invoiceData.CUSTOMER_PHONE,
          CUSTOMER_ADDRESS: invoiceData.CUSTOMER_ADDRESS,
          CUSTOMER_EMAIL: invoiceData.CUSTOMER_EMAIL,
          NOTES: invoiceData.NOTES,
          SUBTOTAL: invoiceData.SUBTOTAL,
          TAX_AMOUNT: invoiceData.TAX_AMOUNT,
          GRAND_TOTAL: invoiceData.GRAND_TOTAL,
          STATUS: 'Pending',
          EMPLOYEE_ID: employeeId
        }
      });

      // 2. Create Invoice Details
      if (items && items.length > 0) {
        await tx.invoice_details.createMany({
          data: items.map(i => ({
            INVOICE_ID: invData.INVOICE_ID,
            PRODUCT_ID: i.PRODUCT_ID,
            DESCRIPTION: i.DESCRIPTION,
            QTY: i.QTY,
            UNIT_PRICE: i.UNIT_PRICE,
            TOTAL_PRICE: i.TOTAL_PRICE
          }))
        });
      }

      // 3. Log Action
      await logAction({
        action: 'Created Invoice',
        details: `Created Invoice #${invData.INVOICE_ID} for ${invoiceData.CUSTOMER_NAME}. Total: Ksh ${invoiceData.GRAND_TOTAL.toLocaleString()}`,
        severity: 'info',
        employeeId: employeeId
      });

      return invData;
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

export async function settleInvoicePayment(invoiceId, paymentMethod, cashAmt, mpesaAmt, employeeId) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch full invoice details
      const inv = await tx.invoice.findUnique({
        where: { INVOICE_ID: invoiceId },
        include: { invoice_details: true }
      });

      if (!inv) throw new Error('Invoice not found');

      // 2. Check stock availability
      for (const item of inv.invoice_details) {
        if (item.PRODUCT_ID) {
          const product = await tx.product.findUnique({
            where: { PRODUCT_ID: item.PRODUCT_ID },
            select: { ON_HAND: true, NAME: true }
          });
          if (product && product.ON_HAND < item.QTY) {
            throw new Error(`Insufficient stock for ${product.NAME}. Available: ${product.ON_HAND}, Required: ${item.QTY}`);
          }
        }
      }

      // 3. Create Transaction
      const isHybrid = paymentMethod === 'Hybrid';
      const tData = await tx.transaction.create({
        data: {
          EMPLOYEE_ID: employeeId || inv.EMPLOYEE_ID,
          SUBTOTAL: inv.SUBTOTAL,
          TAX_AMOUNT: inv.TAX_AMOUNT,
          DISCOUNT_AMOUNT: 0,
          GRAND_TOTAL: inv.GRAND_TOTAL,
          ADJUSTED_TOTAL: inv.GRAND_TOTAL,
          PAYMENT_METHOD: paymentMethod,
          CASH_AMOUNT: cashAmt,
          MPESA_AMOUNT: mpesaAmt,
          HYBRID_PAYMENT: isHybrid,
          IS_CREDIT: false,
          IS_SETTLED: true,
          CASH_TENDERED: inv.GRAND_TOTAL,
          CREDIT_TERMS: `INV-${inv.INVOICE_ID} | ${inv.CUSTOMER_NAME || 'Walk-in'}`
        }
      });

      // 4. Create Transaction Details & Deduct Stock
      for (const i of inv.invoice_details) {
        await tx.transaction_details.create({
          data: {
            TRANS_ID: tData.TRANS_ID,
            PRODUCT_ID: i.PRODUCT_ID,
            QTY: i.QTY,
            UNIT_PRICE: i.UNIT_PRICE,
            SUBTOTAL: i.TOTAL_PRICE
          }
        });
        
        // Deduct stock (replaces old database trigger)
        if (i.PRODUCT_ID) {
          await tx.product.update({
            where: { PRODUCT_ID: i.PRODUCT_ID },
            data: { ON_HAND: { decrement: i.QTY } }
          });
        }
      }

      // 5. Update Invoice Status
      await tx.invoice.update({
        where: { INVOICE_ID: inv.INVOICE_ID },
        data: { STATUS: 'Paid' }
      });

      // 6. Log Action
      await logAction({
        action: 'Paid Invoice',
        details: `Invoice #${inv.INVOICE_ID} marked as Paid via ${paymentMethod}. Transaction #${tData.TRANS_ID} generated.`,
        severity: 'info',
        employeeId: employeeId
      });

      return tData;
    });
  } catch (error) {
    console.error('Error settling invoice:', error);
    throw new Error(error.message || 'Failed to settle invoice');
  }
}
