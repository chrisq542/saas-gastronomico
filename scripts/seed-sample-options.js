const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Verificando productos existentes ---');
  const products = await prisma.product.findMany({
    include: {
      restaurant: { select: { id: true, name: true, slug: true } },
      optionGroups: { include: { options: true } },
    },
  });

  console.log(`Encontrados ${products.length} productos en la base de datos:`);
  for (const prod of products) {
    console.log(`- [${prod.restaurant.slug}] ${prod.name} ($${prod.price}) - ${prod.optionGroups.length} grupos de opciones`);
  }

  // Buscar o configurar la hamburguesa de demo para sas-burger y burgueseria-afx
  const burgers = products.filter((p) =>
    p.name.toLowerCase().includes('burger') ||
    p.name.toLowerCase().includes('smash') ||
    p.name.toLowerCase().includes('hamburguesa') ||
    p.name.toLowerCase().includes('daddy') ||
    p.name.toLowerCase().includes('pearl')
  );

  for (const burger of burgers) {
    if (burger.optionGroups.length === 0) {
      console.log(`\nConfigurando opciones de agregados y remoción para: ${burger.name} (${burger.restaurant.name})`);

      // Grupo 1: Agregados & Extras
      await prisma.productOptionGroup.create({
        data: {
          productId: burger.id,
          name: 'Agregados & Extras',
          isRequired: false,
          minSelect: 0,
          maxSelect: 5,
          sortOrder: 1,
          options: {
            create: [
              { name: 'Doble Carne', price: 2500, sortOrder: 1 },
              { name: 'Queso Cheddar Extra', price: 1000, sortOrder: 2 },
              { name: 'Tocino Crocante', price: 1200, sortOrder: 3 },
              { name: 'Cebolla Crispy', price: 900, sortOrder: 4 },
            ],
          },
        },
      });

      // Grupo 2: Quitar Ingredientes
      await prisma.productOptionGroup.create({
        data: {
          productId: burger.id,
          name: 'Quitar Ingredientes',
          isRequired: false,
          minSelect: 0,
          maxSelect: 10,
          sortOrder: 2,
          options: {
            create: [
              { name: 'Sin Cebolla', price: 0, sortOrder: 1 },
              { name: 'Sin Tomate', price: 0, sortOrder: 2 },
              { name: 'Sin Pepinillos', price: 0, sortOrder: 3 },
              { name: 'Sin Salsa de la Casa', price: 0, sortOrder: 4 },
            ],
          },
        },
      });

      console.log(`✅ Opciones agregadas con éxito para ${burger.name}!`);
    }
  }

  console.log('\nFinalizado.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
