'use server';

import prisma from '@/lib/prisma';

export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        job: { select: { JOB_TITLE: true } },
        location: { select: { CITY: true, PROVINCE: true } }
      },
      orderBy: { EMPLOYEE_ID: 'desc' }
    });

    const jobs = await prisma.job.findMany({ orderBy: { JOB_TITLE: 'asc' } });
    const locations = await prisma.location.findMany({ orderBy: { CITY: 'asc' } });

    return { employees, jobs, locations };
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees');
  }
}

export async function resolveJobId(jobTitle) {
  if (!jobTitle) return null;
  
  let job = await prisma.job.findFirst({
    where: { JOB_TITLE: { equals: jobTitle, mode: 'insensitive' } }
  });

  if (!job) {
    job = await prisma.job.create({
      data: { JOB_TITLE: jobTitle }
    });
  }
  return job.JOB_ID;
}

export async function resolveLocationId(city) {
  if (!city) return null;

  let location = await prisma.location.findFirst({
    where: { CITY: { equals: city, mode: 'insensitive' } }
  });

  if (!location) {
    location = await prisma.location.create({
      data: { CITY: city, PROVINCE: 'Custom' }
    });
  }
  return location.LOCATION_ID;
}

export async function saveEmployee(id, formData) {
  try {
    const jobId = await resolveJobId(formData.JOB_TITLE);
    const locId = await resolveLocationId(formData.LOCATION_CITY);

    const payload = {
      FIRST_NAME: formData.FIRST_NAME,
      LAST_NAME: formData.LAST_NAME,
      GENDER: formData.GENDER,
      EMAIL: formData.EMAIL,
      PHONE_NUMBER: formData.PHONE_NUMBER,
      JOB_ID: jobId,
      LOCATION_ID: locId,
      PIN: formData.PIN
    };

    if (id) {
      // Update
      const employee = await prisma.employee.update({
        where: { EMPLOYEE_ID: id },
        data: payload
      });
      return { success: true, employee };
    } else {
      // Create
      // Generate Username for the associated users table
      const rawUsername = `${formData.FIRST_NAME.charAt(0)}${formData.LAST_NAME}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = rawUsername;
      
      const existingUser = await prisma.users.findFirst({
        where: { USERNAME: username }
      });
      
      if (existingUser) {
        username = `${rawUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // 1. Create the employee record (without the USERNAME property)
      const employee = await prisma.employee.create({
        data: payload
      });

      // 2. Resolve the user TYPE_ID (Staff by default)
      let userType = await prisma.type.findFirst({
        where: { TYPE: { equals: 'Staff', mode: 'insensitive' } }
      });
      if (!userType) {
        userType = await prisma.type.create({
          data: { TYPE: 'Staff' }
        });
      }

      // 3. Create the associated users record
      await prisma.users.create({
        data: {
          EMPLOYEE_ID: employee.EMPLOYEE_ID,
          USERNAME: username,
          PASSWORD: 'password123', // Default temporary password
          TYPE_ID: userType.TYPE_ID // Use the dynamically resolved ID
        }
      });
      return { success: true, employee };
    }
  } catch (error) {
    console.error('Error saving employee:', error);
    let errorMsg = 'Failed to save employee';
    if (error.code === 'P2002') {
      errorMsg = 'An employee with this Phone Number already exists.';
    } else if (error.message) {
      errorMsg = error.message;
    }
    return { success: false, error: errorMsg };
  }
}

export async function deleteEmployee(id) {
  try {
    // Note: This relies on cascading deletes or nullable relationships in Prisma schema.
    // Ensure related records don't block deletion (e.g., users table)
    
    // Attempt to delete related users table record first if it exists
    await prisma.users.deleteMany({
      where: { EMPLOYEE_ID: id }
    });
    
    await prisma.employee.delete({
      where: { EMPLOYEE_ID: id }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { success: false, error: 'Failed to delete employee' };
  }
}
