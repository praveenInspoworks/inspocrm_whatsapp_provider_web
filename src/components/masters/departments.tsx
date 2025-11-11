/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo, useRef } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

import { SelectItem } from "@/components/ui/select";
import apiService from "@/services/apiService";
import CommonTable, { ColumnConfig } from "../ui/data-display/CommonTable";
import { AddModal } from "../model/AddModel";
import { FormValidationWrapper } from "../ui/data-display/FormValidationWrapper";
import { InputWithError } from "../ui/form-fields/InputWithError";
import { SelectWithError } from "../ui/form-fields/SelectWithError";
import { TextareaWithError } from "../ui/form-fields/TextareaWithError";
import { EditModal } from "../model/EditModel";
import { ViewModal } from "../model/ViewModal";
import DeleteModal from "../model/DeleteModal";
import { importDataFromFile } from "@/utils/exportImportUtils";

const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Name can only contain letters, numbers, spaces, and hyphens")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .transform((val) => val?.trim()),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export const DepartmentManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form refs
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();

  const getDefaultFormData = (): DepartmentFormData => ({
    name: "",
    description: "",
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
        key: "name",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Description",
        key: "description",
        dataType: "string",
        sortable: true,
        render: (value: string) => (
          <div className="max-w-xs truncate" title={value}>
            {value || "-"}
          </div>
        ),
      },
      {
        title: "Status",
        key: "status",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["ACTIVE", "INACTIVE", "SUSPENDED"],
        render: (value: string) => {
          const colors = {
            ACTIVE: "bg-green-100 text-green-800",
            INACTIVE: "bg-gray-100 text-gray-800",
            SUSPENDED: "bg-red-100 text-red-800",
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              colors[value as keyof typeof colors] || "bg-gray-100 text-gray-800"
            }`}>
              {value}
            </span>
          );
        },
      },
      {
        title: "Created At",
        key: "createdAt",
        dataType: "date",
        sortable: true,
        render: (value: string) => new Date(value).toLocaleDateString(),
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
  const fetchDepartments = useCallback(
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
        const response = await apiService.post("/api/v1/departments/search", {
          page: params.page,
          size: params.size,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
          filters: params.filters,
          logicExpression: params.logicExpression,
        });
        return response;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch departments",
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

  const handleEdit = useCallback((item: any) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleView = useCallback((item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  }, []);

  const handleDelete = useCallback((item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await apiService.delete(`/api/v1/departments/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `Department ${selectedItem.name} deleted successfully`,
        variant: "success",
      });
      handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  }, [selectedItem, toast]);

  const handleSaveAdd = useCallback(
    async (data: DepartmentFormData) => {
      setIsSubmitting(true);
      try {
        await apiService.post("/api/v1/departments", data);
        toast({
          title: "Success",
          description: "Department created successfully",
          variant: "success",
        });
        setIsAddModalOpen(false);
        handleRefresh();
      } catch (error: any) {
        toast({
          title: "Error",
          description: extractErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const handleSaveEdit = useCallback(
    async (data: DepartmentFormData) => {
      setIsSubmitting(true);
      try {
        await apiService.put(`/api/v1/departments/${selectedItem.id}`, data);
        toast({
          title: "Success",
          description: "Department updated successfully",
          variant: "success",
        });
        setIsEditModalOpen(false);
        handleRefresh();
      } catch (error: any) {
        toast({
          title: "Error",
          description: extractErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        setSelectedItem(null);
      }
    },
    [selectedItem, toast]
  );

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

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Export functionality
  const handleExport = useCallback(async (fileType: 'csv' | 'xlsx' = 'xlsx') => {
    try {
      const response = await apiService.get(`/api/v1/departments/export`, {
        params: { fileType },
        responseType: 'blob',
      }) as any;

      const blobData = response.data || response;
      if (blobData && blobData instanceof Blob && blobData.size > 0) {
        const contentDisposition = response.headers?.['content-disposition'];
        let filename = `departments-export-${Date.now()}.${fileType}`;

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
  }, [toast]);

  // Import template
  const importTemplate = useMemo(
    () => [
      {
        name: "Engineering",
        description: "Software development and engineering department",
        status: "ACTIVE",
      },
      {
        name: "Marketing",
        description: "Marketing and communications department",
        status: "ACTIVE",
      },
    ],
    []
  );

  // Import handler
  const handleImport = useCallback(
    async (file: File) => {
      try {
        const importedData = await importDataFromFile(file);
        await apiService.post("/api/v1/departments/bulk", importedData);
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
      <CommonTable
        key={refreshKey}
        title="Department Management"
        description="Manage all departments in the system"
        fetchData={fetchDepartments}
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
        exportFileName="departments"
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
        title="Add New Department"
        description="Fill in the details for the new department"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={departmentSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Controller
                    name="name"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="name"
                        {...field}
                        placeholder="Enter department name"
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
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter department description"
                        rows={3}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
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
        title={`Edit ${selectedItem ? selectedItem.name : "Department"}`}
        description="Update the department details below"
        size="lg"
        isLoading={isSubmitting}
      >
        <FormValidationWrapper
          schema={departmentSchema}
          defaultValues={{
            name: selectedItem?.name || "",
            description: selectedItem?.description || "",
            status: selectedItem?.status || "ACTIVE",
          }}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name <span className="text-red-500">*</span></Label>
                  <Controller
                    name="name"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-name"
                        {...field}
                        placeholder="Enter department name"
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
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Controller
                    name="description"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter department description"
                        rows={3}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </FormValidationWrapper>
      </EditModal>

      {/* View Modal */}
      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedItem(null);
        }}
        title={`View ${selectedItem ? selectedItem.name : "Department"}`}
        description="Complete department details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedItem.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : selectedItem.status === "INACTIVE"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedItem.description && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedItem.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">Created At</Label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created By</Label>
                <p className="mt-1 text-sm text-gray-900">{selectedItem.createdBy || "-"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Updated At</Label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedItem.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Updated By</Label>
                <p className="mt-1 text-sm text-gray-900">{selectedItem.updatedBy || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </ViewModal>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedItem={selectedItem ? selectedItem.name : ""}
      />
    </div>
  );
};

export default DepartmentManagement;