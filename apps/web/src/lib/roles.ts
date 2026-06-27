/** Staff roles that may reach the admin panel (the panel gates features by permission). */
export const STAFF_ROLES = ['ADMIN', 'MODERATOR', 'SUPPORT'];

export const isStaff = (role?: string) => STAFF_ROLES.includes(role ?? '');
