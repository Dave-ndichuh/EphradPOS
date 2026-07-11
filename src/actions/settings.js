'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";

export async function updateAdminEmail(newEmail) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'admin') {
      return { success: false, error: 'Only admins can change email' };
    }

    // Depending on the structure, admin might be in users + employee
    const userId = parseInt(session.user.id);
    
    // We update the associated employee record
    const userRecord = await prisma.users.findUnique({
      where: { ID: userId }
    });

    if (userRecord && userRecord.EMPLOYEE_ID) {
      await prisma.employee.update({
        where: { EMPLOYEE_ID: userRecord.EMPLOYEE_ID },
        data: { EMAIL: newEmail }
      });
      return { success: true };
    } else {
      return { success: false, error: 'User record not found or no employee associated' };
    }

  } catch (error) {
    console.error('Error updating email:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAdminPassword(newPassword) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'admin') {
      return { success: false, error: 'Only admins can change password' };
    }

    const userId = parseInt(session.user.id);

    await prisma.users.update({
      where: { ID: userId },
      data: { PASSWORD: newPassword }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: error.message };
  }
}
