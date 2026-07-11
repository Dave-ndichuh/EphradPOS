'use server';

import prisma from '@/lib/prisma';

export async function getStoreCatalog() {
  try {
    const products = await prisma.product.findMany({
      where: {
        STATUS: 'active',
        ON_HAND: { gt: 0 }
      },
      include: {
        category: {
          select: { CNAME: true }
        }
      },
      orderBy: { PRODUCT_ID: 'desc' }
    });

    // Strip sensitive fields
    return products.map(p => ({
      PRODUCT_ID: p.PRODUCT_ID,
      NAME: p.NAME,
      DESCRIPTION: p.DESCRIPTION,
      PRICE: p.PRICE ? Number(p.PRICE) : null,
      IMAGE_URL: p.IMAGE_URL,
      BRAND: p.BRAND,
      MODEL: p.MODEL,
      CATEGORY_NAME: p.category?.CNAME || 'Uncategorized'
    }));
  } catch (error) {
    console.error('Error fetching store catalog:', error);
    return [];
  }
}

export async function logProductEnquiry(productId) {
  if (!productId) return { success: false };

  try {
    await prisma.product.update({
      where: { PRODUCT_ID: parseInt(productId, 10) },
      data: {
        ENQUIRY_COUNT: { increment: 1 }
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging enquiry:', error);
    return { success: false, error: 'Failed to log enquiry' };
  }
}
