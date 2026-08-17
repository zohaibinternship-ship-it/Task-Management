import { prisma } from '../config/prisma.js';

const withRole = { role: true };

export function findByEmail(email) {
  return prisma.user.findUnique({ where: { email }, include: withRole });
}

export function findById(id) {
  return prisma.user.findUnique({ where: { id }, include: withRole });
}

export function updatePasswordHash(id, passwordHash) {
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}

export function touchLastLogin(id) {
  return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

export function create(data) {
  return prisma.user.create({ data, include: withRole });
}

export function update(id, data) {
  return prisma.user.update({ where: { id }, data, include: withRole });
}

export function findMany({ where, skip, take, orderBy } = {}) {
  return prisma.user.findMany({ where, skip, take, orderBy, include: withRole });
}

export function count(where) {
  return prisma.user.count({ where });
}

export function remove(id) {
  return prisma.user.delete({ where: { id } });
}
