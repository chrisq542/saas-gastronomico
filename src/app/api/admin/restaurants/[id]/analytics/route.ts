import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getAuthorizedUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('auth_session');
  if (!sessionCookie || !sessionCookie.value) return null;

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthorizedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado.' },
        { status: 401 }
      );
    }

    const restaurantId = params.id;

    // Verificar permisos: Superadmin o Store Admin asignado a este tenant
    if (user.role !== 'SUPERADMIN' && user.restaurantId !== restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado para este restaurante.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all'; // '30d' | '90d' | '6m' | '1y' | 'all'

    let dateFilter: Date | undefined;
    const now = new Date();

    if (period === '30d') {
      dateFilter = new Date();
      dateFilter.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      dateFilter = new Date();
      dateFilter.setDate(now.getDate() - 90);
    } else if (period === '6m') {
      dateFilter = new Date();
      dateFilter.setMonth(now.getMonth() - 6);
    } else if (period === '1y') {
      dateFilter = new Date();
      dateFilter.setFullYear(now.getFullYear() - 1);
    }

    // 1. Obtener restaurante para validar existencia y nombre
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, slug: true, createdAt: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurante no encontrado.' },
        { status: 404 }
      );
    }

    // 2. Obtener todos los pedidos del tenant según el período
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Cálculos de KPIs Principales
    const totalOrders = orders.length;
    const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const pendingOrders = orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING'].includes(o.status)
    ).length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const averageTicket = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
    const deliverySuccessRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    // Clientes únicos
    const uniqueCustomerIds = new Set(orders.map((o) => o.customerId).filter(Boolean));
    const uniqueCustomers = uniqueCustomerIds.size;

    // 4. Pedidos Registrados por Mes (Agrupación Mensual)
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const monthlyMap = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        orderCount: number;
        revenue: number;
        deliveredCount: number;
      }
    >();

    // Inicializar últimos 6 meses si no hay datos o como rango base
    const monthsToInit = period === '30d' ? 2 : period === '90d' ? 3 : period === '6m' ? 6 : 6;
    for (let i = monthsToInit - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, {
        monthKey: key,
        monthLabel: label,
        orderCount: 0,
        revenue: 0,
        deliveredCount: 0,
      });
    }

    orders.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          monthKey: key,
          monthLabel: label,
          orderCount: 0,
          revenue: 0,
          deliveredCount: 0,
        });
      }

      const m = monthlyMap.get(key)!;
      m.orderCount += 1;
      if (order.status !== 'CANCELLED') {
        m.revenue += Number(order.total || 0);
      }
      if (order.status === 'DELIVERED') {
        m.deliveredCount += 1;
      }
    });

    const monthlyStats = Array.from(monthlyMap.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );

    // 5. Lo que más se vende (Top Selling Products)
    const productStatsMap = new Map<
      string,
      {
        id: string;
        name: string;
        imageUrl: string | null;
        categoryName: string;
        unitsSold: number;
        revenue: number;
      }
    >();

    validOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const prod = item.product;
        const prodId = item.productId || (prod ? prod.id : 'unknown');
        const prodName = prod?.name || 'Producto General';
        const categoryName = prod?.category?.name || 'Sin Categoría';
        const imageUrl = prod?.imageUrl || null;
        const itemRevenue = Number(item.unitPrice || 0) * item.quantity;

        if (!productStatsMap.has(prodId)) {
          productStatsMap.set(prodId, {
            id: prodId,
            name: prodName,
            imageUrl,
            categoryName,
            unitsSold: 0,
            revenue: 0,
          });
        }

        const stats = productStatsMap.get(prodId)!;
        stats.unitsSold += item.quantity;
        stats.revenue += itemRevenue;
      });
    });

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 8)
      .map((p) => ({
        ...p,
        percentageOfTotal:
          totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0,
      }));

    // 6. Desglose por Método de Pago
    const paymentMap = new Map<string, { count: number; total: number }>();
    validOrders.forEach((o) => {
      const method = o.paymentMethod || 'CASH';
      const current = paymentMap.get(method) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(o.total || 0);
      paymentMap.set(method, current);
    });

    const paymentMethods = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: validOrders.length > 0 ? Math.round((data.count / validOrders.length) * 100) : 0,
    }));

    // 7. Desglose por Tipo de Entrega
    const deliveryMap = new Map<string, { count: number; total: number }>();
    validOrders.forEach((o) => {
      const type = o.deliveryType || 'DELIVERY';
      const current = deliveryMap.get(type) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(o.total || 0);
      deliveryMap.set(type, current);
    });

    const deliveryTypes = Array.from(deliveryMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      total: data.total,
      percentage: validOrders.length > 0 ? Math.round((data.count / validOrders.length) * 100) : 0,
    }));

    // 8. Pedidos Recientes (Top 5)
    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer?.name || 'Cliente Particular',
      total: Number(o.total || 0),
      status: o.status,
      deliveryType: o.deliveryType,
      paymentMethod: o.paymentMethod,
      itemsCount: o.items.length,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        },
        period,
        kpis: {
          totalRevenue,
          totalOrders,
          deliveredOrders,
          pendingOrders,
          cancelledOrders,
          averageTicket,
          deliverySuccessRate,
          uniqueCustomers,
        },
        monthlyStats,
        topProducts,
        paymentMethods,
        deliveryTypes,
        recentOrders,
      },
    });
  } catch (error: any) {
    console.error('Error calculando analytics del restaurante:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al procesar métricas de ventas.' },
      { status: 500 }
    );
  }
}
