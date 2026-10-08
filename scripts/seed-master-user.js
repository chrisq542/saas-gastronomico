const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'chrisq542@gmail.com';
  const plainPassword = '8Y9nIW1pVlJL';
  const role = 'SUPERADMIN';

  console.log(`🔐 Generando hash seguro para ${email}...`);
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const masterUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      restaurantId: null,
    },
    create: {
      email,
      passwordHash,
      role,
      restaurantId: null,
    },
  });

  console.log(`✅ Usuario Master SUPERADMIN configurado con éxito:`);
  console.log(`   - ID: ${masterUser.id}`);
  console.log(`   - Email: ${masterUser.email}`);
  console.log(`   - Rol: ${masterUser.role}`);
  console.log(`   - Password configurada correctamente.`);
}

main()
  .catch((e) => {
    console.error('❌ Error configurando usuario master:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
