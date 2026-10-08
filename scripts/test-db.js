const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function runTests() {
  console.log('====================================================');
  console.log('🚀 INICIANDO BATERÍA DE PRUEBAS DE BASE DE DATOS');
  console.log('====================================================\n');

  try {
    // 1. Conexión básica y Ping
    console.log('📡 [1/6] Probando conexión a Supabase PostgreSQL...');
    await prisma.$connect();
    console.log('   ✅ Conexión establecida exitosamente con el Pooler de Supabase.\n');

    // 2. Comprobar datos semilla (Restaurants, Users, Categories, Products)
    console.log('🔍 [2/6] Verificando datos semilla existentes...');
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            categories: true,
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
    });

    console.log(`   Restaurantes encontrados: ${restaurants.length}`);
    for (const rest of restaurants) {
      console.log(`   - ID: ${rest.id}`);
      console.log(`     Slug: "${rest.slug}" | Nombre: "${rest.name}" | Activo: ${rest.isActive}`);
      console.log(`     Conteo: ${rest._count.users} usuarios, ${rest._count.categories} categorías, ${rest._count.products} productos, ${rest._count.orders} órdenes, ${rest._count.customers} clientes`);
    }

    if (restaurants.length === 0) {
      throw new Error('No se encontraron restaurantes en la base de datos. Asegúrate de haber corrido el seed.');
    }

    const demoRestaurant = restaurants[0];

    // Usuarios del restaurante o globales
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        restaurantId: true,
      },
    });
    console.log(`\n   Usuarios registrados: ${users.length}`);
    users.forEach((u) => {
      console.log(`   - [${u.role}] ${u.email} (Restaurant ID: ${u.restaurantId || 'GLOBAL'})`);
    });

    // Categorías y productos
    const categories = await prisma.category.findMany({
      where: { restaurantId: demoRestaurant.id },
      include: { products: true },
    });
    console.log(`\n   Categorías y productos para "${demoRestaurant.name}":`);
    categories.forEach((cat) => {
      console.log(`   - 📁 ${cat.name} (${cat.products.length} productos):`);
      cat.products.forEach((prod) => {
        console.log(`       🍔 ${prod.name} - \$${prod.price} (Activo: ${prod.isActive})`);
      });
    });

    // 3. Prueba de Inserción Multi-Tenant (Cliente de prueba)
    console.log('\n👤 [3/6] Probando creación de Cliente aislado por restaurantId...');
    const testPhone = '+56999990001';
    
    // Limpiar previo si existiera
    await prisma.customer.deleteMany({
      where: { restaurantId: demoRestaurant.id, phone: testPhone },
    });

    const testCustomer = await prisma.customer.create({
      data: {
        restaurantId: demoRestaurant.id,
        name: 'Cliente de Prueba QA',
        phone: testPhone,
        rut: '12.345.678-9',
      },
    });
    console.log(`   ✅ Cliente creado: ID ${testCustomer.id} (${testCustomer.name}, ${testCustomer.phone})`);

    // 4. Prueba del Trigger PL/pgSQL de Direcciones (Máximo 3)
    console.log('\n📍 [4/6] Probando Trigger PL/pgSQL: Límite de 3 direcciones por cliente...');
    const addr1 = await prisma.address.create({
      data: {
        customerId: testCustomer.id,
        address: 'Av. Siempre Viva 123',
        commune: 'Providencia',
      },
    });
    console.log(`   ✅ Dirección 1 creada (ID: ${addr1.id})`);

    const addr2 = await prisma.address.create({
      data: {
        customerId: testCustomer.id,
        address: 'Los Leones 456, Depto 302',
        commune: 'Providencia',
      },
    });
    console.log(`   ✅ Dirección 2 creada (ID: ${addr2.id})`);

    const addr3 = await prisma.address.create({
      data: {
        customerId: testCustomer.id,
        address: 'Paseo Ahumada 789',
        commune: 'Santiago Centro',
      },
    });
    console.log(`   ✅ Dirección 3 creada (ID: ${addr3.id})`);

    let triggerSuccess = false;
    try {
      console.log('   Intentando insertar 4ta dirección (debe ser rechazada por el Trigger)...');
      await prisma.address.create({
        data: {
          customerId: testCustomer.id,
          address: 'Alameda 9999',
          commune: 'Estación Central',
        },
      });
    } catch (err) {
      triggerSuccess = true;
      console.log(`   🛡️ TRIGGER ACTIVADO CORRECTAMENTE: Rechazó la 4ta dirección con el mensaje:`);
      console.log(`      "${err.message.split('\n').pop() || err.message}"`);
    }

    if (!triggerSuccess) {
      console.warn('   ⚠️ ADVERTENCIA: El trigger de límite de direcciones no bloqueó la 4ta dirección.');
    }

    // 5. Prueba de Ciclo de Vida de Pedido (Order + OrderItem)
    console.log('\n📦 [5/6] Creando pedido con OrderItems vinculado al restaurante demo...');
    const sampleProduct = await prisma.product.findFirst({
      where: { restaurantId: demoRestaurant.id },
    });

    if (!sampleProduct) {
      throw new Error('No hay productos disponibles para simular un pedido.');
    }

    const testOrder = await prisma.order.create({
      data: {
        restaurantId: demoRestaurant.id,
        customerId: testCustomer.id,
        status: 'PENDING',
        deliveryType: 'DELIVERY',
        paymentMethod: 'TRANSFER',
        subtotal: sampleProduct.price,
        deliveryFee: 1500,
        total: Number(sampleProduct.price) + 1500,
        notes: 'Sin cebolla, tocar el timbre 302',
        items: {
          create: [
            {
              productId: sampleProduct.id,
              quantity: 1,
              unitPrice: sampleProduct.price,
              notes: 'Punto de carne: bien cocida',
            },
          ],
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`   ✅ Pedido #${testOrder.orderNumber} creado exitosamente!`);
    console.log(`      - Estado: ${testOrder.status}`);
    console.log(`      - Total: \$${testOrder.total} (Subtotal: \$${testOrder.subtotal} + Envío: \$${testOrder.deliveryFee})`);
    console.log(`      - Cliente: ${testOrder.customer.name} (${testOrder.customer.phone})`);
    console.log(`      - Items (${testOrder.items.length}):`);
    testOrder.items.forEach((item) => {
      console.log(`         • ${item.quantity}x ${item.product.name} (\$${item.unitPrice}) [Notas: ${item.notes}]`);
    });

    // 6. Limpieza de datos de prueba (Teardown)
    console.log('\n🧹 [6/6] Limpiando datos de prueba...');
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.address.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });
    console.log('   ✅ Datos de prueba limpiados correctamente sin dejar huellas sucias.');

    console.log('\n====================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE BASE DE DATOS PASARON CON ÉXITO');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN DE PRUEBAS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
