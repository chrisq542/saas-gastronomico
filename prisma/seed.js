const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🍔 Iniciando carga de datos iniciales (Seed FastFood)...');

  // Limpiar datos existentes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();

  // 1. Crear Categorías
  const catBurgers = await prisma.category.create({
    data: {
      name: 'Hamburguesas Smash',
      slug: 'hamburguesas-smash',
      sortOrder: 1,
      isActive: true,
    },
  });

  const catSides = await prisma.category.create({
    data: {
      name: 'Papas & Acompañamientos',
      slug: 'papas-acompanamientos',
      sortOrder: 2,
      isActive: true,
    },
  });

  const catDrinks = await prisma.category.create({
    data: {
      name: 'Bebidas & Refrescos',
      slug: 'bebidas-refrescos',
      sortOrder: 3,
      isActive: true,
    },
  });

  // 2. Crear Productos
  await prisma.product.createMany({
    data: [
      {
        categoryId: catBurgers.id,
        name: 'Doble Bacon Cheese Smash',
        description: 'Doble medallón 100g de carne angus smash, queso cheddar americano fundido, tocino ahumado crocante y salsa especial.',
        price: 8990,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 15,
      },
      {
        categoryId: catBurgers.id,
        name: 'Triple Oklahoma Onion Burger',
        description: 'Tres medallones smash con cebolla caramelizada incrustada en la plancha, triple cheddar y pepinillos dulces.',
        price: 10490,
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 20,
      },
      {
        categoryId: catSides.id,
        name: 'Papas Rústicas Cheddar & Bacon',
        description: 'Papas fritas corte rústico cubiertas con salsa de queso cheddar fundido y trozos de tocino crujiente.',
        price: 4990,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 10,
      },
      {
        categoryId: catDrinks.id,
        name: 'Bebida Lata 350ml (Coca-Cola / Zero / Sprite)',
        description: 'Lata bien helada a elección del cliente.',
        price: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 2,
      },
    ],
  });

  // 3. Crear Cliente de Prueba con 2 Direcciones (Respetando el límite de máx 3)
  const sampleCustomer = await prisma.customer.create({
    data: {
      name: 'Matías Silva',
      phone: '56987654321',
      email: 'matias@ejemplo.com',
      rut: '18.432.198-7',
      addresses: {
        create: [
          {
            street: 'Av. Providencia',
            number: '1234',
            apartment: 'Depto 402',
            city: 'Santiago',
            reference: 'Timbre 402, portón negro',
            isDefault: true,
          },
          {
            street: 'Los Leones',
            number: '550',
            apartment: 'Oficina 3',
            city: 'Santiago',
            reference: 'Edificio corporativo',
            isDefault: false,
          },
        ],
      },
    },
  });

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
