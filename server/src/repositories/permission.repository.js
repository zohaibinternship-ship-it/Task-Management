import { prisma } from '../config/prisma.js';

export async function roleNameHasPermission(roleName, key) {
  const match = await prisma.rolePermission.findFirst({
    where: { role: { name: roleName }, permission: { key } },
    select: { id: true },
  });
  return Boolean(match);
}

export function listAllPermissions() {
  return prisma.permission.findMany({ orderBy: { key: 'asc' } });
}

export function listPermissionsForRole(roleName) {
  return prisma.rolePermission.findMany({
    where: { role: { name: roleName } },
    include: { permission: true },
  });
}

export async function grantPermission(roleName, key) {
  const [role, permission] = await Promise.all([
    prisma.role.findUnique({ where: { name: roleName } }),
    prisma.permission.findUnique({ where: { key } }),
  ]);
  if (!role || !permission) return null;
  return prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    update: {},
    create: { roleId: role.id, permissionId: permission.id },
  });
}

export async function revokePermission(roleName, key) {
  const [role, permission] = await Promise.all([
    prisma.role.findUnique({ where: { name: roleName } }),
    prisma.permission.findUnique({ where: { key } }),
  ]);
  if (!role || !permission) return;
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: permission.id } });
}
