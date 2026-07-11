const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany();
  console.log(txs.map(t => ({ id: t.TRANS_ID, emp: t.EMPLOYEE_ID, status: t.status })));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
