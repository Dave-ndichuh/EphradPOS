'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";

/**
 * Logs an action to the system_logs table
 * @param {Object} params
 * @param {string} params.action - The action being performed (e.g. "Logged In", "Deleted Product")
 * @param {string} params.details - Detailed context about the action
 * @param {string} params.severity - 'info', 'warning', or 'danger'
 * @param {number|null} params.employeeId - Employee ID if applicable
 * @param {string|null} params.userEmail - User email if applicable (for Admin)
 */
export async function logAction({ action, details, severity = 'info', employeeId = null, userEmail = null }) {
  try {
    // If neither employeeId nor userEmail is provided, try to fetch the current user session
    if (!employeeId && !userEmail) {
      try {
        const session = await getServerSession();
        if (session?.user?.email) {
          userEmail = session.user.email;
        }
      } catch (e) {
        // getServerSession might fail if called outside a Next.js request context
        console.warn('Could not retrieve session for logging', e);
      }
    }

    await prisma.system_logs.create({
      data: {
        ACTION: action,
        DETAILS: details,
        SEVERITY: severity,
        EMPLOYEE_ID: employeeId ? parseInt(employeeId) : null,
        USER_EMAIL: userEmail
      }
    });

  } catch (err) {
    console.error('Exception writing to system_logs:', err);
  }
}

