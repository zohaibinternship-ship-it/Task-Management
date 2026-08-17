import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLE_NAMES = ['super_admin', 'admin', 'employee'];

async function seedRoles() {
  const roles = {};
  for (const name of ROLE_NAMES) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  return roles;
}

// Permission is a real table (not just hardcoded role checks) so Super Admin can grant an
// Admin visibility into Super-Admin-on-Admin audit entries without a code change. Not granted
// to anyone by default — Admins only see it once a Super Admin explicitly assigns it.
async function seedPermissions() {
  await prisma.permission.upsert({
    where: { key: 'audit_logs:view_admin_actions' },
    update: {},
    create: {
      key: 'audit_logs:view_admin_actions',
      description: 'View audit log entries about admin accounts being created/activated/deactivated',
    },
  });
}

async function seedSuperAdmin(superAdminRoleId) {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

  if (!email || !password) {
    console.warn('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping Super Admin creation.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super Admin already exists (${email}) — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);
  await prisma.user.create({
    data: { name, email, passwordHash, roleId: superAdminRoleId, isActive: true },
  });
  console.log(`Created Super Admin: ${email}`);
}

async function main() {
  const roles = await seedRoles();
  await seedPermissions();
  await seedSuperAdmin(roles.super_admin.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
