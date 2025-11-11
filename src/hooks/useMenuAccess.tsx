// hooks/useMenuAccess.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useNavigate } from 'react-router-dom';
import { menuService, MenuGroup, MenuItem, UserPermissions, UserMenuResponse, RoleMenuAccessResponse } from '@/services/menuService';
import { healthCheck } from '@/services/apiService';

// Export cache clearing function for use in logout
export const clearMenuCache = () => {
  const CACHE_KEYS = {
    USER_MENU: 'cached_user_menu',
    PERMISSIONS: 'cached_permissions',
    ROLES: 'cached_roles',
    CACHE_TIMESTAMP: 'menu_cache_timestamp',
    CACHE_USER_ID: 'menu_cache_user_id'
  };
  Object.values(CACHE_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};

// Cache keys
const CACHE_KEYS = {
  USER_MENU: 'cached_user_menu',
  PERMISSIONS: 'cached_permissions',
  ROLES: 'cached_roles',
  CACHE_TIMESTAMP: 'menu_cache_timestamp',
  CACHE_USER_ID: 'menu_cache_user_id'
};

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

// Session storage for faster access (cleared on tab close)
const getSessionCache = (key: string) => {
  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setSessionCache = (key: string, data: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

const clearSessionCache = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};

export const useMenuAccess = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenu, setUserMenu] = useState<MenuGroup[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if initial load is complete
  const initialLoadCompleteRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserIdRef = useRef<number | null>(null);

  // Check if cache is valid
  const isCacheValid = useCallback((userId: number) => {
    const cachedUserId = getSessionCache(CACHE_KEYS.CACHE_USER_ID);
    const cacheTimestamp = getSessionCache(CACHE_KEYS.CACHE_TIMESTAMP);
    
    if (!cachedUserId || !cacheTimestamp || cachedUserId !== userId) {
      return false;
    }
    
    const now = Date.now();
    return (now - cacheTimestamp) < CACHE_DURATION;
  }, []);

  // Load from cache
  const loadFromCache = useCallback((userId: number) => {
    if (!isCacheValid(userId)) {
      return false;
    }

    const cachedMenu = getSessionCache(CACHE_KEYS.USER_MENU);
    const cachedPermissions = getSessionCache(CACHE_KEYS.PERMISSIONS);
    const cachedRoles = getSessionCache(CACHE_KEYS.ROLES);

    if (cachedMenu && cachedPermissions && cachedRoles) {
      setUserMenu(cachedMenu);
      setPermissions(cachedPermissions);
      setRoles(cachedRoles);
      setIsLoading(false);
      setError(null);
      initialLoadCompleteRef.current = true;
      return true;
    }

    return false;
  }, [isCacheValid]);

  // Save to cache
  const saveToCache = useCallback((userId: number, menu: MenuGroup[], perms: string[], userRoles: string[]) => {
    setSessionCache(CACHE_KEYS.USER_MENU, menu);
    setSessionCache(CACHE_KEYS.PERMISSIONS, perms);
    setSessionCache(CACHE_KEYS.ROLES, userRoles);
    setSessionCache(CACHE_KEYS.CACHE_TIMESTAMP, Date.now());
    setSessionCache(CACHE_KEYS.CACHE_USER_ID, userId);
  }, []);

const fetchUserAccess = useCallback(async (forceRefresh = false) => {
  // Prevent multiple simultaneous fetches
  if (fetchInProgressRef.current) {
    console.log('Fetch already in progress, skipping...');
    return;
  }

  // Cancel previous request if it exists
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  if (!user?.id) {
    setIsLoading(false);
    return;
  }

  // Check if user changed
  const userChanged = lastUserIdRef.current !== user.id;
  if (userChanged) {
    clearSessionCache();
    initialLoadCompleteRef.current = false;
  }
  lastUserIdRef.current = user.id;

  // Try loading from cache first (skip if force refresh)
  if (!forceRefresh && !userChanged && loadFromCache(user.id)) {
    console.log('Loaded menu data from cache');
    return;
  }

  // If already loaded and not forcing refresh, skip
  if (!forceRefresh && initialLoadCompleteRef.current && !userChanged) {
    console.log('Menu data already loaded, skipping fetch');
    return;
  }

  // Mark fetch as in progress
  fetchInProgressRef.current = true;
  abortControllerRef.current = new AbortController();

  setIsLoading(true);
  setError(null);

  try {
    // Check if user is admin (from platform schema) or member (from tenant schema)
    const isAdmin = user.roles?.includes('ADMIN') || user.roles?.includes('ADMINISTRATOR');

    let transformedMenuGroups: MenuGroup[] = [];
    let perms: string[] = [];
    let userRoles: string[] = user.roles || [];

    if (isAdmin) {
      // ADMIN: Use current menu access API (full access)
      console.log('User is admin - using full menu access');
      const permissionsResponse: UserPermissions = await menuService.getCurrentUserAccess();

      if (permissionsResponse) {
        perms = permissionsResponse.permissions || [];
        userRoles = permissionsResponse.roles || [];
      }

      // Get all menus for admin
      const menuResponse = await menuService.getUserAccessibleMenus(user.id.toString());
      if (menuResponse && menuResponse.length > 0) {
        transformedMenuGroups = (menuResponse || []).map((userMenu: UserMenuResponse) => {
          const menuGroup = userMenu.accessibleMenus?.[0] as any;
          return {
            menuCode: menuGroup?.menuCode || 'UNKNOWN',
            menuName: menuGroup?.menuName || 'Unknown Menu',
            description: '',
            icon: menuGroup?.icon || 'layout',
            sortOrder: menuGroup?.sortOrder || 0,
            accessibleMenus: menuGroup?.menuItems?.map((item: any) => ({
              id: item.id?.toString() || '',
              itemCode: item.itemCode || '',
              itemName: item.itemName || '',
              itemType: item.itemType || 'LINK',
              url: item.url || '',
              icon: item.icon || '',
              sortOrder: item.sortOrder || 0,
              requiresPermission: item.requiresPermission || '',
              menuCode: menuGroup?.menuCode || '',
              menuName: menuGroup?.menuName || '',
              parentId: item.parentItemId?.toString() || null,
              status: item.isActive ? 'ACTIVE' : 'INACTIVE',
              isActive: item.isActive || false,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            })) || []
          };
        });
      }
    } else {
      // MEMBER/DEVELOPER: Get role-based menu access using roleId from login response
      console.log('User is member - using role-based menu access with roleId');

      // Get user permissions and roles
      const permissionsResponse: UserPermissions = await menuService.getCurrentUserAccess();
      if (permissionsResponse) {
        perms = permissionsResponse.permissions || [];
        userRoles = permissionsResponse.roles || [];
      }

      // Use roleId from user login response to call the new API
      if (user.roleId) {
        console.log('Fetching menu access for roleId:', user.roleId);
        const roleMenuAccessResponse = await menuService.getRoleMenuAccessById(user.roleId);

        if (roleMenuAccessResponse && roleMenuAccessResponse.length > 0) {
          // Transform RoleMenuAccessResponse to MenuGroup format
          transformedMenuGroups = roleMenuAccessResponse.map((roleMenuAccess: any) => {
            const menuInfo = roleMenuAccess.accessibleMenus?.[0];
            const menuItems = menuInfo?.menuItems || [];

            return {
              menuCode: menuInfo?.menuCode || 'UNKNOWN',
              menuName: menuInfo?.menuName || 'Unknown Menu',
              description: menuInfo?.description || '',
              icon: menuInfo?.icon || 'layout',
              sortOrder: menuInfo?.sortOrder || 0,
              accessibleMenus: menuItems.map((item: any) => ({
                id: item.id?.toString() || '',
                itemCode: item.itemCode || '',
                itemName: item.itemName || '',
                itemType: item.itemType || 'LINK',
                url: item.url || '',
                icon: item.icon || '',
                sortOrder: item.sortOrder || 0,
                requiresPermission: item.requiresPermission || '',
                menuCode: menuInfo?.menuCode || '',
                menuName: menuInfo?.menuName || '',
                parentId: item.parentItemId?.toString() || null,
                status: item.isActive ? 'ACTIVE' : 'INACTIVE',
                isActive: item.isActive || false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }))
            };
          });
        } else {
          console.log('No menu access found for roleId:', user.roleId);
          transformedMenuGroups = [];
        }
      } else {
        console.warn('No roleId found in user object, falling back to old method');
        // Fallback to old method if roleId is not available
        const roleMenuAccess: { [menuName: string]: string[] } = await menuService.getMemberRoleMenuAccess(user.id);

        if (roleMenuAccess) {
          // roleMenuAccess is in format: { "BUSINESS_INTEL": ["ANALYTICS", "REPORTS"] }
          // Transform into MenuGroup format
          const allMenuItems: MenuItem[] = await menuService.getMenuItems().catch(() => []);

          transformedMenuGroups = Object.entries(roleMenuAccess).map(([menuName, menuItemCodes]) => {
            // Filter menu items that belong to this menu and are accessible
            const accessibleMenuItems = (allMenuItems || [])
              .filter((item: MenuItem) => item.menuName === menuName && (menuItemCodes as string[]).includes(item.itemCode))
              .map((item: MenuItem) => ({
                id: item.id?.toString() || '',
                itemCode: item.itemCode || '',
                itemName: item.itemName || '',
                itemType: item.itemType || 'LINK',
                url: item.url || '',
                icon: item.icon || '',
                sortOrder: item.sortOrder || 0,
                requiresPermission: item.requiresPermission || '',
                menuCode: item.menuCode || menuName,
                menuName: item.menuName || menuName,
                parentId: item.parentId || null,
                status: item.status || 'ACTIVE',
                isActive: item.isActive !== false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }));

            return {
              menuCode: menuName,
              menuName: menuName,
              description: '',
              icon: 'layout',
              sortOrder: 0,
              accessibleMenus: accessibleMenuItems
            };
          });
        } else {
          // No role-based menu access found, navigate to home
          console.log('No role-based menu access found for member, navigating to home');
          transformedMenuGroups = [];
        }
      }
    }

    // Update state
    setUserMenu(transformedMenuGroups);
    setPermissions(perms);
    setRoles(userRoles);

    // Save to cache
    saveToCache(user.id, transformedMenuGroups, perms, userRoles);

    initialLoadCompleteRef.current = true;
    setError(null);

  } catch (error: any) {
    console.error('Failed to fetch user access:', error);

    // Handle abort
    if (error.name === 'AbortError') {
      console.log('Request was cancelled');
      return;
    }

    // Check backend connectivity if API requests fail
    const checkBackendConnectivity = async () => {
      try {
        console.log('🔍 Checking backend connectivity...');
        const isHealthy = await healthCheck.isSystemHealthy();
        console.log('Backend health check result:', isHealthy);
        return isHealthy;
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        return false;
      }
    };

    // Handle 401 silently (token expired)
    if (error.status === 401) {
      console.warn('Authentication failed - token expired');
      setUserMenu([]);
      setPermissions([]);
      setRoles([]);
      setError(null);
    } else if (error.status === 403) {
      setError('ACCESS_DENIED');
      setUserMenu([]);
      setPermissions([]);
      setRoles([]);
    } else {
      // Check if backend is reachable
      const isBackendReachable = await checkBackendConnectivity();

      if (!isBackendReachable) {
        console.warn('🚨 Backend unreachable - initiating logout');
        // Backend is down/unreachable, logout user
        try {
          await logout();
          console.log('✅ User logged out due to backend unavailability');
          return; // Don't continue with fallback logic
        } catch (logoutError) {
          console.error('Failed to logout user:', logoutError);
          // Force navigation to login even if logout fails
          window.location.href = '/login';
          return;
        }
      }

      // Backend is reachable but menu access failed - provide basic access
      // For other errors (like subscription issues), provide basic menu access
      // This allows users to still access subscription management and basic features
      console.warn('Menu access failed, providing basic access:', error.message);

      // Provide basic menu items for users with subscription issues
      const basicMenuGroups: MenuGroup[] = [
        {
          menuCode: 'ACCOUNT',
          menuName: 'Account',
          description: 'Account management',
          icon: 'user',
          sortOrder: 1,
          accessibleMenus: [
            {
              id: 'profile',
              itemCode: 'PROFILE',
              itemName: 'Profile',
              itemType: 'LINK',
              url: '/profile',
              icon: 'user',
              sortOrder: 1,
              requiresPermission: 'READ',
              menuCode: 'ACCOUNT',
              menuName: 'Account',
              parentId: null,
              status: 'ACTIVE',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'change-password',
              itemCode: 'CHANGE_PASSWORD',
              itemName: 'Change Password',
              itemType: 'LINK',
              url: '/change-password',
              icon: 'lock',
              sortOrder: 2,
              requiresPermission: 'READ',
              menuCode: 'ACCOUNT',
              menuName: 'Account',
              parentId: null,
              status: 'ACTIVE',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ];

      // Check if user has billing issues and add subscription management
      if (user && (user as any).billingStatus === 'INACTIVE' || (user as any).billingStatus === 'OVERDUE') {
        basicMenuGroups.push({
          menuCode: 'SUBSCRIPTION',
          menuName: 'Subscription',
          description: 'Subscription management',
          icon: 'credit-card',
          sortOrder: 2,
          accessibleMenus: [
            {
              id: 'subscription',
              itemCode: 'SUBSCRIPTION_MANAGEMENT',
              itemName: 'Manage Subscription',
              itemType: 'LINK',
              url: '/subscription',
              icon: 'credit-card',
              sortOrder: 1,
              requiresPermission: 'READ',
              menuCode: 'SUBSCRIPTION',
              menuName: 'Subscription',
              parentId: null,
              status: 'ACTIVE',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        });
      }

      setUserMenu(basicMenuGroups);
      setPermissions(['READ']); // Basic read permissions
      setRoles(user?.roles || ['MEMBER']);
      setError('SUBSCRIPTION_ISSUE'); // Special error type for subscription issues
    }
  } finally {
    setIsLoading(false);
    fetchInProgressRef.current = false;
  }
}, [user?.id, user?.roles, user?.roleId, loadFromCache, saveToCache]);


  // Initial load - only once per user session
  useEffect(() => {
    if (user?.id && !initialLoadCompleteRef.current) {
      fetchUserAccess();
    } else if (!user?.id) {
      // Clear data on logout
      setUserMenu([]);
      setPermissions([]);
      setRoles([]);
      setError(null);
      setIsLoading(false);
      clearSessionCache();
      initialLoadCompleteRef.current = false;
      lastUserIdRef.current = null;
    }
  }, [user?.id]); // Only depend on user.id

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper methods (memoized)
  const hasMenuAccess = useCallback((menuItemCode: string) => {
    if (!userMenu || userMenu.length === 0) return false;
    return userMenu.some((group: MenuGroup) =>
      group.accessibleMenus?.some((item: MenuItem) => item.itemCode === menuItemCode)
    );
  }, [userMenu]);

  const hasPermission = useCallback((permissionCode: string) => {
    return permissions.includes(permissionCode);
  }, [permissions]);

  const hasRole = useCallback((roleCode: string) => {
    return roles.includes(roleCode);
  }, [roles]);

  const getMenuItemsByGroup = useCallback((menuCode: string) => {
    const group = userMenu.find((g: MenuGroup) => g.menuCode === menuCode);
    return group?.accessibleMenus || [];
  }, [userMenu]);

  const getAllAccessibleMenuItems = useCallback(() => {
    return userMenu.flatMap((group: MenuGroup) => group.accessibleMenus || []);
  }, [userMenu]);

  const isAdmin = useCallback(() => {
    return roles.includes('ADMIN') || roles.includes('ADMINISTRATOR');
  }, [roles]);

  const isManager = useCallback(() => {
    return roles.some((role: string) =>
      role.includes('MANAGER') ||
      role.includes('ADMIN') ||
      role === 'ADMINISTRATOR'
    );
  }, [roles]);

  const refreshAccess = useCallback(() => {
    fetchUserAccess(true); // Force refresh
  }, [fetchUserAccess]);

  return {
    // Data
    userMenu,
    permissions,
    roles,
    isLoading,
    error,

    // Menu access methods
    hasMenuAccess,
    hasPermission,
    hasRole,
    getMenuItemsByGroup,
    getAllAccessibleMenuItems,

    // Role-based helpers
    isAdmin,
    isManager,

    // Utility methods
    refreshAccess
  };
};
