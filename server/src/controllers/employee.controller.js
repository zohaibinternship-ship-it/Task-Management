import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

const ROLE = 'employee';

export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await userService.createUser({
    name,
    email,
    password,
    roleName: ROLE,
    createdById: req.user.id,
    actorRole: req.user.role,
  });
  res.status(201).json({ user });
});

export const listEmployees = asyncHandler(async (req, res) => {
  const { search, status, page, pageSize } = req.query;
  const result = await userService.listUsers({ roleName: ROLE, search, status, page, pageSize });
  res.json(result);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const user = await userService.getUserByIdForRole(req.params.id, ROLE);
  res.json({ user });
});

export const setEmployeeStatus = asyncHandler(async (req, res) => {
  const user = await userService.setActiveStatus({
    id: req.params.id,
    roleName: ROLE,
    isActive: req.body.isActive,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.json({ user });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  await userService.deleteUser({
    id: req.params.id,
    roleName: ROLE,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.status(204).send();
});

export const updateEmployeeCredentials = asyncHandler(async (req, res) => {
  const user = await userService.updateUserCredentials({
    userId: req.params.id,
    roleName: ROLE,
    updates: req.body,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
  res.json({ user });
});
