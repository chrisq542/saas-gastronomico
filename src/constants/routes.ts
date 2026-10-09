export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SUPERADMIN: {
    ROOT: '/tenants',
    TENANTS: '/tenants',
    TENANT_DETAIL: (id: string) => `/tenants/${id}`,
    TENANT_KDS: (id: string) => `/kds?restaurantId=${id}`,
    TENANT_ORDERS: (id: string) => `/orders?restaurantId=${id}`,
  },
  STORE: {
    ORDERS: '/orders',
    KDS: '/kds',
    PRODUCTS: '/products',
  },
  TENANT: {
    PUBLIC_MENU: (slug: string) => `/${slug}`,
    CHECKOUT: (slug: string) => `/${slug}/checkout`,
    ADMIN: (slug: string) => `/${slug}/admin`,
    KDS: (slug: string) => `/${slug}/kds`,
    ORDERS: (slug: string) => `/${slug}/orders`,
    PRODUCTS: (slug: string) => `/${slug}/products`,
  },
} as const;
