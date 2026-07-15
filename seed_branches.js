const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial branches...');
  
  const branches = [
    { NAME: 'Main Store' },
    { NAME: 'Warehouse' },
  ];

  for (const b of branches) {
    await prisma.branch.create({
      data: b,
    });
  }
  
  console.log('Branches seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
