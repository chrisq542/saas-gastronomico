const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      users: { select: { email: true, role: true } },
      _count: { select: { categories: true, products: true, orders: true } },
    },
  });
  console.log('Restaurantes en DB:', JSON.stringify(restaurants, null, 2));
}

main().finally(() => prisma.$disconnect());
