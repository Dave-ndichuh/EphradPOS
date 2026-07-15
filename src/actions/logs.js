'use server';

import prisma from '@/lib/prisma';

export async function getLogs(branchId) {
  try {
    const data = await prisma.system_logs.findMany({
      where: branchId ? { BRANCH_ID: parseInt(branchId, 10) } : {},
      orderBy: { TIMESTAMP: 'desc' },
      take: 100
    });
    return data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw new Error('Failed to fetch logs');
  }
}

export async function clearLogs(adminEmail, adminPassword, branchId) {
  try {
    // 1. Verify Admin Password
    const adminUser = await prisma.users.findFirst({
      where: {
        employee: { EMAIL: adminEmail }
      },
      include: { employee: true }
    });

    if (!adminUser) {
      // Fallback to checking username
      const userByUsername = await prisma.users.findFirst({
        where: { USERNAME: adminEmail }
      });
      
      if (!userByUsername || userByUsername.PASSWORD !== adminPassword) {
        return { success: false, error: 'Incorrect password' };
      }
    } else if (adminUser.PASSWORD !== adminPassword) {
      return { success: false, error: 'Incorrect password' };
    }

    // 2. Clear Logs
    await prisma.system_logs.deleteMany({
      where: branchId ? { BRANCH_ID: parseInt(branchId, 10) } : {}
    });

    // 3. Log the clear action itself
    await prisma.system_logs.create({
      data: {
        USER_ID: adminUser ? parseInt(adminUser.ID, 10) : null,
        ACTION: 'Cleared System Logs - Admin successfully verified password and cleared all system logs.',
        BRANCH_ID: branchId ? parseInt(branchId, 10) : null
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error clearing logs:', error);
    return { success: false, error: 'Failed to clear logs' };
  }
}
