import { asyncHandler } from '../utils/asyncHandler.js';
import * as permissionService from '../services/permission.service.js';

export const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionService.listAllPermissions();
  res.json({ permissions });
});

export const listRolePermissions = asyncHandler(async (req, res) => {
  const rolePermissions = await permissionService.listPermissionsForRole(req.params.roleName);
  res.json({ rolePermissions: rolePermissions.map((rp) => rp.permission) });
});

export const grantRolePermission = asyncHandler(async (req, res) => {
  await permissionService.grantPermission({
    roleName: req.params.roleName,
    key: req.body.key,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.status(204).send();
});

export const revokeRolePermission = asyncHandler(async (req, res) => {
  await permissionService.revokePermission({
    roleName: req.params.roleName,
    key: req.params.key,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.status(204).send();
});
