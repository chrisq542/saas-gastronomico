const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🍔 Iniciando carga de datos semilla multi-tenant...');

  // 1. Crear o actualizar Restaurante Demo
  const demoRestaurant = await prisma.restaurant.upsert({
    where: { slug: 'sas-burger' },
    update: {
      name: 'SAS Burger Demo',
      phone: '56912345678',
      isActive: true,
    },
    create: {
      id: 'a1111111-1111-1111-1111-111111111111',
      slug: 'sas-burger',
      name: 'SAS Burger Demo',
      phone: '56912345678',
      isActive: true,
    },
  });
  console.log(`✅ Restaurante confirmado: ${demoRestaurant.name} (${demoRestaurant.slug})`);

  // 2. Usuarios Base
  await prisma.user.upsert({
    where: { email: 'admin@saasgastronomico.com' },
    update: { role: 'SUPERADMIN' },
    create: {
      email: 'admin@saasgastronomico.com',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      role: 'SUPERADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'gerente@sasburger.com' },
    update: { restaurantId: demoRestaurant.id, role: 'STORE_ADMIN' },
    create: {
      restaurantId: demoRestaurant.id,
      email: 'gerente@sasburger.com',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      role: 'STORE_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'cocina@sasburger.com' },
    update: { restaurantId: demoRestaurant.id, role: 'KITCHEN' },
    create: {
      restaurantId: demoRestaurant.id,
      email: 'cocina@sasburger.com',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      role: 'KITCHEN',
    },
  });
  console.log('✅ Usuarios del sistema configurados.');

  // 3. Categorías
  const catBurgers = await prisma.category.create({
    data: {
      restaurantId: demoRestaurant.id,
      name: 'Hamburguesas Smash',
      sortOrder: 1,
    },
  });

  const catSides = await prisma.category.create({
    data: {
      restaurantId: demoRestaurant.id,
      name: 'Papas & Acompañamientos',
      sortOrder: 2,
    },
  });

  const catDrinks = await prisma.category.create({
    data: {
      restaurantId: demoRestaurant.id,
      name: 'Bebidas & Refrescos',
      sortOrder: 3,
    },
  });
  console.log('✅ Categorías creadas.');

  // 4. Productos
  await prisma.product.createMany({
    data: [
      {
        restaurantId: demoRestaurant.id,
        categoryId: catBurgers.id,
        name: 'Doble Bacon Cheese Smash',
        description: 'Doble medallón 100g de carne angus smash, queso cheddar americano fundido, tocino ahumado crocante y salsa especial.',
        price: 8990,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        restaurantId: demoRestaurant.id,
        categoryId: catBurgers.id,
        name: 'Triple Oklahoma Onion Burger',
        description: 'Tres medallones smash con cebolla caramelizada incrustada en la plancha, triple cheddar y pepinillos dulces.',
        price: 10490,
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        restaurantId: demoRestaurant.id,
        categoryId: catSides.id,
        name: 'Papas Rústicas Cheddar & Bacon',
        description: 'Papas fritas corte rústico cubiertas con salsa de queso cheddar fundido y trozos de tocino crujiente.',
        price: 4990,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        restaurantId: demoRestaurant.id,
        categoryId: catDrinks.id,
        name: 'Bebida Lata 350ml (Coca-Cola / Zero / Sprite)',
        description: 'Lata bien helada a elección del cliente.',
        price: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ],
  });
  console.log('✅ Productos creados.');

  console.log('🎉 Seed multi-tenant completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
