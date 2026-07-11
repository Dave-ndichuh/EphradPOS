import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'admin@ephrad.com' },
        password: { label: 'Password', type: 'password' },
        pin: { label: 'PIN', type: 'text' },
        isEmployee: { label: 'Employee', type: 'text' },
      },
      async authorize(credentials, req) {
        // Employee PIN Login
        if (credentials.isEmployee === 'true' && credentials.pin) {
          const employee = await prisma.employee.findFirst({
            where: { PIN: credentials.pin }
          });
          
          if (!employee) {
            throw new Error('Invalid PIN.');
          }
          
          return {
            id: employee.EMPLOYEE_ID.toString(),
            name: (employee.FIRST_NAME || '') + ' ' + (employee.LAST_NAME || ''),
            email: employee.EMAIL || `emp_${employee.EMPLOYEE_ID}@ephrad.com`,
            role: 'staff',
          };
        }

        // Admin Email/Password Login
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // 1. Check if the user exists in the employee table first
        const employee = await prisma.employee.findFirst({
          where: { EMAIL: credentials.email },
          include: { users: true },
        });

        if (employee) {
          // If it's an employee, verify their password if they have a linked user account
          const user = employee.users[0];
          
          if (!user) {
            // If they don't have a linked user account, they can't login via email/password right now
            throw new Error('No user account linked to this employee');
          }

          if (user.PASSWORD !== credentials.password) {
            throw new Error('Invalid password');
          }

          // Employees always get the "staff" role
          return {
            id: employee.EMPLOYEE_ID.toString(),
            name: (employee.FIRST_NAME || '') + ' ' + (employee.LAST_NAME || ''),
            email: employee.EMAIL,
            role: 'staff',
          };
        }

        // 2. If not an employee, check the users table directly (Admin fallback)
        const adminUser = await prisma.users.findFirst({
          where: { USERNAME: credentials.email }, // Using USERNAME field for admin logins
        });

        if (!adminUser || adminUser.PASSWORD !== credentials.password) {
          throw new Error('Invalid credentials');
        }

        // Distinct users not linked to the employee table get the "admin" role
        return {
          id: adminUser.ID.toString(),
          name: adminUser.USERNAME,
          email: adminUser.USERNAME, // Use username as email placeholder for admin
          role: 'admin',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
});

export { handler as GET, handler as POST };
