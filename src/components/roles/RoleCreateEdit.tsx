import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { roleService } from '@/services/roleService';
import { Role } from '@/types/RoleTypes';
import RoleCreateForm from './RoleCreateForm';

const RoleCreateEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [existingRole, setExistingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const mode = id ? 'edit' : 'create';

  useEffect(() => {
    const loadRoleForEdit = async () => {
      if (!id) return; // Create mode

      console.log('🔍 [RoleCreateEdit] Loading role for edit, ID:', id);
      try {
        setLoading(true);
        const roleData = await roleService.getRoleById(parseInt(id));
        console.log('🔍 [RoleCreateEdit] Role data loaded:', roleData);
        setExistingRole(roleData);
      } catch (error: any) {
        console.error('Failed to load role for edit:', error);
        toast.error(error.message || 'Failed to load role for editing');
        navigate('/team/team/roles');
      } finally {
        setLoading(false);
      }
    };

    loadRoleForEdit();
  }, [id, navigate]);

  if (mode === 'edit' && loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RoleCreateForm
      mode={mode}
      existingRole={existingRole || undefined}
      onComplete={(role) => {
        console.log('Role operation completed:', role);
        toast.success(`Role ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        navigate('/team/team/roles');
      }}
      onCancel={() => navigate('/team/roles')}
    />
  );
};

export default RoleCreateEdit;
