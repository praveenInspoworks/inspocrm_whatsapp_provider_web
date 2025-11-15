/* eslint-disable @typescript-eslint/no-explicit-any */
import { useToast } from "@/components/ui/use-toast";
import { useState, useCallback, useMemo, useRef } from "react";
import DeleteModal from "../model/DeleteModal";
import { AddModal } from "../model/AddModel";
import { ViewModal } from "../model/ViewModal";
import { Label } from "../ui/label";
import apiService from "../../services/apiService";
import CommonTable, {
  ColumnConfig,
} from "../ui/data-display/CommonTable";
import { EditModal } from "../model/EditModel";
import { exportData, importDataFromFile } from "../../utils/exportImportUtils";
import { Controller } from "react-hook-form";
import { FormValidationWrapper } from "../ui/data-display/FormValidationWrapper";
import { InputWithError } from "../ui/form-fields/InputWithError";
import { SelectWithError } from "../ui/form-fields/SelectWithError";
import { z } from "zod";
import { SelectItem } from "../ui/select";
import { TextareaWithError } from "../ui/form-fields/TextareaWithError";
import { ListValueDropdownWrapper } from "../ui/form-fields/ListValueDropdownWrapper";
import { Card, CardContent } from "../ui/card";
import { Users, Shield, Calendar, Mail } from "lucide-react";

const teamMemberSchema = z.object({
  firstName: z
    .string()
    .min(2, "First Name is required")
    .max(50, "First Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First Name can only contain letters, spaces, hyphens, and apostrophes")
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(2, "Last Name is required at least 2 characters")
    .max(50, "Last Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last Name can only contain letters, spaces, hyphens, and apostrophes")
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .transform((val) => val.trim().toLowerCase()),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number")
    .optional()
    .transform((val) => val?.trim()),
  position: z
    .string()
    .max(100, "Position must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim()),
  department: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim()),
  employeeCode: z
    .string()
    .max(50, "Employee Code must be less than 50 characters")
    .regex(/^[A-Z0-9]*$/, "Employee Code must contain only uppercase letters and numbers")
    .optional()
    .transform((val) => val?.trim().toUpperCase()),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  employeeCode?: string;
  roleId: number;
  roleName: string;
  emailVerified: boolean;
  lastLogin?: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  createdAt?: string;
  updatedAt?: string;
}

interface TeamStats {
  totalMembers: number;
  administrators: number;
  activeToday: number;
  pendingVerification: number;
}

export const TeamManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    administrators: 0,
    activeToday: 0,
    pendingVerification: 0,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TeamMember | null>(null);

  // Form refs
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();

  const getDefaultFormData = (): TeamMemberFormData => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    employeeCode: "",
    status: "ACTIVE",
  });

  // Extract meaningful error message from API response
  const extractErrorMessage = (error: any): string => {
    if (error?.response?.data) {
      const errorData = error.response.data;
      if (errorData.message && errorData.code === "BUSINESS_ERROR") {
        return errorData.message;
      }
      if (errorData.message) {
        return errorData.message;
      }
      if (errorData.error) {
        return errorData.error;
      }
    }
    if (error?.message) {
      return error.message;
    }
    return "An unexpected error occurred";
  };

  // Column configuration
  const columnConfig: ColumnConfig[] = useMemo(
    () => [
      {
        title: "ID",
        key: "id",
        dataType: "number",
        sortable: true,
      },
      {
        title: "Name",
        key: "fullName",
        dataType: "string",
        sortable: true,
        render: (value: string, record: TeamMember) => (
          <div>
            <div className="font-medium">{record.fullName}</div>
            <div className="text-sm text-muted-foreground">{record.position}</div>
          </div>
        ),
      },
      {
        title: "Email",
        key: "email",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Phone",
        key: "phone",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Department",
        key: "department",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Employee Code",
        key: "employeeCode",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Role",
        key: "roleName",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Status",
        key: "status",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["ACTIVE", "INACTIVE", "PENDING"],
        render: (value: string) => {
          const colors = {
            ACTIVE: "bg-green-100 text-green-800",
            INACTIVE: "bg-gray-100 text-gray-800",
            PENDING: "bg-yellow-100 text-yellow-800",
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
              {value}
            </span>
          );
        },
      },
      {
        title: "Email Verified",
        key: "emailVerified",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["true", "false"],
        render: (value: boolean) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {value ? "Verified" : "Pending"}
          </span>
        ),
      },
      {
        title: "Last Login",
        key: "lastLogin",
        dataType: "string",
        sortable: true,
        render: (value: string) => (
          <span className="text-sm text-gray-600">
            {value ? new Date(value).toLocaleDateString() : 'Never'}
          </span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        dataType: "action",
        actions: {
          view: true,
          edit: true,
          delete: true,
        },
      },
    ],
    []
  );

  // Fetch data with pagination
  const fetchTeamMembers = useCallback(
    async (params: {
      page: number;
      size: number;
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      filters?: any[];
      logicExpression?: string;
    }) => {
      setLoading(true);
      try {
        const response = await apiService.post("/api/v1/member/auth/search", {
          page: params.page,
          size: params.size,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
          filters: params.filters,
          logicExpression: params.logicExpression,
        });

        // Update stats when data is fetched
        if (response?.data) {
          const members = response.data;
          setStats({
            totalMembers: response.totalElements || members.length,
            administrators: members.filter((m: TeamMember) => m.roleName.includes('ADMIN')).length,
            activeToday: members.filter((m: TeamMember) =>
              m.lastLogin && new Date(m.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length,
            pendingVerification: members.filter((m: TeamMember) => !m.emailVerified).length,
          });
        }

        return response as any;
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch team members",
          variant: "destructive",
        });
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
    },
    [toast]
  );

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: TeamMember) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleView = useCallback((item: TeamMember) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  }, []);

  const handleDelete = useCallback((item: TeamMember) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await apiService.delete(`/api/v1/member/auth/delete/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `Team member ${selectedItem.fullName} deleted successfully`,
        variant: "success",
      });
      handleRefresh();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  }, [selectedItem, toast, extractErrorMessage]);

  const handleSaveAdd = useCallback(
    async (data: TeamMemberFormData) => {
      setIsSubmitting(true);
      try {
        // Set default role as MEMBER
        const memberData = { ...data, role: "MEMBER" };
        await apiService.post("/api/v1/auth/member/create", memberData);
        toast({
          title: "Success",
          description: `Team member ${data.firstName} ${data.lastName} added successfully`,
          variant: "success",
        });
        setIsAddModalOpen(false);
        handleRefresh();
      } catch (error: any) {
        const errorMessage = extractErrorMessage(error);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast, extractErrorMessage]
  );

  const handleSaveEdit = useCallback(
    async (data: TeamMemberFormData) => {
      if (!selectedItem) return;

      setIsSubmitting(true);
      try {
        await apiService.put(`/api/v1/member/auth/profile/update`, data);
        toast({
          title: "Success",
          description: `Team member ${data.firstName} ${data.lastName} updated successfully`,
          variant: "success",
        });
        setIsEditModalOpen(false);
        setSelectedItem(null);
        handleRefresh();
      } catch (error: any) {
        const errorMessage = extractErrorMessage(error);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedItem, toast, extractErrorMessage]
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

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

  const importTemplate = useMemo(
    () => [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@company.com",
        phone: "+1234567890",
        position: "Software Engineer",
        department: "Engineering",
        employeeCode: "EMP001",
        role: "USER",
        emailVerified: false,
        status: "ACTIVE",
      },
    ],
    []
  );

  const handleExport = useCallback(async (fileType: 'csv' | 'xlsx' = 'xlsx') => {
    try {
      const response = await apiService.get(`/api/v1/members/export`, {
        params: { fileType },
        responseType: 'blob',
      }) as any;

      const blobData = response.data || response;
      if (blobData && blobData instanceof Blob && blobData.size > 0) {
        const contentDisposition = response.headers?.['content-disposition'];
        let filename = `team-members-export-${Date.now()}.${fileType}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        const url = window.URL.createObjectURL(blobData);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 5000);

        toast({
          title: "Export Successful",
          description: `File download started as ${fileType.toUpperCase()}`,
          variant: "success",
        });
      } else {
        throw new Error('Server returned invalid file data');
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, extractErrorMessage]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const importedData = await importDataFromFile(file);
        await apiService.post("/api/v1/members/bulk", importedData);
        toast({
          title: "Import Successful",
          description: `${importedData.length} records imported.`,
        });
        return importedData;
      } catch (error) {
        toast({
          title: "Import Failed",
          description:
            error instanceof Error ? error.message : "Failed to import data",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">{stats.administrators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingVerification}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CommonTable
        key={refreshKey}
        title="Team Management"
        description="Manage your team members and their permissions"
        fetchData={fetchTeamMembers}
        columnConfig={columnConfig}
        enableSearch={true}
        enableFilter={true}
        enableImport={true}
        enableExport={true}
        enableAdd={true}
        enableRefresh={true}
        pageSize={10}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        exportFileName="team-members"
        importTemplate={importTemplate}
        onExport={handleExport}
        onImport={handleImport}
        loading={loading}
      />

      {/* Add Modal */}
      <AddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddModalSubmit}
        title="Add New Team Member"
        description="Fill in the details for the new team member"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={teamMemberSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name<span className="text-red-500">*</span></Label>
                  <Controller
                    name="firstName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="firstName"
                        {...field}
                        placeholder="John"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name<span className="text-red-500">*</span></Label>
                  <Controller
                    name="lastName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="lastName"
                        {...field}
                        placeholder="Doe"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email<span className="text-red-500">*</span></Label>
                  <Controller
                    name="email"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="email"
                        type="email"
                        {...field}
                        placeholder="john.doe@company.com"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Controller
                    name="phone"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="phone"
                        {...field}
                        placeholder="+1234567890"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Controller
                    name="position"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="position"
                        {...field}
                        placeholder="Software Engineer"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Controller
                    name="department"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <ListValueDropdownWrapper
                        listKey="DEPARTMENT"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select Department"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Employee Code</Label>
                  <Controller
                    name="employeeCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="employeeCode"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        placeholder="EMP001"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select status"
                      >
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                {/* Role is automatically set to MEMBER - no UI selection */}
              </div>
            </div>
          )}
        </FormValidationWrapper>
      </AddModal>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        formSubmit={handleEditModalSubmit}
        title={`Edit ${selectedItem ? selectedItem.fullName : "Team Member"}`}
        description="Update the team member details below"
        size="lg"
        isLoading={isSubmitting}
      >
        <FormValidationWrapper
          schema={teamMemberSchema}
          defaultValues={{
            firstName: selectedItem?.firstName || "",
            lastName: selectedItem?.lastName || "",
            email: selectedItem?.email || "",
            phone: selectedItem?.phone || "",
            position: selectedItem?.position || "",
            department: selectedItem?.department || "",
            employeeCode: selectedItem?.employeeCode || "",
            status: selectedItem?.status || "ACTIVE",
          }}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name<span className="text-red-500">*</span></Label>
                  <Controller
                    name="firstName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-firstName"
                        {...field}
                        placeholder="John"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name<span className="text-red-500">*</span></Label>
                  <Controller
                    name="lastName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-lastName"
                        {...field}
                        placeholder="Doe"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email<span className="text-red-500">*</span></Label>
                  <Controller
                    name="email"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-email"
                        type="email"
                        {...field}
                        placeholder="john.doe@company.com"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Controller
                    name="phone"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-phone"
                        {...field}
                        placeholder="+1234567890"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Controller
                    name="position"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-position"
                        {...field}
                        placeholder="Software Engineer"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Controller
                    name="department"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <ListValueDropdownWrapper
                        listKey="DEPARTMENT"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select Department"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-employeeCode">Employee Code</Label>
                  <Controller
                    name="employeeCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-employeeCode"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        placeholder="EMP001"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Controller
                    name="status"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select status"
                      >
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>


              </div>
            </div>
          )}
        </FormValidationWrapper>
      </EditModal>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedItem={selectedItem ? selectedItem.fullName : ""}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedItem(null);
        }}
        title={`View ${selectedItem ? selectedItem.fullName : "Team Member"}`}
        description="Complete team member details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">First Name</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.firstName || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.lastName || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.phone || "-"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Position</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.position || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.department || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Employee Code</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.employeeCode || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedItem.lastLogin ? new Date(selectedItem.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedItem.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : selectedItem.status === "INACTIVE"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {selectedItem.status || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email Verified</Label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedItem.emailVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {selectedItem.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Role</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {selectedItem.roleName || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ViewModal>
    </div>
  );
};

export default TeamManagement;
