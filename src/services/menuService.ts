// services/menuService.ts
import apiService from './apiService';

export interface MenuItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: string;
  url: string;
  icon: string;
  sortOrder: number;
  requiresPermission: string;
  menuCode: string;
  menuName: string;
  parentId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuGroup {
  menuCode: string;
  menuName: string;
  description?: string;
  icon: string;
  sortOrder: number;
  accessibleMenus: MenuItem[];
}

export interface UserPermissions {
  permissions: string[];
  roles: string[];
  menuAccess: string[];
}

export interface UserMenuResponse {
  accessibleMenus: MenuGroup[];
  accessibleMenuItemCodes: string[];
  userRoleCodes: string[];
}

// Response from the menu tree endpoint
export interface MenuTreeResponse {
  id: string;
  menuCode: string;
  menuName: string;
  description?: string;
  icon: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  isSystemMenu: boolean;
  menuItems: MenuItem[];
}

// Request deduplication - store pending promises
const pendingRequests = new Map<string, Promise<any>>();

// Helper to deduplicate requests
const deduplicateRequest = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  // Check if request is already in progress
  if (pendingRequests.has(key)) {
    console.log(`Reusing pending request for: ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }

  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });

  // Store pending promise
  pendingRequests.set(key, promise);
  
  return promise;
};

export const menuService = {
  // Get all menu groups from platform schema
  async getMenuGroups() {
    return deduplicateRequest(
      'menu-groups',
      () => apiService.get<MenuGroup[]>('/api/v1/menus/groups')
    );
  },

  // Get all menu items from platform schema
  async getMenuItems() {
    return deduplicateRequest(
      'menu-items',
      () => apiService.get<MenuItem[]>('/api/v1/menus/items')
    );
  },

  // Get menu tree with menus and their items nested
  async getMenuTree() {
    return deduplicateRequest(
      'menu-tree',
      () => apiService.get<MenuTreeResponse[]>('/api/v1/menus/tree')
    );
  },

  // Get user's accessible menus (with deduplication)
  async getUserAccessibleMenus(userId: string) {
    return deduplicateRequest(
      `user-menus-${userId}`,
      () => apiService.get<UserMenuResponse[]>(`/api/v1/menus/user-access/${userId}`)
    );
  },

  // Get user permissions and roles (with deduplication)
  async getUserPermissions(userId: string) {
    return deduplicateRequest(
      `user-permissions-${userId}`,
      () => apiService.get<UserPermissions>(`/api/v1/user/permissions/${userId}`)
    );
  },

  // Get current user's menu and permissions (with deduplication and caching)
  async getCurrentUserAccess() {
    try {
      const user = JSON.parse(localStorage.getItem('tenant_user') || '{}');

      // For tenant admin, return admin permissions immediately
      if (user?.roles?.includes('ADMIN')) {
        return {
          permissions: ['ALL_ACCESS'],
          roles: ['ADMIN'],
          menuAccess: ['*']
        };
      }

      // For members, use member-specific menu access API (NOT the admin /user/current/access)
      return await deduplicateRequest(
        `member-menu-access-${user?.id}`,
        () => apiService.get<UserPermissions>(`/api/v1/member/auth/menu-access/${user?.id}`)
      );
    } catch (error) {
      console.warn('Failed to get current user access, using defaults:', error);
      return {
        permissions: ['READ'],
        roles: ['MEMBER'],
        menuAccess: []
      };
    }
  },

  // Get menu access for a specific role
  async getRoleMenuAccess(roleCode: string) {
    return deduplicateRequest(
      `role-menu-access-${roleCode}`,
      () => apiService.get<{ [menuName: string]: string[] }>(`/api/v1/roles/${roleCode}/menu-access`)
    );
  },

  // Get member role-based menu access (calls MemberAuthController)
  async getMemberRoleMenuAccess(userId: number) {
    return deduplicateRequest(
      `member-role-menu-access-${userId}`,
      () => apiService.get<{ [menuName: string]: string[] }>(`/api/v1/member/auth/menu-access/${userId}`)
    );
  },

  // CRUD operations for menu items (admin only)
  async createMenuItem(menuItem: Omit<MenuItem, 'id'>) {
    return await apiService.post<MenuItem>('/api/v1/menus/items', menuItem);
  },

  async updateMenuItem(id: string, menuItem: Partial<MenuItem>) {
    return await apiService.put<MenuItem>(`/api/v1/menus/items/${id}`, menuItem);
  },

  async deleteMenuItem(id: string) {
    return await apiService.delete(`/api/v1/menus/items/${id}`);
  },

  // Bulk operations
  async bulkUpdateMenuItems(items: MenuItem[]) {
    return await apiService.post<MenuItem[]>('/api/v1/menus/items/bulk', items);
  },

  // Initialize default menus for new tenant
  async initializeTenantMenus(tenantId: string) {
    return await apiService.post(`/api/v1/menus/initialize-tenant/${tenantId}`, {});
  },

  // Clear all pending requests (useful on logout)
  clearPendingRequests() {
    pendingRequests.clear();
  }
};
