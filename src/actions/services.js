'use server';

import prisma from '@/lib/prisma';

export async function getServicesData(role, employeeId) {
  try {
    const where = (role === 'staff' && employeeId) 
      ? { EMPLOYEE_ID: parseInt(employeeId, 10) }
      : {};

    const [services, customers, employees, products] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          customer: { select: { FIRST_NAME: true, LAST_NAME: true } },
          employee: { select: { FIRST_NAME: true, LAST_NAME: true } },
          service_details: {
            include: {
              product: { select: { NAME: true, BRAND: true, PRODUCT_CODE: true, MODEL: true } }
            }
          }
        },
        orderBy: { SERVICE_ID: 'desc' }
      }),
      prisma.customer.findMany(),
      prisma.employee.findMany(),
      prisma.product.findMany({ where: { ON_HAND: { gt: 0 } } })
    ]);

    return { success: true, data: { services, customers, employees, products } };
  } catch (error) {
    console.error('Error fetching services data:', error);
    return { success: false, error: 'Failed to fetch services data' };
  }
}

export async function updateServiceStatus(id, status) {
  try {
    await prisma.service.update({
      where: { SERVICE_ID: id },
      data: { STATUS: status }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveServiceAction(editingId, payload, serviceDetails, originalStatus, sessionEmployeeId) {
  try {
    return await prisma.$transaction(async (tx) => {
      let newServiceId = editingId;

      if (editingId) {
        await tx.service.update({
          where: { SERVICE_ID: editingId },
          data: payload
        });
      } else {
        const newSrv = await tx.service.create({
          data: payload
        });
        newServiceId = newSrv.SERVICE_ID;
      }

      // Generate transaction if status changed to Completed
      if (payload.STATUS === 'Completed' && originalStatus !== 'Completed' && editingId) {
        const laborPrice = Number(payload.PRICE) || 0;
        const partsTotal = serviceDetails.reduce((sum, d) => sum + Number(d.SUBTOTAL), 0);
        const grandTotal = laborPrice + partsTotal;

        const transData = await tx.transaction.create({
          data: {
            SUBTOTAL: grandTotal,
            TAX_AMOUNT: 0,
            GRAND_TOTAL: grandTotal,
            DISCOUNT_AMOUNT: 0,
            ADJUSTED_TOTAL: grandTotal,
            PAYMENT_METHOD: 'Pending Payment',
            CASH_AMOUNT: 0,
            MPESA_AMOUNT: 0,
            HYBRID_PAYMENT: false,
            IS_CREDIT: false,
            IS_SETTLED: false,
            CASH_TENDERED: 0,
            EMPLOYEE_ID: payload.EMPLOYEE_ID || sessionEmployeeId
          }
        });

        if (serviceDetails.length > 0) {
          for (const item of serviceDetails) {
            await tx.transaction_details.create({
              data: {
                TRANS_ID: transData.TRANS_ID,
                PRODUCT_ID: item.PRODUCT_ID,
                QTY: item.QTY,
                UNIT_PRICE: item.UNIT_PRICE,
                SUBTOTAL: item.SUBTOTAL
              }
            });
            
            // Deduct Stock
            if (item.PRODUCT_ID) {
              await tx.product.update({
                where: { PRODUCT_ID: item.PRODUCT_ID },
                data: { ON_HAND: { decrement: item.QTY } }
              });
            }
          }
        }
      }

      return { success: true, serviceId: newServiceId };
    });
  } catch (error) {
    console.error('Error saving service:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteServiceAction(id) {
  try {
    // Delete service details first to avoid FK constraint issues if not cascading
    await prisma.service_details.deleteMany({
      where: { SERVICE_ID: id }
    });
    
    await prisma.service.delete({
      where: { SERVICE_ID: id }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addServicePart(serviceId, productId, qty, price) {
  try {
    const subtotal = price * qty;
    await prisma.service_details.create({
      data: {
        SERVICE_ID: serviceId,
        PRODUCT_ID: productId,
        QTY: qty,
        UNIT_PRICE: price,
        SUBTOTAL: subtotal
      }
    });

    // Return the updated service details
    const data = await prisma.service_details.findMany({
      where: { SERVICE_ID: serviceId },
      include: {
        product: { select: { NAME: true, BRAND: true, PRODUCT_CODE: true, MODEL: true } }
      }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function removeServicePart(detailId, serviceId) {
  try {
    await prisma.service_details.delete({
      where: { DETAIL_ID: detailId }
    });

    if (serviceId) {
      const data = await prisma.service_details.findMany({
        where: { SERVICE_ID: serviceId },
        include: {
          product: { select: { NAME: true, BRAND: true, PRODUCT_CODE: true, MODEL: true } }
        }
      });
      return { success: true, data };
    }
    return { success: true, data: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
