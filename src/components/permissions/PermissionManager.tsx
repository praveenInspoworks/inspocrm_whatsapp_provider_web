import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import CommonTable, { ColumnConfig } from '@/components/ui/data-display/CommonTable';
import { roleService } from '@/services/roleService';
import { Permission, PermissionFormData, PermissionFilters } from '@/types/RoleTypes';
import { permissionFormSchema } from '@/lib/validations/RoleValidation';
import { AddModal } from '@/components/model/AddModel';
import { EditModal } from '@/components/model/EditModel';
import { DeleteModal } from '@/components/model/DeleteModal';
import { FormValidationWrapper } from '@/components/ui/data-display/FormValidationWrapper';
import { InputWithError } from '@/components/ui/form-fields/InputWithError';
import { SelectWithError } from '@/components/ui/form-fields/SelectWithError';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine, Shield, Settings, FolderOpen, Folder, Eye, Edit, Trash2 } from 'lucide-react';

interface PermissionManagerProps {
  onPermissionSelect?: (permission: Permission) => void;
  selectedPermissionIds?: number[];
  multiSelect?: boolean;
  showCategories?: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  onPermissionSelect,
  selectedPermissionIds = [],
  multiSelect = false,
  showCategories = true
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  // Form refs for modal submissions
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();

  // Fetch permissions data
  const { data: permissionsData, isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery({
    queryKey: ['permissions', refreshKey],
    queryFn: () => roleService.getPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch permissions tree data
  const { data: permissionsTreeData, isLoading: treeLoading } = useQuery({
    queryKey: ['permissions-tree'],
    queryFn: () => roleService.getPermissionsTree(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Column configuration for permissions table
  const permissionColumnConfig: ColumnConfig[] = useMemo(() => [
    {
      title: 'ID',
      key: 'id',
      dataType: 'number',
      sortable: true,
    },
    {
      title: 'Menu Name',
      key: 'menuName',
      dataType: 'string',
      sortable: true,
    },
    {
      title: 'Route',
      key: 'route',
      dataType: 'string',
      sortable: true,
    },
    {
      title: 'Icon',
      key: 'menuIcon',
      dataType: 'custom',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value && <i className={value} />}
          <span className="text-sm text-muted-foreground">{value || 'No icon'}</span>
        </div>
      ),
      sortable: false,
    },
    {
      title: 'Parent',
      key: 'parentId',
      dataType: 'custom',
      render: (value: number, record: Permission) => {
        if (!value) return <Badge variant="outline">Root</Badge>;

        const parent = permissionsData?.find(p => p.id === value);
        return (
          <Badge variant="secondary">
            {parent?.menuName || `Parent #${value}`}
          </Badge>
        );
      },
      sortable: true,
    },
    {
      title: 'Type',
      key: 'isSystemPermission',
      dataType: 'custom',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'System' : 'Custom'}
        </Badge>
      ),
      sortable: true,
    },
    {
      title: 'Status',
      key: 'status',
      dataType: 'status',
      sortable: true,
      filter: true,
      options: ['ACTIVE', 'INACTIVE'],
    },
    {
      title: 'Category',
      key: 'category',
      dataType: 'string',
      sortable: true,
      filter: true,
      options: ['Dashboard & Analytics', 'Contact Management', 'Sales Operations', 'Communications', 'Marketing & AI', 'Social Media', 'System Administration'],
    },
    {
      title: 'Actions',
      key: 'actions',
      dataType: 'action',
      actions: {
        view: true,
        edit: true,
        delete: true,
      },
    },
  ], [permissionsData]);

  // Fetch permissions with pagination for CommonTable
  const fetchPermissions = useCallback(async (params: {
    page: number;
    size: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: any[];
    logicExpression?: string;
  }) => {
    setLoading(true);
    try {
      // For now, we'll use the simple getPermissions method
      // In a real implementation, you'd want pagination for permissions too
      const allPermissions = await roleService.getPermissions();

      // Apply client-side filtering and pagination for demo
      let filtered = [...allPermissions];

      // Apply filters
      if (params.filters && params.filters.length > 0) {
        params.filters.forEach((filter: any) => {
          if (filter.filterValue) {
            filtered = filtered.filter(item => {
              const value = item[filter.filterName];
              return String(value).toLowerCase().includes(filter.filterValue.toLowerCase());
            });
          }
        });
      }

      // Apply sorting
      if (params.sortBy) {
        filtered.sort((a, b) => {
          const aValue = a[params.sortBy!];
          const bValue = b[params.sortBy!];

          if (aValue < bValue) return params.sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return params.sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // Apply pagination
      const startIndex = params.page * params.size;
      const endIndex = startIndex + params.size;
      const paginatedData = filtered.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        page: params.page,
        size: params.size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / params.size),
        hasNext: endIndex < filtered.length,
        hasPrevious: params.page > 0,
      };
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return {
        data: [],
        page: 0,
        size: params.size,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Default form data
  const getDefaultFormData = (): PermissionFormData => ({
    menuName: '',
    route: '',
    menuIcon: '',
    parentId: undefined,
    status: 'ACTIVE',
    category: '',
  });

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedPermission(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeleteModalOpen(true);
  }, []);

  const handleView = useCallback((permission: Permission) => {
    setSelectedPermission(permission);
    console.log('View permission:', permission);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    refetchPermissions();
  }, [refetchPermissions]);

  // CRUD operations
  const handleSaveAdd = useCallback(async (data: PermissionFormData) => {
    try {
      await roleService.createPermission({
        menuName: data.menuName,
        route: data.route,
        menuIcon: data.menuIcon,
        parentId: data.parentId,
        status: data.status,
        category: data.category,
      });

      setIsAddModalOpen(false);
      handleRefresh();
    } catch (error) {
      console.error('Failed to create permission:', error);
    }
  }, [handleRefresh]);

  const handleSaveEdit = useCallback(async (data: PermissionFormData) => {
    if (!selectedPermission) return;

    try {
      await roleService.updatePermission(selectedPermission.id, {
        menuName: data.menuName,
        route: data.route,
        menuIcon: data.menuIcon,
        parentId: data.parentId,
        status: data.status,
        category: data.category,
      });

      setIsEditModalOpen(false);
      setSelectedPermission(null);
      handleRefresh();
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  }, [selectedPermission, handleRefresh]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPermission) return;

    try {
      await roleService.deletePermission(selectedPermission.id);
      setIsDeleteModalOpen(false);
      setSelectedPermission(null);
      handleRefresh();
    } catch (error) {
      console.error('Failed to delete permission:', error);
    }
  }, [selectedPermission, handleRefresh]);

  // Modal submit handlers
  const handleAddModalSubmit = useCallback(() => {
    if (addFormSubmitRef.current) {
      addFormSubmitRef.current();
    }
  }, []);

  const handleEditModalSubmit = useCallback(() => {
    if (editFormSubmitRef.current) {
      editFormSubmitRef.current();
    }
  }, []);

  // Render permission tree node
  const renderTreeNode = (node: any, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-gray-400" />
            )}
            {node.menuIcon && <i className={`${node.menuIcon} text-gray-500`} />}
          </div>

          <div className="flex-1">
            <div className="font-medium">{node.menuName}</div>
            <div className="text-sm text-muted-foreground">{node.route}</div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={node.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {node.status}
            </Badge>
            <Badge variant="outline">{node.category || 'No Category'}</Badge>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleView(node)}
              className="p-1 hover:bg-muted rounded"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(node)}
              className="p-1 hover:bg-muted rounded"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              className="p-1 hover:bg-destructive/10 text-destructive rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {hasChildren && node.children.map((child: any) => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Permission Management</h1>
          <p className="text-muted-foreground">
            Manage menu items and permissions for your CRM system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'tree' : 'table')}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-muted"
          >
            <TreePine className="h-4 w-4" />
            {viewMode === 'table' ? 'Tree View' : 'Table View'}
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CommonTable
              key={refreshKey}
              title="Permissions"
              description="Manage all permissions in your system"
              fetchData={fetchPermissions}
              columnConfig={permissionColumnConfig}
              enableSearch={true}
              enableFilter={true}
              enableImport={true}
              enableExport={true}
              enableAdd={true}
              enableRefresh={true}
              pageSize={15}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              exportFileName="permissions"
              loading={loading || permissionsLoading}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5" />
              Permission Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {treeLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading permission tree...</p>
                </div>
              ) : permissionsTreeData && permissionsTreeData.length > 0 ? (
                permissionsTreeData.map((node) => renderTreeNode(node))
              ) : (
                <div className="text-center py-8">
                  <TreePine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No permissions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Permission Modal */}
      <AddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddModalSubmit}
        title="Create New Permission"
        description="Add a new menu item/permission to the system"
        size="lg"
      >
        <FormValidationWrapper
          schema={permissionFormSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="menuName">Menu Name *</Label>
                  <InputWithError
                    id="menuName"
                    {...methods.register('menuName')}
                    placeholder="User Management"
                    error={methods.formState.errors.menuName?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route">Route *</Label>
                  <InputWithError
                    id="route"
                    {...methods.register('route')}
                    placeholder="/users"
                    error={methods.formState.errors.route?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menuIcon">Icon Class</Label>
                  <InputWithError
                    id="menuIcon"
                    {...methods.register('menuIcon')}
                    placeholder="lucide-users"
                    error={methods.formState.errors.menuIcon?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Permission</Label>
                  <SelectWithError
                    value={methods.watch('parentId')?.toString() || ''}
                    onValueChange={(value) => methods.setValue('parentId', value ? parseInt(value) : undefined)}
                    error={methods.formState.errors.parentId?.message}
                    placeholder="Select parent (optional)"
                  >
                    <option value="">Root Level</option>
                    {permissionsData?.filter(p => p.status === 'ACTIVE').map((permission) => (
                      <option key={permission.id} value={permission.id.toString()}>
                        {permission.menuName} ({permission.route})
                      </option>
                    ))}
                  </SelectWithError>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <SelectWithError
                    value={methods.watch('status')}
                    onValueChange={(value) => methods.setValue('status', value as 'ACTIVE' | 'INACTIVE')}
                    error={methods.formState.errors.status?.message}
                    placeholder="Select status"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </SelectWithError>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <SelectWithError
                    value={methods.watch('category') || ''}
                    onValueChange={(value) => methods.setValue('category', value)}
                    error={methods.formState.errors.category?.message}
                    placeholder="Select category"
                  >
                    <option value="">No Category</option>
                    <option value="Dashboard & Analytics">Dashboard & Analytics</option>
                    <option value="Contact Management">Contact Management</option>
                    <option value="Sales Operations">Sales Operations</option>
                    <option value="Communications">Communications</option>
                    <option value="Marketing & AI">Marketing & AI</option>
                    <option value="Social Media">Social Media</option>
                    <option value="System Administration">System Administration</option>
                  </SelectWithError>
                </div>
              </div>
            </div>
          )}
        </FormValidationWrapper>
      </AddModal>

      {/* Edit Permission Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPermission(null);
        }}
        formSubmit={handleEditModalSubmit}
        title={`Edit ${selectedPermission?.menuName || 'Permission'}`}
        description="Update permission information"
        size="lg"
      >
        {selectedPermission && (
          <FormValidationWrapper
            schema={permissionFormSchema}
            defaultValues={{
              menuName: selectedPermission.menuName,
              route: selectedPermission.route,
              menuIcon: selectedPermission.menuIcon,
              parentId: selectedPermission.parentId,
              status: selectedPermission.status as 'ACTIVE' | 'INACTIVE',
              category: selectedPermission.category || '',
            }}
            onSubmit={handleSaveEdit}
            submitRef={editFormSubmitRef}
          >
            {(methods) => (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-menuName">Menu Name *</Label>
                    <InputWithError
                      id="edit-menuName"
                      {...methods.register('menuName')}
                      placeholder="User Management"
                      error={methods.formState.errors.menuName?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-route">Route *</Label>
                    <InputWithError
                      id="edit-route"
                      {...methods.register('route')}
                      placeholder="/users"
                      error={methods.formState.errors.route?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-menuIcon">Icon Class</Label>
                    <InputWithError
                      id="edit-menuIcon"
                      {...methods.register('menuIcon')}
                      placeholder="lucide-users"
                      error={methods.formState.errors.menuIcon?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-parentId">Parent Permission</Label>
                    <SelectWithError
                      value={methods.watch('parentId')?.toString() || ''}
                      onValueChange={(value) => methods.setValue('parentId', value ? parseInt(value) : undefined)}
                      error={methods.formState.errors.parentId?.message}
                      placeholder="Select parent (optional)"
                    >
                      <option value="">Root Level</option>
                      {permissionsData?.filter(p => p.id !== selectedPermission.id && p.status === 'ACTIVE').map((permission) => (
                        <option key={permission.id} value={permission.id.toString()}>
                          {permission.menuName} ({permission.route})
                        </option>
                      ))}
                    </SelectWithError>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <SelectWithError
                      value={methods.watch('status')}
                      onValueChange={(value) => methods.setValue('status', value as 'ACTIVE' | 'INACTIVE')}
                      error={methods.formState.errors.status?.message}
                      placeholder="Select status"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </SelectWithError>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <SelectWithError
                      value={methods.watch('category') || ''}
                      onValueChange={(value) => methods.setValue('category', value)}
                      error={methods.formState.errors.category?.message}
                      placeholder="Select category"
                    >
                      <option value="">No Category</option>
                      <option value="Dashboard & Analytics">Dashboard & Analytics</option>
                      <option value="Contact Management">Contact Management</option>
                      <option value="Sales Operations">Sales Operations</option>
                      <option value="Communications">Communications</option>
                      <option value="Marketing & AI">Marketing & AI</option>
                      <option value="Social Media">Social Media</option>
                      <option value="System Administration">System Administration</option>
                    </SelectWithError>
                  </div>
                </div>
              </div>
            )}
          </FormValidationWrapper>
        )}
      </EditModal>

      {/* Delete Permission Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedItem={selectedPermission?.menuName || selectedPermission?.route}
      />
    </div>
  );
};

export default PermissionManager;
