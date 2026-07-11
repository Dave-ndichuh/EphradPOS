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

        // Find employee by email
        const employee = await prisma.employee.findFirst({
          where: { EMAIL: credentials.email },
          include: { users: true },
        });

        if (!employee) {
          // Fallback to checking username if email isn't found
          const user = await prisma.users.findFirst({
            where: { USERNAME: credentials.email },
            include: { employee: true },
          });

          if (!user || user.PASSWORD !== credentials.password) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.ID.toString(),
            name: user.USERNAME,
            email: user.employee?.EMAIL || credentials.email,
            role: user.TYPE_ID === 1 ? 'admin' : 'staff', // Assuming 1 is admin
          };
        }

        // Assuming 1-to-1 relationship for employee -> users
        const user = employee.users[0];

        if (!user) {
          throw new Error('User account not found for this employee');
        }

        // Validate password (plain text for now based on reverse-engineered schema)
        const isValid = user.PASSWORD === credentials.password;

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.ID.toString(),
          name: employee.FIRST_NAME + ' ' + employee.LAST_NAME,
          email: employee.EMAIL,
          role: user.TYPE_ID === 1 ? 'admin' : 'staff',
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
