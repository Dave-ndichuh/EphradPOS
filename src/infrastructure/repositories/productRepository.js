'use server';

import prisma from '@/lib/prisma';
import { UTApi } from 'uploadthing/server';

// Helper to delete an image via UploadThing
async function deleteUploadThingImage(imageUrl) {
  if (!imageUrl) return;
  const utapi = new UTApi();
  try {
    const parts = imageUrl.split('/f/');
    if (parts.length > 1) {
      const fileKey = parts[1];
      await utapi.deleteFiles(fileKey);
      console.log(`Deleted image from UploadThing: ${fileKey}`);
    }
  } catch (err) {
    console.error('Failed to delete image from UploadThing:', err);
  }
}

export async function getAllProducts(branchId) {
  try {
    const data = await prisma.product.findMany({
      where: branchId ? { BRANCH_ID: parseInt(branchId, 10) } : {},
      include: {
        category: {
          select: { CNAME: true }
        },
        supplier: {
          select: { COMPANY_NAME: true }
        }
      },
      orderBy: { PRODUCT_ID: 'desc' }
    });
    return data.map(p => ({
      ...p,
      PRICE: p.PRICE ? Number(p.PRICE) : null,
      COST_PRICE: p.COST_PRICE ? Number(p.COST_PRICE) : null,
      TAX_RATE: p.TAX_RATE ? Number(p.TAX_RATE) : null,
    }));
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch products');
  }
}

export async function getAllCategories() {
  try {
    const data = await prisma.category.findMany({
      orderBy: { CNAME: 'asc' }
    });
    return data;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch categories');
  }
}

export async function getAllSuppliers() {
  try {
    const data = await prisma.supplier.findMany();
    return data;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch suppliers');
  }
}

export async function createProduct(payload, branchId) {
  try {
    const data = await prisma.product.create({
      data: {
        PRODUCT_CODE: payload.PRODUCT_CODE,
        NAME: payload.NAME,
        DESCRIPTION: payload.DESCRIPTION,
        BRANCH_ID: branchId ? parseInt(branchId, 10) : null,
        QTY_STOCK: payload.QTY_STOCK,
        ON_HAND: payload.ON_HAND,
        PRICE: payload.PRICE,
        COST_PRICE: payload.COST_PRICE,
        CATEGORY_ID: payload.CATEGORY_ID,
        SUPPLIER_ID: payload.SUPPLIER_ID,
        DATE_STOCK_IN: payload.DATE_STOCK_IN,
        STATUS: payload.STATUS,
        UOM: payload.UOM,
        REORDER_THRESHOLD: payload.REORDER_THRESHOLD,
        BARCODE: payload.BARCODE,
        IMAGE_URL: payload.IMAGE_URL,
        TAX_RATE: payload.TAX_RATE,
        BRAND: payload.BRAND,
        MODEL: payload.MODEL,
        WEIGHT: payload.WEIGHT
      }
    });
    return data;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(id, payload) {
  try {
    // Check if the image changed, to delete the old one
    if (payload.IMAGE_URL !== undefined) {
      const oldProduct = await prisma.product.findUnique({
        where: { PRODUCT_ID: id },
        select: { IMAGE_URL: true }
      });
      if (oldProduct?.IMAGE_URL && oldProduct.IMAGE_URL !== payload.IMAGE_URL) {
        await deleteUploadThingImage(oldProduct.IMAGE_URL);
      }
    }

    const data = await prisma.product.update({
      where: { PRODUCT_ID: id },
      data: payload
    });
    return data;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update product');
  }
}

export async function deleteProduct(id) {
  try {
    const oldProduct = await prisma.product.findUnique({
      where: { PRODUCT_ID: id },
      select: { IMAGE_URL: true }
    });

    await prisma.product.delete({
      where: { PRODUCT_ID: id }
    });
    
    if (oldProduct?.IMAGE_URL) {
      await deleteUploadThingImage(oldProduct.IMAGE_URL);
    }
    
    return { success: true };
  } catch (error) {
    // If there is a foreign key constraint violation (code P2003 in Prisma)
    if (error.code === 'P2003') {
      try {
        await prisma.product.update({
          where: { PRODUCT_ID: id },
          data: { STATUS: 'inactive' }
        });
        return { archived: true };
      } catch (softError) {
        console.error(softError);
        throw new Error('Failed to archive product');
      }
    }
    console.error(error);
    throw new Error('Failed to delete product');
  }
}
