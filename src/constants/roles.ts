export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  STORE_ADMIN: 'STORE_ADMIN',
  KITCHEN: 'KITCHEN',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPERADMIN: 'Super Administrador',
  STORE_ADMIN: 'Administrador de Local',
  KITCHEN: 'Monitor de Cocina (KDS)',
};
