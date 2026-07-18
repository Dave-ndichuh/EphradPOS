const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create a Branch
  const mainBranch = await prisma.branch.create({
    data: {
      NAME: 'Main Store',
    },
  });
  console.log(`Created branch: ${mainBranch.NAME} (ID: ${mainBranch.BRANCH_ID})`);

  // 2. Create a Category
  const category = await prisma.category.create({
    data: {
      CNAME: 'Electronics',
    },
  });
  console.log(`Created category: ${category.CNAME}`);

  // 3. Create a Location
  const location = await prisma.location.create({
    data: {
      PROVINCE: 'Nairobi',
      CITY: 'Nairobi',
    },
  });

  // 4. Create a Supplier
  const supplier = await prisma.supplier.create({
    data: {
      COMPANY_NAME: 'Tech Solutions Ltd',
      PHONE_NUMBER: '0700000000',
      LOCATION_ID: location.LOCATION_ID,
    },
  });

  // 5. Create an Employee (Admin)
  const employeeAdmin = await prisma.employee.create({
    data: {
      FIRST_NAME: 'Admin',
      LAST_NAME: 'User',
      EMAIL: 'admin@ephrad.com',
      PHONE_NUMBER: '0711111111',
      PIN: '1234',
      BRANCH_ID: mainBranch.BRANCH_ID,
      LOCATION_ID: location.LOCATION_ID,
    },
  });

  // 6. Create a User Type
  const typeAdmin = await prisma.type.create({
    data: {
      TYPE: 'Admin',
    },
  });

  // 7. Create a User Login
  await prisma.users.create({
    data: {
      USERNAME: 'admin',
      PASSWORD: 'password123',
      EMPLOYEE_ID: employeeAdmin.EMPLOYEE_ID,
      TYPE_ID: typeAdmin.TYPE_ID,
      BRANCH_ID: mainBranch.BRANCH_ID,
    },
  });
  console.log(`Created Admin User: admin / password123`);

  // 8. Create a Product
  await prisma.product.create({
    data: {
      PRODUCT_CODE: 'PRD-001',
      NAME: 'HP ProBook 15',
      DESCRIPTION: 'Laptop 8GB RAM 256GB SSD',
      QTY_STOCK: 50,
      ON_HAND: 50,
      PRICE: 45000,
      COST_PRICE: 35000,
      CATEGORY_ID: category.CATEGORY_ID,
      SUPPLIER_ID: supplier.SUPPLIER_ID,
      BRANCH_ID: mainBranch.BRANCH_ID,
      BRAND: 'HP',
      MODEL: 'ProBook 15',
    },
  });
  console.log(`Created Product: HP ProBook 15`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
