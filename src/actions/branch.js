'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getBranches() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return [];
    
    const user = session.user;

    // If admin, they can see all branches to pick from
    if (user.role === 'admin') {
      return await prisma.branch.findMany({
        orderBy: { NAME: 'asc' }
      });
    }

    // If staff, we must ONLY fetch their assigned branch
    if (user.role === 'staff' && user.branchId) {
      return await prisma.branch.findMany({
        where: { BRANCH_ID: user.branchId }
      });
    }

    // If staff has no branch assigned, they can't log in practically, return none
    return [];

  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}
