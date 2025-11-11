// src/components/role-management/RoleCreateForm.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { roleService } from '@/services/roleService';
import { menuService, type MenuTreeResponse, type MenuItem } from '@/services/menuService';
import { Role } from '@/types/RoleTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Save,
  Shield,
  Menu,
  CheckSquare,
  Square,
  Users,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Layers,
  X
} from 'lucide-react';

// Validation schema
const roleCreateSchema = z.object({
  roleCode: z.string()
    .min(2, 'Role code must be at least 2 characters')
    .max(50, 'Role code must be less than 50 characters')
    .regex(/^[A-Z_]+$/, 'Role code must contain only uppercase letters and underscores (e.g., MANAGER_ROLE)'),
  roleName: z.string()
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name must be less than 100 characters'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  menuAccess: z.any(), // { menuCode: [itemCode1, itemCode2] }
});

type RoleCreateFormData = z.infer<typeof roleCreateSchema>;

interface RoleCreateFormProps {
  mode?: 'create' | 'edit';
  existingRole?: Role;
  onComplete?: (role: Role) => void;
  onCancel?: () => void;
}

export const RoleCreateForm: React.FC<RoleCreateFormProps> = ({
  mode = 'create',
  existingRole,
  onComplete,
  onCancel
}) => {
  console.log('🔍 [RoleCreateForm] Component rendered, mode:', mode, 'existingRole:', existingRole);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [menuTree, setMenuTree] = useState<MenuTreeResponse[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Form setup
  const form = useForm<RoleCreateFormData>({
    resolver: zodResolver(roleCreateSchema),
    defaultValues: existingRole ? {
      roleCode: existingRole.roleCode,
      roleName: existingRole.roleName,
      description: existingRole.description || '',
      status: existingRole.status || 'ACTIVE',
      menuAccess: existingRole.menuAccess || {},
    } : {
      roleCode: '',
      roleName: '',
      description: '',
      status: 'ACTIVE',
      menuAccess: {},
    }
  });

  // Watch menu access to sync with selected menus
  const menuAccess = (form.watch('menuAccess') || {}) as Record<string, string[]>;

  // Load data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load menu tree (menus with nested menu items)
        const menuTreeResponse = await menuService.getMenuTree();

        setMenuTree(Array.isArray(menuTreeResponse) ? menuTreeResponse : []);

      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error(error.message || 'Failed to load menu data');
        setMenuTree([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize form values when existingRole changes
  React.useEffect(() => {
    if (existingRole) {
      console.log('🔍 [Edit Form] Initializing with existingRole:', existingRole);

      // Reset the entire form with existing data
      const formData = {
        roleCode: existingRole.roleCode,
        roleName: existingRole.roleName,
        description: existingRole.description || '',
        status: existingRole.status,
        menuAccess: existingRole.menuAccess || {},
      };

      console.log('🔍 [Edit Form] Form data being set:', formData);
      form.reset(formData, { keepDefaultValues: false });

      // If menuTree is already loaded, initialize selected menus
      if (menuTree.length > 0 && existingRole.menuAccess) {
        console.log('🔍 [Edit Form] Initializing selected menus:', existingRole.menuAccess);
        const allSelectedItemCodes = new Set(Object.values(existingRole.menuAccess).flat());
        const selectedPhysicalMenus = new Set<string>();

        // Find which physical menus contain the selected items
        menuTree.forEach(menu => {
          if (menu.menuItems && menu.menuItems.some((item: any) => allSelectedItemCodes.has(item.itemCode))) {
            selectedPhysicalMenus.add(menu.menuCode);
          }
        });

        console.log('🔍 [Edit Form] Selected physical menus:', selectedPhysicalMenus);
        setSelectedMenus(selectedPhysicalMenus);
      }
    }
  }, [existingRole, menuTree, form]);

  // Re-initialize selected menus when menuTree loads and we have existing role data
  React.useEffect(() => {
    if (existingRole?.menuAccess && menuTree.length > 0) {
      const allSelectedItemCodes = new Set(Object.values(existingRole.menuAccess).flat());
      const selectedPhysicalMenus = new Set<string>();

      // Find which physical menus contain the selected items
      menuTree.forEach(menu => {
        if (menu.menuItems && menu.menuItems.some((item: any) => allSelectedItemCodes.has(item.itemCode))) {
          selectedPhysicalMenus.add(menu.menuCode);
        }
      });

      setSelectedMenus(selectedPhysicalMenus);
    }
  }, [menuTree, existingRole]);

  // Create a lookup map for menu tree data
  const menuTreeByCode = useMemo(() => {
    return menuTree.reduce((acc, menu) => {
      acc[menu.menuCode] = menu;
      return acc;
    }, {} as Record<string, MenuTreeResponse>);
  }, [menuTree]);

  // Handle form submission
  const onSubmit = async (data: RoleCreateFormData) => {
    try {
      setLoading(true);

      const roleData = {
        roleCode: data.roleCode.toUpperCase(),
        roleName: data.roleName,
        description: data.description,
        status: data.status,
        menuAccess: data.menuAccess as Record<string, string[]>,
      };

      let result: Role;

      if (mode === 'create') {
        result = await roleService.createRoleWithMenuAccess(roleData);
        toast.success('Role created successfully with menu access!');
      } else if (mode === 'edit' && existingRole) {
        result = await roleService.updateRoleWithMenuAccess(existingRole.id, roleData);
        toast.success('Role updated successfully with menu access!');
      } else {
        throw new Error('Invalid operation');
      }

      if (onComplete) {
        onComplete(result);
      }

      navigate('/roles');

    } catch (error: any) {
      console.error('Failed to save role:', error);
      toast.error(error.message || `Failed to ${mode} role`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle menu selection
  const toggleMenuSelection = (menuCode: string) => {
    setSelectedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
        // Remove menu from menuAccess when deselected
        const currentAccess = form.getValues('menuAccess') || {};
        delete currentAccess[menuCode];
        form.setValue('menuAccess', { ...currentAccess });
      } else {
        newSet.add(menuCode);
        // Initialize with all menu items selected when menu is selected
        const menuData = menuTreeByCode[menuCode];
        const menuItemsForMenu = menuData?.menuItems || [];
        const currentAccess = form.getValues('menuAccess') || {};
        form.setValue('menuAccess', {
          ...currentAccess,
          [menuCode]: menuItemsForMenu.map(item => item.itemCode)
        });
      }
      return newSet;
    });
  };

  // Toggle menu expansion
  const toggleMenuExpansion = (menuCode: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  // Select all menu items for a menu
  const selectAllMenuItems = (menuCode: string, select: boolean) => {
    const menuData = menuTreeByCode[menuCode];
    const menuItemsForMenu = menuData?.menuItems || [];
    const currentAccess = form.getValues('menuAccess') || {};

    if (select) {
      form.setValue('menuAccess', {
        ...currentAccess,
        [menuCode]: menuItemsForMenu.map(item => item.itemCode)
      });
    } else {
      const newAccess = { ...currentAccess };
      delete newAccess[menuCode];
      form.setValue('menuAccess', newAccess);
    }
  };

  // Toggle individual menu item selection
  const toggleMenuItemSelection = (menuCode: string, menuItemCode: string) => {
    const currentAccess = form.getValues('menuAccess') || {};
    const currentItems = currentAccess[menuCode] || [];

    const newItems = currentItems.includes(menuItemCode)
      ? currentItems.filter(item => item !== menuItemCode)
      : [...currentItems, menuItemCode];

    form.setValue('menuAccess', {
      ...currentAccess,
      [menuCode]: newItems
    });
  };

  // Check if all menu items in a menu are selected
  const isAllMenuItemsSelected = (menuCode: string) => {
    const menuData = menuTreeByCode[menuCode];
    const menuItemsForMenu = menuData?.menuItems || [];
    const currentItems = menuAccess[menuCode] || [];
    return menuItemsForMenu.length > 0 &&
           menuItemsForMenu.every(item => currentItems.includes(item.itemCode));
  };

  // Check if any menu items in a menu are selected
  const isAnyMenuItemsSelected = (menuCode: string) => {
    const currentItems = menuAccess[menuCode] || [];
    return currentItems.length > 0;
  };

  // Calculate statistics
  const selectedMenuCount = selectedMenus.size;
  const selectedMenuItemCount = Object.values(menuAccess).reduce(
    (total, items) => total + items.length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {mode === 'create' ? 'Create New Role' : `Edit ${existingRole?.roleName}`}
          </h1>
          <p className="text-muted-foreground">
            Define role information and assign menu access
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onCancel || (() => navigate('/roles'))}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roles
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role Information
            </CardTitle>
            <CardDescription>
              Define the basic information for the {mode === 'create' ? 'new' : ''} role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roleCode">Role Code *</Label>
                <Input
                  id="roleCode"
                  placeholder="MANAGER_ROLE"
                  {...form.register('roleCode')}
                  className="uppercase"
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z_]/g, '');
                    form.setValue('roleCode', value);
                  }}
                />
                {form.formState.errors.roleCode && (
                  <p className="text-sm text-red-500">{form.formState.errors.roleCode.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use uppercase letters and underscores only (e.g., SALES_MANAGER)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name *</Label>
                <Input
                  id="roleName"
                  placeholder="Sales Manager"
                  {...form.register('roleName')}
                />
                {form.formState.errors.roleName && (
                  <p className="text-sm text-red-500">{form.formState.errors.roleName.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Role description..."
                  {...form.register('description')}
                  rows={3}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status') || 'ACTIVE'}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Access Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              Menu Access Assignment
            </CardTitle>
            <CardDescription>
              Select menus and specific menu items this role can access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading menus...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Menu Selection */}
                <div className="space-y-3">
                  <Label>Select Menus</Label>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {menuTree.map((menu) => {
                        const isSelected = selectedMenus.has(menu.menuCode);
                        const hasItems = isAnyMenuItemsSelected(menu.menuCode);

                        return (
                          <Button
                            key={menu.menuCode}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => toggleMenuSelection(menu.menuCode)}
                            type="button"
                          >
                            <Layers className="h-3 w-3" />
                            {menu.menuName}
                            {isSelected && hasItems && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {menuAccess[menu.menuCode]?.length || 0}
                              </Badge>
                            )}
                            {isSelected && <X className="h-3 w-3 ml-1" />}
                          </Button>
                        );
                      })}
                    </div>

                    {selectedMenuCount > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Badge variant="secondary">
                          {selectedMenuCount} menu{selectedMenuCount > 1 ? 's' : ''} selected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMenus(new Set());
                            form.setValue('menuAccess', {});
                          }}
                          className="text-xs"
                          type="button"
                        >
                          Clear all
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Items Selection */}
                {selectedMenuCount > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        <Label className="text-sm font-medium">Menu Items Selection</Label>
                        <Badge variant="outline">{selectedMenuItemCount} items selected</Badge>
                      </div>
                    </div>

                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {menuTree
                          .filter(menu => selectedMenus.has(menu.menuCode))
                          .map((menu) => {
                            const menuItemsForMenu = menu.menuItems || [];
                            const isExpanded = expandedMenus.has(menu.menuCode);
                            const isAllSelected = isAllMenuItemsSelected(menu.menuCode);
                            const selectedCount = menuAccess[menu.menuCode]?.length || 0;

                            return (
                              <div key={menu.menuCode} className="border rounded-lg">
                                <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleMenuExpansion(menu.menuCode)}
                                      className="flex items-center gap-2 hover:text-foreground"
                                      type="button"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      <Layers className="h-4 w-4" />
                                      <span className="font-medium">{menu.menuName}</span>
                                    </button>
                                    <Badge variant="outline" className="text-xs">
                                      {selectedCount}/{menuItemsForMenu.length} items
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isAllSelected}
                                      onCheckedChange={(checked) => selectAllMenuItems(menu.menuCode, !!checked)}
                                    />
                                    <Label className="text-xs cursor-pointer">Select All</Label>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="p-3 space-y-2">
                                    {menuItemsForMenu.map((menuItem) => (
                                      <div key={menuItem.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                                        <Checkbox
                                          id={`menuitem-${menuItem.id}`}
                                          checked={menuAccess[menu.menuCode]?.includes(menuItem.itemCode) || false}
                                          onCheckedChange={() =>
                                            toggleMenuItemSelection(menu.menuCode, menuItem.itemCode)
                                          }
                                        />
                                        <Label htmlFor={`menuitem-${menuItem.id}`} className="flex-1 cursor-pointer">
                                          <div>
                                            <div className="font-medium text-sm">{menuItem.itemName}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {menuItem.itemCode} • {menuItem.url}
                                            </div>
                                          </div>
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {selectedMenuCount === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Menu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No menus selected</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Select menus above to assign menu item access
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Role Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="font-medium">Role Code</div>
                <div className="text-muted-foreground">{form.watch('roleCode') || 'Not set'}</div>
              </div>
              <div>
                <div className="font-medium">Role Name</div>
                <div className="text-muted-foreground">{form.watch('roleName') || 'Not set'}</div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="text-muted-foreground">{form.watch('status') || 'Not set'}</div>
              </div>
              <div>
                <div className="font-medium">Selected Menus</div>
                <div className="text-muted-foreground">{selectedMenuCount} menus</div>
              </div>
              <div>
                <div className="font-medium">Menu Items</div>
                <div className="text-muted-foreground">{selectedMenuItemCount} items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => navigate('/roles'))}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {mode === 'create' ? 'Create Role' : 'Update Role'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleCreateForm;
