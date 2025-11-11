// src/components/roles/RoleView.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { roleService } from '@/services/roleService';
import { menuService } from '@/services/menuService';
import { Role } from '@/types/RoleTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Shield,
  Menu,
  ArrowLeft,
  Edit,
  Calendar,
  User as UserIcon,
  Layers,
  Activity
} from 'lucide-react';

export const RoleView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuStructure, setMenuStructure] = useState<any[]>([]);

  useEffect(() => {
    const loadRole = async () => {
      if (!id) {
        toast.error('Role ID is required');
        navigate('/team/roles');
        return;
      }

      try {
        setLoading(true);

        // Fetch role details
        const roleData = await roleService.getRoleById(parseInt(id));
        setRole(roleData);

        // Fetch menu structure to show menu items
        const menus = await menuService.getMenuTree();
        setMenuStructure(Array.isArray(menus) ? menus : []);

      } catch (error: any) {
        console.error('Failed to load role:', error);
        toast.error(error.message || 'Failed to load role details');
        navigate('/team/roles');
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [id, navigate]);

  const getSelectedMenuItems = () => {
    if (!role?.menuAccess || !menuStructure.length) return [];

    const selectedItems: any[] = [];

    Object.entries(role.menuAccess).forEach(([groupName, itemCodes]) => {
      // Find menu items that match these codes
      menuStructure.forEach(menu => {
        menu.menuItems?.forEach((item: any) => {
          if (itemCodes.includes(item.itemCode)) {
            selectedItems.push({
              ...item,
              groupName,
              menuName: menu.menuName
            });
          }
        });
      });
    });

    return selectedItems;
  };

  const getMenuItemsByGroup = (): [string, any[]][] => {
    const items = getSelectedMenuItems();
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.groupName]) {
        acc[item.groupName] = [];
      }
      acc[item.groupName].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped) as [string, any[]][];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Role not found</p>
      </div>
    );
  }

  const selectedItems = getSelectedMenuItems();
  const menuGroups = getMenuItemsByGroup();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/team/roles')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{role.roleName}</h1>
            <p className="text-muted-foreground">
              Role Code: {role.roleCode}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/roles/edit/${role.id}`)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role Code</label>
                <p className="text-lg font-semibold">{role.roleCode}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                <p className="text-lg font-semibold">{role.roleName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={role.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {role.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="mt-1">
                  <Badge variant={role.isSystemRole ? 'outline' : 'default'}>
                    {role.isSystemRole ? 'System Role' : 'Custom Role'}
                  </Badge>
                </div>
              </div>

              {role.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-muted-foreground mt-1">{role.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Menu Groups</span>
                  <span className="font-medium">{Object.keys(role.menuAccess || {}).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Menu Items</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User Count</span>
                  <span className="font-medium">{role.userCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Access */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Menu Access Configuration
              </CardTitle>
              <CardDescription>
                This role has access to the following menu items, organized by groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Menu className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No menu access configured</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {menuGroups.map(([groupName, items]) => (
                    <div key={groupName}>
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-lg">{groupName}</h3>
                        <Badge variant="outline">{items.length} items</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.itemName}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.itemCode} • {item.menuName}
                              </div>
                              {item.url && (
                                <div className="text-xs text-blue-600">{item.url}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {role.createdAt && (
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(role.createdAt).toLocaleString()}
                      {role.createdBy && ` by ${role.createdBy}`}
                    </p>
                  </div>
                </div>
              )}

              {role.updatedAt && (
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(role.updatedAt).toLocaleString()}
                      {role.updatedBy && ` by ${role.updatedBy}`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleView;
