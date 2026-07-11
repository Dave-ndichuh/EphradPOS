'use server';

import prisma from '@/lib/prisma';

export async function getCustomers() {
  try {
    const data = await prisma.customer.findMany({
      orderBy: { CUST_ID: 'desc' }
    });
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
}

export async function createCustomer(data) {
  try {
    const customer = await prisma.customer.create({
      data: {
        FIRST_NAME: data.FIRST_NAME,
        LAST_NAME: data.LAST_NAME,
        PHONE_NUMBER: data.PHONE_NUMBER
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

export async function updateCustomer(id, data) {
  try {
    const customer = await prisma.customer.update({
      where: { CUST_ID: id },
      data: {
        FIRST_NAME: data.FIRST_NAME,
        LAST_NAME: data.LAST_NAME,
        PHONE_NUMBER: data.PHONE_NUMBER
      }
    });
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
}

export async function deleteCustomer(id) {
  try {
    await prisma.customer.delete({
      where: { CUST_ID: id }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
}
