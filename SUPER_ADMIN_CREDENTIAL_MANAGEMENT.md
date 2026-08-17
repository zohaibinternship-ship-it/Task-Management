# Super Admin Credential Management System

## Overview

This feature allows **only the Super Admin** to manage credentials (password, email, and username) of themselves, Admins, and Employees. This provides centralized control over sensitive user information while maintaining security through audit logging.

## Permissions & Rules

### Super Admin Powers
- ✅ Change own password (with current password verification via `/api/auth/change-password`)
- ✅ Change password of any Admin or Employee (via credential management endpoints)
- ✅ Change email of any Admin or Employee
- ✅ Change username/name of any Admin or Employee

### Admin Powers
- ❌ Cannot change own password
- ❌ Cannot change other Admins' or Employees' credentials

### Employee Powers
- ❌ Cannot change own password
- ❌ Cannot change anyone else's credentials

## API Endpoints

### Update Admin Credentials (Super Admin Only)
```
PATCH /api/admins/:id/credentials
Authorization: Required (Super Admin)
Content-Type: application/json

Request Body:
{
  "password": "newPassword123",  // optional
  "email": "newemail@example.com", // optional
  "name": "New Admin Name"  // optional
}

Response: 200 OK
{
  "user": {
    "id": "admin123",
    "name": "New Admin Name",
    "email": "newemail@example.com",
    "role": {
      "id": 2,
      "name": "admin"
    },
    "isActive": true,
    "lastLoginAt": "2024-08-13T10:30:00Z",
    "createdAt": "2024-08-01T00:00:00Z",
    "updatedAt": "2024-08-13T11:30:00Z"
  }
}

Error Cases:
- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not Super Admin
- 404 Not Found: Admin with given ID doesn't exist
- 409 Conflict: Email already in use by another user
- 400 Bad Request: At least one field must be provided
```

### Update Employee Credentials (Super Admin Only)
```
PATCH /api/employees/:id/credentials
Authorization: Required (Super Admin)
Content-Type: application/json

Request Body:
{
  "password": "newPassword123",  // optional
  "email": "newemail@example.com", // optional
  "name": "New Employee Name"  // optional
}

Response: 200 OK
{
  "user": {
    "id": "emp123",
    "name": "New Employee Name",
    "email": "newemail@example.com",
    "role": {
      "id": 3,
      "name": "employee"
    },
    "isActive": true,
    "lastLoginAt": "2024-08-13T09:15:00Z",
    "createdAt": "2024-08-02T00:00:00Z",
    "updatedAt": "2024-08-13T11:35:00Z"
  }
}

Error Cases: (Same as Admin credentials endpoint)
```

### Change Own Password (Super Admin Only)
```
POST /api/auth/change-password
Authorization: Required (Super Admin)
Content-Type: application/json

Request Body:
{
  "currentPassword": "CurrentPassword123",
  "newPassword": "NewPassword456"
}

Response: 200 OK
{
  "message": "Password changed successfully"
}

Error Cases:
- 401 Unauthorized: Not authenticated or not Super Admin
- 403 Forbidden: User is not Super Admin
- 400 Bad Request: Current password is incorrect or validation failed
```

**Note:** This endpoint is **Super Admin only** and requires:
- Providing the current password for verification
- Different from the credential management endpoints which don't require current password verification

## Implementation Details

### New Validation Schemas

**`updateUserPasswordSchema`** (in `auth.validators.js`)
- Used by Super Admin to set a new password for any user
- Validates: `newPassword` (min 8 chars)

**`updateUserCredentialsSchema`** (in `user.validators.js`)
- Validates email format (when provided)
- Validates name length (when provided)
- Validates password strength (when provided)
- Enforces: at least one field must be provided

### New Service Functions

**`changePasswordForOtherUser()`** in `auth.service.js`
```typescript
changePasswordForOtherUser({
  userId: string,           // User whose password to change
  newPassword: string,      // New password (no validation of old password)
  actorId: string,          // Super Admin's ID
  actorRole: string         // Super Admin's role
})
```
- Used by Super Admin to set a new password for another user
- Revokes all active sessions for that user
- Logs action: `PASSWORD_CHANGED_BY_ADMIN`

**`updateUserCredentials()`** in `user.service.js`
```typescript
updateUserCredentials({
  userId: string,              // User to update
  roleName: 'admin'|'employee',// User's role
  updates: {                   // Fields to update (all optional)
    password?: string,
    email?: string,
    name?: string
  },
  actorId: string,             // Super Admin's ID
  actorRole: string            // Super Admin's role
})
```
- Updates email, name, and/or password for a user
- Checks for email uniqueness before updating
- Tracks old and new values in audit log
- Revokes all sessions if password was changed
- Logs action: `ADMIN_CREDENTIALS_UPDATED` or `EMPLOYEE_CREDENTIALS_UPDATED`

### New Session Repository Function

**`revokeAllForUser()`** in `session.repository.js`
- Revokes all active sessions for a user
- Used when Super Admin changes password to force re-authentication

### New Controllers

**`updateAdminCredentials()`** in `admin.controller.js`
- Handles credential updates for Admin accounts

**`updateEmployeeCredentials()`** in `employee.controller.js`
- Handles credential updates for Employee accounts

### Updated Routes

**`admins.routes.js`**
```javascript
PATCH /:id/credentials  → updateAdminCredentials
// Requires: authenticate + requireRole('super_admin')
```

**`employees.routes.js`**
```javascript
PATCH /:id/credentials  → updateEmployeeCredentials
// Requires: authenticate + requireRole('super_admin')
```

## Security Considerations

### Password Changes
- When Super Admin changes a user's password, ALL their active sessions are revoked
- User must log in again with the new password
- Password is bcrypt-hashed before storing in database
- Old password is never validated (Super Admin authority)

### Email Changes
- System checks email uniqueness before allowing update
- Email update is tracked in audit logs
- No email verification is required (Super Admin responsibility)

### Name Changes
- Name update is tracked in audit logs
- Minimal validation (2-120 characters)

### Audit Logging
All credential changes are logged with:
- Actor ID and role (Super Admin who made the change)
- Action type (`ADMIN_CREDENTIALS_UPDATED`, `EMPLOYEE_CREDENTIALS_UPDATED`, etc.)
- Old values (before change)
- New values (after change) — passwords logged as `***`
- Timestamp and entity type

### Authorization
- Route-level `requireRole('super_admin')` middleware ensures only Super Admin can access
- Separate endpoints for Admin vs Employee credentials (role-based filtering)

## Usage Examples

### Example 1: Super Admin Changes an Employee's Password
```bash
curl -X PATCH http://localhost:4000/api/employees/emp-123/credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=..." \
  -d '{
    "password": "NewSecurePassword123!"
  }'
```

### Example 2: Super Admin Updates Multiple Credential Fields
```bash
curl -X PATCH http://localhost:4000/api/admins/admin-456/credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=..." \
  -d '{
    "email": "newemail@company.com",
    "name": "Updated Admin Name",
    "password": "NewPassword456!"
  }'
```

### Example 3: Super Admin Changes Only Email
```bash
curl -X PATCH http://localhost:4000/api/employees/emp-789/credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=..." \
  -d '{
    "email": "employee.updated@company.com"
  }'
```

## Frontend Integration Notes

### Recommendations for Frontend Implementation

1. **Admin Management Page**
   - Add "Manage Credentials" button for each Admin (Super Admin only)
   - Modal form with fields for password, email, name
   - Confirmation dialog before submitting

2. **Employee Management Page**
   - Add "Manage Credentials" button for each Employee (Super Admin only)
   - Same form structure as Admin management

3. **API Service Updates**
   - Add `updateAdminCredentials(id, updates)` to `admins.service.js`
   - Add `updateEmployeeCredentials(id, updates)` to `employees.service.js`
   - Handle 409 Conflict errors (email already exists)
   - Show success toast after update

4. **Error Handling**
   ```javascript
   {
     "error": "A user with this email already exists",
     "status": 409
   }
   ```

5. **Session Management**
   - When credential update succeeds, inform the user their session may be affected
   - If password was changed, they may need to log in again on their device

## Files Modified

| File | Changes |
|------|---------|
| `server/src/validators/auth.validators.js` | Added `updateUserPasswordSchema` |
| `server/src/validators/user.validators.js` | Added `updateUserCredentialsSchema` |
| `server/src/services/auth.service.js` | Added `changePasswordForOtherUser()` |
| `server/src/services/user.service.js` | Added `updateUserCredentials()` |
| `server/src/repositories/session.repository.js` | Added `revokeAllForUser()` |
| `server/src/controllers/admin.controller.js` | Added `updateAdminCredentials()` |
| `server/src/controllers/employee.controller.js` | Added `updateEmployeeCredentials()` |
| `server/src/routes/admins.routes.js` | Added PATCH `/:id/credentials` route |
| `server/src/routes/employees.routes.js` | Added PATCH `/:id/credentials` route |

## Testing Checklist

- [ ] Super Admin can change their own password
- [ ] Super Admin can change an Admin's password
- [ ] Super Admin can change an Employee's password
- [ ] Super Admin can change an Admin's email
- [ ] Super Admin can change an Employee's email
- [ ] Super Admin can change an Admin's name
- [ ] Super Admin can change an Employee's name
- [ ] Super Admin can update multiple fields at once
- [ ] Email uniqueness validation works
- [ ] Audit logs capture credential changes
- [ ] User sessions are revoked when password changes
- [ ] Admin cannot change other Admin credentials
- [ ] Admin cannot change Employee credentials
- [ ] Employee cannot change anyone's credentials
- [ ] At least one field is required in update request
- [ ] Proper error messages for invalid data
