'use server';

import prisma from '@/lib/prisma';

export async function getDashboardMetrics() {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 1. Fetch Products for stock metrics
    const products = await prisma.product.findMany({
      select: { PRODUCT_ID: true, NAME: true, ON_HAND: true, COST_PRICE: true }
    });
    
    let stockVal = 0;
    let lowStock = 0;
    products.forEach(p => {
      const onHand = Number(p.ON_HAND) || 0;
      const cost = Number(p.COST_PRICE) || 0;
      if (onHand > 0) stockVal += (onHand * cost);
      if (onHand <= 5) lowStock++;
    });

    // 2. Fetch Transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        CREATED_AT: {
          gte: firstDayOfMonth
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
              select: { NAME: true, COST_PRICE: true }
            }
          }
        }
      },
      orderBy: { CREATED_AT: 'asc' }
    });

    let tSales = 0;
    let tCost = 0;
    let tCount = 0;
    const productSales = {};
    
    let cashTotal = 0;
    let mpesaTotal = 0;
    let creditTotal = 0;

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    const trendMap = {};
    for(let i=0; i<7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      trendMap[`${yyyy}-${mm}-${dd}`] = 0;
    }

    transactions.forEach(t => {
      const saleTotal = Number(t.ADJUSTED_TOTAL) || Number(t.GRAND_TOTAL) || 0;
      if (saleTotal === 0) return; // skip 0 value

      tCount++;
      tSales += saleTotal;

      // Trend Chart
      if (t.CREATED_AT) {
        const tD = new Date(t.CREATED_AT);
        const tDate = `${tD.getFullYear()}-${String(tD.getMonth() + 1).padStart(2, '0')}-${String(tD.getDate()).padStart(2, '0')}`;
        if (trendMap[tDate] !== undefined) {
          trendMap[tDate] += saleTotal;
        }
      }

      // Payment Methods
      if (t.PAYMENT_METHOD === 'Cash') cashTotal += saleTotal;
      else if (t.PAYMENT_METHOD === 'M-Pesa') mpesaTotal += saleTotal;
      else if (t.PAYMENT_METHOD === 'Credit') creditTotal += saleTotal;
      else if (t.PAYMENT_METHOD === 'Hybrid') {
        cashTotal += Number(t.CASH_AMOUNT) || 0;
        mpesaTotal += Number(t.MPESA_AMOUNT) || 0;
      }

      // Details for COGS & Top Product
      if (t.transaction_details) {
        t.transaction_details.forEach(d => {
          const cost = Number(d.product?.COST_PRICE) || 0;
          const qty = Number(d.QTY) || 0;
          tCost += (cost * qty);

          if (!productSales[d.PRODUCT_ID]) {
            productSales[d.PRODUCT_ID] = { name: d.product?.NAME || 'Unknown Part', qty: 0 };
          }
          productSales[d.PRODUCT_ID].qty += qty;
        });
      }
    });

    const grossProfit = tSales - tCost;
    const profitMargin = tSales > 0 ? (grossProfit / tSales) * 100 : 0;
    const atv = tCount > 0 ? tSales / tCount : 0;

    const topProductArr = Object.values(productSales).sort((a, b) => b.qty - a.qty);
    const topP = topProductArr.length > 0 ? topProductArr[0] : { name: 'N/A', qty: 0 };

    const trendData = Object.keys(trendMap).sort().map(date => {
      const [, month, day] = date.split('-');
      return { name: `${day}/${month}`, Sales: trendMap[date] };
    });

    const payData = [
      { name: 'Cash', value: cashTotal, color: '#3b82f6' },
      { name: 'M-Pesa', value: mpesaTotal, color: '#25D366' },
      { name: 'Credit', value: creditTotal, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    return {
      metrics: {
        totalSales: tSales,
        grossProfit,
        profitMargin,
        transactionCount: tCount,
        atv,
        stockValue: stockVal,
        lowStockCount: lowStock,
        topProduct: { name: topP.name, units: topP.qty }
      },
      salesTrend: trendData,
      paymentData: payData
    };
  } catch (error) {
    console.error('Error in getDashboardMetrics:', error);
    return null;
  }
}
