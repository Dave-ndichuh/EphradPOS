'use server';

import prisma from '@/lib/prisma';

export async function getSuppliers() {
  try {
    const data = await prisma.supplier.findMany({
      include: {
        location: { select: { CITY: true, PROVINCE: true } }
      },
      orderBy: { SUPPLIER_ID: 'desc' }
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return { success: false, error: 'Failed to fetch suppliers' };
  }
}

export async function saveSupplier(id, formData) {
  try {
    let locId = null;
    if (formData.LOCATION_CITY) {
      let existingLoc = await prisma.location.findFirst({
        where: { CITY: { equals: formData.LOCATION_CITY, mode: 'insensitive' } }
      });
      if (existingLoc) {
        locId = existingLoc.LOCATION_ID;
      } else {
        const newLoc = await prisma.location.create({
          data: { CITY: formData.LOCATION_CITY, PROVINCE: 'Custom' }
        });
        locId = newLoc.LOCATION_ID;
      }
    }

    const payload = {
      COMPANY_NAME: formData.COMPANY_NAME,
      PHONE_NUMBER: formData.PHONE_NUMBER,
      LOCATION_ID: locId
    };

    if (id) {
      await prisma.supplier.update({
        where: { SUPPLIER_ID: id },
        data: payload
      });
    } else {
      await prisma.supplier.create({
        data: payload
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving supplier:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(id) {
  try {
    await prisma.supplier.delete({
      where: { SUPPLIER_ID: id }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { success: false, error: error.message };
  }
}
