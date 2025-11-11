
// src/services/roleService.ts
import { PaginationParams, PaginationResponse, RoleFilters } from '@/types/RoleTypes';
import { get, post, put, del } from './apiService';

export interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
  isActive: boolean;
  isSystemRole: boolean;
  permissions?: Permission[];
  menuItems?: MenuItem[];
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  description?: string;
  module?: string;
  isActive: boolean;
  isSystemPermission: boolean;
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
}

export interface CreateRoleRequest {
  roleCode: string;
  roleName: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  menuAccess: Record<string, string[]>;
}

export interface UpdateRoleRequest {
  roleCode: string;
  roleName: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  menuAccess: Record<string, string[]>;
}

export interface RoleResponse {
  data: Role[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

class RoleService {
  // Role CRUD operations
  async getRoles(params?: any): Promise<RoleResponse> {
    return get('/api/v1/roles', params);
  }

  async getRoleById(id: number): Promise<Role> {
    return get(`/api/v1/roles/${id}`);
  }

  async createRoleWithPermissions(roleData: CreateRoleRequest): Promise<Role> {
    return post('/api/v1/roles/with-permissions', roleData);
  }

  async updateRoleWithPermissions(id: number, roleData: UpdateRoleRequest): Promise<Role> {
    return put(`/api/v1/roles/${id}/with-permissions`, roleData);
  }

  async createRoleWithMenuAccess(roleData: CreateRoleRequest): Promise<Role> {
    return post('/api/v1/roles/with-menu-access', roleData);
  }

  async updateRoleWithMenuAccess(id: number, roleData: UpdateRoleRequest): Promise<Role> {
    return put(`/api/v1/roles/${id}/with-menu-access`, roleData);
  }

  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return post('/api/v1/roles', roleData);
  }

  async updateRole(id: number, roleData: UpdateRoleRequest): Promise<Role> {
    return put(`/api/v1/roles/${id}`, roleData);
  }

  async deleteRole(id: number): Promise<void> {
    return del(`/api/v1/roles/${id}`);
  }

  // Permission operations
  async getPermissions(params?: any): Promise<Permission[]> {
    return get('/api/v1/permissions', params);
  }

  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    return get('/api/v1/permissions/modules');
  }

  // Menu access operations
  async getMenuItems(params?: any): Promise<MenuItem[]> {
    return get('/api/v1/menus/items', params);
  }

  async getMenuHierarchy(): Promise<any> {
    return get('/api/v1/menus/hierarchy');
  }

  // Role assignment operations
  async assignRolesToUser(userId: string, roleIds: number[]): Promise<any> {
    return post('/api/v1/roles/user/assign', {
      userId,
      roleIds
    });
  }

  // Bulk operations
  async bulkUpdateRoleStatus(roleIds: number[], status: string): Promise<number> {
    return post('/api/v1/roles/bulk-status', {
      roleIds,
      status,
      updatedBy: 'system'
    });
  }

  // Validation
  async checkRoleCodeExists(roleCode: string): Promise<boolean> {
    return get(`/api/v1/roles/exists/${roleCode}`);
  }

  /**
   * Get roles with pagination
   */
  async getRolesPaginated(params: PaginationParams & { filters?: RoleFilters }): Promise<PaginationResponse<Role>> {
    const response = await post('/api/v1/roles/search', {
      page: params.page,
      size: params.size,
      sortBy: params.sortBy || 'id',
      sortDirection: params.sortDirection || 'asc',
      filters: params.filters,
      logicExpression: params.logicExpression
    }) as PaginationResponse<Role>;
    return response;
  }
}

export const roleService = new RoleService();
export default roleService;
