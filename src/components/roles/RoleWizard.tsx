// src/components/role-management/RoleManager.tsx
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable, { ColumnConfig } from '@/components/ui/data-display/CommonTable';
import { roleService } from '@/services/roleService';
import { Role } from '@/types/RoleTypes';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield } from 'lucide-react';
import { useToast } from '../ui/use-toast';

export const RoleManager: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const columnConfig: ColumnConfig[] = [
    {
      title: 'ID',
      key: 'id',
      dataType: 'number',
      sortable: true,
    },
    {
      title: 'Role Code',
      key: 'roleCode',
      dataType: 'string',
      sortable: true,
    },
    {
      title: 'Role Name',
      key: 'roleName',
      dataType: 'string',
      sortable: true,
    },
    {
      title: 'Description',
      key: 'description',
      dataType: 'string',
      sortable: false,
    },
    {
      title: 'Status',
      key: 'status',
      dataType: 'string',
      sortable: true,
    },
    {
      title: 'Users',
      key: 'userCount',
      dataType: 'number',
      sortable: true,
    },
    {
      title: 'System Role',
      key: 'isSystemRole',
      dataType: 'boolean',
      sortable: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      dataType: 'action',
      actions: {
        view: true,
        edit: true,
        delete: (row: Role) => !row.isSystemRole, // Don't allow delete for system roles
      },
    },
  ];

  const fetchRoles = useCallback(async (params: {
    page: number;
    size: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: any[];
    logicExpression?: string;
  }) => {
    setLoading(true);
    try {
      const response = await roleService.getRolesPaginated({
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
        filters: params.filters,
        logicExpression: params.logicExpression
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
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

  const handleAdd = () => {
    navigate('/admin/roles/create');
  };

  const handleEdit = (role: Role) => {
    navigate(`/admin/roles/edit/${role.id}`);
  };

  const handleView = (role: Role) => {
    navigate(`/admin/roles/view/${role.id}`);
  };

  const handleDelete = async (role: Role) => {
    if (window.confirm(`Are you sure you want to delete role "${role.roleName}"?`)) {
      try {
        await roleService.deleteRole(role.id);
        // Refresh table or show success message
        toast({
          title: 'Role Deleted',
          description: `Role "${role.roleName}" has been deleted successfully.`,
        });
        // You might want to trigger a table refresh here
      } catch (error: any) {
        console.error('Failed to delete role:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete role.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-muted-foreground">
            Create and manage roles with specific permissions and menu access
          </p>
        </div>
        
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <CommonTable
        title="Roles"
        description="Manage all roles in your organization"
        fetchData={fetchRoles}
        columnConfig={columnConfig}
        enableSearch={true}
        enableFilter={true}
        enableImport={false}
        enableExport={true}
        enableAdd={false} // We have our own add button
        enableRefresh={true}
        pageSize={10}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        exportFileName="roles"
      />
    </div>
  );
};

export default RoleManager;