import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roleService } from '@/services/roleService';
import { Role, Permission, RolePermissionAssignment } from '@/types/RoleTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Grid,
  Users,
  Shield,
  CheckSquare,
  Square,
  Save,
  RotateCcw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface RolePermissionMatrixProps {
  onAssignmentChange?: (assignments: RolePermissionAssignment[]) => void;
}

export const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  onAssignmentChange
}) => {
  // State management
  const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [roleAssignments, setRoleAssignments] = useState<Map<number, Set<number>>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles-matrix'],
    queryFn: () => roleService.getRoles(),
    staleTime: 5 * 60 * 1000,
  });

  // Extract roles array from response
  const rolesData = rolesResponse?.roles || [];

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions-matrix'],
    queryFn: () => roleService.getPermissions(),
    staleTime: 5 * 60 * 1000,
  });

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    if (!permissionsData) return {};

    const filtered = permissionsData.filter(permission => {
      const matchesSearch = !searchTerm ||
        permission.menuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.route.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filterCategory || permission.category === filterCategory;

      return matchesSearch && matchesCategory;
    });

    return filtered.reduce((acc, permission) => {
      const category = permission.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissionsData, searchTerm, filterCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!permissionsData) return [];
    const categorySet = new Set(permissionsData.map(p => p.category || 'Uncategorized'));
    return Array.from(categorySet).sort();
  }, [permissionsData]);

  // Handle role selection
  const toggleRoleSelection = useCallback((roleId: number) => {
    setSelectedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  }, []);

  // Handle permission selection
  const togglePermissionSelection = useCallback((permissionId: number) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  }, []);

  // Handle role-permission assignment toggle
  const toggleRolePermission = useCallback((roleId: number, permissionId: number) => {
    setRoleAssignments(prev => {
      const newMap = new Map(prev);
      const rolePermissions = newMap.get(roleId) || new Set();

      if (rolePermissions.has(permissionId)) {
        rolePermissions.delete(permissionId);
      } else {
        rolePermissions.add(permissionId);
      }

      if (rolePermissions.size > 0) {
        newMap.set(roleId, rolePermissions);
      } else {
        newMap.delete(roleId);
      }

      return newMap;
    });
  }, []);

  // Check if role has permission
  const hasRolePermission = useCallback((roleId: number, permissionId: number) => {
    return roleAssignments.get(roleId)?.has(permissionId) || false;
  }, [roleAssignments]);

  // Bulk assign permissions to selected roles
  const handleBulkAssign = useCallback(async () => {
    if (selectedRoles.size === 0 || selectedPermissions.size === 0) {
      toast.error('Please select roles and permissions to assign');
      return;
    }

    try {
      const assignments: RolePermissionAssignment[] = Array.from(selectedRoles).map(roleId => ({
        roleId,
        permissionIds: Array.from(selectedPermissions)
      }));

      // Assign permissions to each selected role
      for (const assignment of assignments) {
        await roleService.assignPermissionsToRole(assignment);
      }

      toast.success(`Permissions assigned to ${selectedRoles.size} roles successfully`);
      setSelectedRoles(new Set());
      setSelectedPermissions(new Set());

      // Notify parent component of changes
      if (onAssignmentChange) {
        onAssignmentChange(assignments);
      }
    } catch (error) {
      console.error('Failed to assign permissions:', error);
      toast.error('Failed to assign permissions');
    }
  }, [selectedRoles, selectedPermissions, onAssignmentChange]);

  // Bulk remove permissions from selected roles
  const handleBulkRemove = useCallback(async () => {
    if (selectedRoles.size === 0 || selectedPermissions.size === 0) {
      toast.error('Please select roles and permissions to remove');
      return;
    }

    try {
      // Remove permissions from each selected role
      for (const roleId of selectedRoles) {
        await roleService.removePermissionsFromRole(roleId, Array.from(selectedPermissions));
      }

      toast.success(`Permissions removed from ${selectedRoles.size} roles successfully`);
      setSelectedRoles(new Set());
      setSelectedPermissions(new Set());
    } catch (error) {
      console.error('Failed to remove permissions:', error);
      toast.error('Failed to remove permissions');
    }
  }, [selectedRoles, selectedPermissions]);

  // Toggle category expansion
  const toggleCategoryExpansion = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Render matrix view
  const renderMatrixView = () => {
    if (!rolesData || !permissionsData) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading matrix data...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Selected Roles:</Label>
            <Badge variant="outline">{selectedRoles.size}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Selected Permissions:</Label>
            <Badge variant="outline">{selectedPermissions.size}</Badge>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={handleBulkAssign}
              disabled={selectedRoles.size === 0 || selectedPermissions.size === 0}
              size="sm"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Assign Selected
            </Button>

            <Button
              onClick={handleBulkRemove}
              disabled={selectedRoles.size === 0 || selectedPermissions.size === 0}
              variant="outline"
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Remove Selected
            </Button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-12 p-3 text-left">
                    <Checkbox
                      checked={selectedRoles.size === rolesData.length && rolesData.length > 0}
                      onCheckedChange={() => {
                        if (selectedRoles.size === rolesData.length) {
                          setSelectedRoles(new Set());
                        } else {
                          setSelectedRoles(new Set(rolesData.map(r => r.id)));
                        }
                      }}
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Roles</th>
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <th key={category} className="p-3 text-center font-medium min-w-48">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleCategoryExpansion(category)}
                          className="flex items-center gap-1"
                        >
                          {expandedCategories.has(category) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="text-sm">{category}</span>
                        </button>
                        <Badge variant="outline" className="text-xs">
                          {permissions.length}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rolesData.map((role) => (
                  <tr key={role.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedRoles.has(role.id)}
                        onCheckedChange={() => toggleRoleSelection(role.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{role.displayName}</div>
                        <div className="text-sm text-muted-foreground">{role.name}</div>
                        <Badge variant={role.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs mt-1">
                          {role.status}
                        </Badge>
                      </div>
                    </td>
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                      <td key={`${role.id}-${category}`} className="p-3">
                        {expandedCategories.has(category) && (
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={hasRolePermission(role.id, permission.id)}
                                    onCheckedChange={() => toggleRolePermission(role.id, permission.id)}
                                  />
                                  <div>
                                    <div className="text-sm font-medium">{permission.menuName}</div>
                                    <div className="text-xs text-muted-foreground">{permission.route}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    if (!rolesData || !permissionsData) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading assignment data...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles and permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Category:</Label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Role-Permission Assignments */}
        <div className="space-y-4">
          {rolesData.map((role) => {
            const rolePermissionIds = roleAssignments.get(role.id) || new Set();
            const filteredPermissions = permissionsData.filter(permission => {
              const matchesSearch = !searchTerm ||
                permission.menuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                role.displayName.toLowerCase().includes(searchTerm.toLowerCase());

              const matchesCategory = !filterCategory || permission.category === filterCategory;

              return matchesSearch && matchesCategory;
            });

            return (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{role.displayName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={role.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {role.status}
                      </Badge>
                      <Badge variant="outline">
                        {rolePermissionIds.size} permissions
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => toggleCategoryExpansion(category)}
                              className="flex items-center gap-1 text-sm font-medium"
                            >
                              {expandedCategories.has(category) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {category}
                            </button>
                            <Badge variant="outline" className="text-xs">
                              {permissions.length}
                            </Badge>
                          </div>

                          {expandedCategories.has(category) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                              {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center gap-2 p-2 border rounded">
                                  <Checkbox
                                    checked={hasRolePermission(role.id, permission.id)}
                                    onCheckedChange={() => toggleRolePermission(role.id, permission.id)}
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{permission.menuName}</div>
                                    <div className="text-xs text-muted-foreground">{permission.route}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Role-Permission Assignment</h2>
          <p className="text-muted-foreground">
            Manage which permissions are assigned to each role
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'matrix' ? 'list' : 'matrix')}
          >
            <Grid className="h-4 w-4 mr-2" />
            {viewMode === 'matrix' ? 'List View' : 'Matrix View'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={viewMode} className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Matrix View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          {renderMatrixView()}
        </TabsContent>

        <TabsContent value="list">
          {renderListView()}
        </TabsContent>
      </Tabs>

      {/* Summary */}
      {roleAssignments.size > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(roleAssignments.entries()).map(([roleId, permissionIds]) => {
                const role = rolesData?.find(r => r.id === roleId);
                const permissions = permissionsData?.filter(p => permissionIds.has(p.id));

                if (!role || !permissions) return null;

                return (
                  <div key={roleId} className="flex items-center gap-2 p-2 bg-background rounded">
                    <Badge variant="outline">{role.displayName}</Badge>
                    <span className="text-sm text-muted-foreground">→</span>
                    <div className="flex flex-wrap gap-1">
                      {permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission.id} variant="secondary" className="text-xs">
                          {permission.menuName}
                        </Badge>
                      ))}
                      {permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RolePermissionMatrix;
