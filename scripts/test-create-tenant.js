const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const name = 'Pizzería Bella Napoli';
  const slug = 'bella-napoli';
  const customDomain = 'pedidos.bellanapoli.cl';
  const phone = '56987654321';
  const adminEmail = 'admin@bellanapoli.cl';
  const adminPassword = 'Password123!';

  console.log(`🚀 Probando aprovisionamiento de nuevo tenant: ${name} (${slug})...`);

  // Verificar si ya existe
  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) {
    console.log(`ℹ️ El restaurante ${slug} ya existía.`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const tenant = await prisma.$transaction(async (tx) => {
    const rest = await tx.restaurant.create({
      data: {
        name,
        slug,
        customDomain,
        phone,
        isActive: true,
      },
    });

    await tx.user.create({
      data: {
        restaurantId: rest.id,
        email: adminEmail,
        passwordHash,
        role: 'STORE_ADMIN',
      },
    });

    const cat1 = await tx.category.create({
      data: {
        restaurantId: rest.id,
        name: 'Pizzas Artesanales a la Piedra',
        sortOrder: 1,
      },
    });

    const cat2 = await tx.category.create({
      data: {
        restaurantId: rest.id,
        name: 'Bebidas y Vinos',
        sortOrder: 2,
      },
    });

    await tx.product.createMany({
      data: [
        {
          restaurantId: rest.id,
          categoryId: cat1.id,
          name: 'Pizza Margherita Di Bufala',
          description: 'Salsa de pomodoro italiano, mozzarella fior di latte, albahaca fresca y aceite de oliva extra virgen.',
          price: 11990,
          imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
          isActive: true,
        },
        {
          restaurantId: rest.id,
          categoryId: cat1.id,
          name: 'Pizza Quattro Formaggi',
          description: 'Mozzarella, gorgonzola dop, fontina y parmigiano reggiano con toque de miel.',
          price: 13490,
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
          isActive: true,
        },
        {
          restaurantId: rest.id,
          categoryId: cat2.id,
          name: 'Copa de Vino Carménère Reserva',
          description: 'Valle de Colchagua, copa 180ml.',
          price: 4500,
          imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
          isActive: true,
        },
      ],
    });

    return rest;
  });

  console.log(`✅ ¡Tenant aprovisionado exitosamente!`);
  console.log(`   - ID: ${tenant.id}`);
  console.log(`   - Nombre: ${tenant.name}`);
  console.log(`   - Subdominio: https://${tenant.slug}.localhost:3000`);
  console.log(`   - Dominio propio: https://${tenant.customDomain}`);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
