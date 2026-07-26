'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getUnsettledCredits() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: true, data: [] }; // Don't crash, just return empty

    const unsettledCredits = await prisma.transaction.findMany({
      where: {
        IS_CREDIT: true,
        IS_SETTLED: false,
        CREDIT_DUE_DATE: { not: null }
      },
      select: {
        TRANS_ID: true,
        CREDIT_DUE_DATE: true,
        ADJUSTED_TOTAL: true,
        GRAND_TOTAL: true,
        credit_customer: {
          select: {
            FIRST_NAME: true,
            LAST_NAME: true
          }
        }
      }
    });

    return { success: true, data: unsettledCredits };
  } catch (error) {
    console.error('Error fetching unsettled credits:', error);
    return { success: false, error: 'Failed to fetch unsettled credits' };
  }
}
