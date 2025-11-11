import { z } from "zod";

// Role Form Validation Schema
export const roleFormSchema = z.object({
  name: z.string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(/^[A-Z_][A-Z0-9_]*$/, "Role name must start with uppercase letter and contain only uppercase letters, numbers, and underscores")
    .transform((val) => val.trim().toUpperCase()),

  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters")
    .transform((val) => val.trim()),

  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .transform((val) => val.trim()),


  sortOrder: z.number()
    .min(0, "Sort order must be 0 or greater")
    .max(9999, "Sort order must be less than 9999")
    .default(0),

  status: z.enum(["ACTIVE", "INACTIVE"]),

  permissionIds: z.array(z.number())
    .min(1, "Please select at least one permission")
    .default([]),
});

// Permission Form Validation Schema
export const permissionFormSchema = z.object({
  menuName: z.string()
    .min(2, "Menu name must be at least 2 characters")
    .max(100, "Menu name must be less than 100 characters")
    .transform((val) => val.trim()),

  route: z.string()
    .min(1, "Route is required")
    .max(255, "Route must be less than 255 characters")
    .regex(/^[a-zA-Z0-9_\-/:*]+$/, "Route can only contain letters, numbers, hyphens, underscores, forward slashes, and colons")
    .transform((val) => val.trim()),

  menuIcon: z.string()
    .max(50, "Icon must be less than 50 characters")
    .optional()
    .transform((val) => val?.trim() || ""),

  parentId: z.number().optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]),

  category: z.string()
    .max(100, "Category must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || ""),
});

// Role-Permission Assignment Schema
export const rolePermissionAssignmentSchema = z.object({
  roleId: z.number().min(1, "Role ID is required"),
  permissionIds: z.array(z.number()).min(1, "Please select at least one permission"),
});

// Bulk Role Operations Schema
export const bulkRoleOperationSchema = z.object({
  roleIds: z.array(z.number()).min(1, "Please select at least one role"),
  operation: z.enum(["ACTIVATE", "DEACTIVATE", "DELETE"]),
  confirmation: z.string()
    .min(1, "Please type the confirmation text")
    .refine((val) => val === "CONFIRM", "Please type 'CONFIRM' to proceed"),
});

// Type exports for use in components
export type RoleFormData = z.infer<typeof roleFormSchema>;
export type PermissionFormData = z.infer<typeof permissionFormSchema>;
export type RolePermissionAssignmentData = z.infer<typeof rolePermissionAssignmentSchema>;
export type BulkRoleOperationData = z.infer<typeof bulkRoleOperationSchema>;

// Validation helper functions
export const validateRoleName = (name: string): boolean => {
  return /^[A-Z_][A-Z0-9_]*$/.test(name);
};

export const validateRoute = (route: string): boolean => {
  return /^[a-zA-Z0-9_\-/:*]+$/.test(route);
};

export const generateRoleName = (displayName: string): string => {
  return displayName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
};

export const generateRoute = (menuName: string): string => {
  return menuName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
};
