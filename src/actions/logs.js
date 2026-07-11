'use server';

import prisma from '@/lib/prisma';

export async function getLogs() {
  try {
    const data = await prisma.system_logs.findMany({
      include: {
        employee: {
          select: { FIRST_NAME: true, LAST_NAME: true }
        }
      },
      orderBy: { CREATED_AT: 'desc' },
      take: 100
    });
    return data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw new Error('Failed to fetch logs');
  }
}

export async function clearLogs(adminEmail, adminPassword) {
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
    await prisma.system_logs.deleteMany({});

    // 3. Log the clear action itself
    await prisma.system_logs.create({
      data: {
        USER_ID: adminUser ? adminUser.ID.toString() : 'admin',
        USER_EMAIL: adminEmail,
        ACTION: 'Cleared System Logs',
        DETAILS: 'Admin successfully verified password and cleared all system logs.',
        SEVERITY: 'warning'
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error clearing logs:', error);
    return { success: false, error: 'Failed to clear logs' };
  }
}
