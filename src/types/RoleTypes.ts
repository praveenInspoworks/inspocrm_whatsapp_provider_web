// src/types/RoleTypes.ts
export interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
  isSystemRole: boolean;
  permissions?: Permission[];
  menuItems?: MenuItem[];
  menuAccess?: Record<string, string[]>;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  description?: string;
  module?: string;
  isSystemPermission: boolean;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  itemCode: string;
  itemName: string;
  itemType: string;
  url: string;
  icon?: string;
  menuCode?: string;
  menuName?: string;
  sortOrder: number;
  isActive: boolean;
  requiresPermission?: string;
  parentId?: number;
  children?: MenuItem[];
}

export interface CreateRoleRequest {
  roleCode: string;
  roleName: string;
  description?: string;
 // isSystemRole: boolean;
}

export interface UpdateRoleRequest {
  roleCode: string;
  roleName: string;
  description?: string;
}

export interface RolePermissionAssignment {
  roleId: number;
  permissionIds: number[];
}

export interface RoleMenuAssignment {
  roleId: number;
  menuItemIds: number[];
}

export interface RoleFilters {
  search?: string;
  isSystemRole?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}



export interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: any[];
  logicExpression?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Filter and Search Types
export interface RoleFilters {
  status?: 'ACTIVE' | 'INACTIVE';
  isSystemRole?: boolean;
  searchTerm?: string;
}

export interface PermissionFilters {
  status?: 'ACTIVE' | 'INACTIVE';
  category?: string;
  searchTerm?: string;
}
