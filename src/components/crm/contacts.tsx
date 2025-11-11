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

const contactSchema = z.object({
  firstName: z
    .string()
    .min(1, "First Name is required")
    .max(50, "First Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First Name can only contain letters, spaces, hyphens, and apostrophes")
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, "Last Name is required")
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
    .min(1, "Phone is required")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number")
    .transform((val) => val.trim()),
  companyId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || null),
  position: z
    .string()
    .max(100, "Position must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim()),
  department: z
    .string()
    .optional()
    .transform((val) => val?.trim() || null),
  status: z.enum(["ACTIVE", "INACTIVE", "DO_NOT_CONTACT"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .transform((val) => val?.trim()),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactManagement = () => {
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

  const getDefaultFormData = (): ContactFormData => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyId: "",
    position: "",
    department: "",
    status: "ACTIVE",
    priority: "MEDIUM",
    notes: "",
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
        render: (value: string, record: any) => (
          <div>
            <div className="font-medium">{`${record.firstName} ${record.lastName}`}</div>
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
        title: "Company",
        key: "companyId",
        displayKey: "companyName",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Status",
        key: "status",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["ACTIVE", "INACTIVE", "DO_NOT_CONTACT"],
      },
      {
        title: "Priority",
        key: "priority",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        render: (value: string) => {
          const colors = {
            LOW: "bg-gray-100 text-gray-800",
            MEDIUM: "bg-blue-100 text-blue-800",
            HIGH: "bg-orange-100 text-orange-800",
            URGENT: "bg-red-100 text-red-800",
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
              {value}
            </span>
          );
        },
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
  const fetchContacts = useCallback(
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
        const response = await apiService.post("/api/v1/contacts/search", {
          page: params.page,
          size: params.size,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
          filters: params.filters,
          logicExpression: params.logicExpression,
        });
        return response as any;
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch contacts",
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
      await apiService.delete(`/api/v1/contacts/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `Contact ${selectedItem.firstName} ${selectedItem.lastName} deleted successfully`,
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
    async (data: ContactFormData) => {
      setIsSubmitting(true);
      try {
        const payload = {
          ...data,
          companyId: data.companyId ? parseInt(data.companyId, 10) : null,
          department: data.department || null,
        };
        await apiService.post("/api/v1/contacts", payload);
        toast({
          title: "Success",
          description: `Contact ${data.firstName} ${data.lastName} added successfully`,
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
    async (data: ContactFormData) => {
      setIsSubmitting(true);
      try {
        const payload = {
          ...data,
          companyId: data.companyId ? parseInt(data.companyId, 10) : null,
          department: data.department || null,
        };
        await apiService.put(`/api/v1/contacts/${selectedItem.id}`, payload);
        toast({
          title: "Success",
          description: `Contact ${data.firstName} ${data.lastName} updated successfully`,
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
        email: "john.doe@example.com",
        phone: "+1234567890",
        companyId: "1",
        position: "Software Engineer",
        department: "Engineering",
        status: "ACTIVE",
        priority: "MEDIUM",
        notes: "Interested in our services",
      },
    ],
    []
  );

  const handleExport = useCallback(async (fileType: 'csv' | 'xlsx' = 'xlsx') => {
    try {
      const response = await apiService.get(`/api/v1/contacts/export`, {
        params: { fileType },
        responseType: 'blob',
      }) as any;

      const blobData = response.data || response;
      if (blobData && blobData instanceof Blob && blobData.size > 0) {
        const contentDisposition = response.headers?.['content-disposition'];
        let filename = `contacts-export-${Date.now()}.${fileType}`;

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
        await apiService.post("/api/v1/contacts/bulk", importedData);
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
        title="Contact Management"
        description="Manage all contacts in the system"
        fetchData={fetchContacts}
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
        exportFileName="contacts"
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
        title="Add New Contact"
        description="Fill in the details for the new contact"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={contactSchema}
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
                        placeholder="john.doe@example.com"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone<span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="companyId">Company</Label>
                  <Controller
                    name="companyId"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <ListValueDropdownWrapper
                        listKey="COMPANIES"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select Company"
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
                        listKey="DEPARTMENTS"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select Department"
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
                        <SelectItem value="DO_NOT_CONTACT">Do Not Contact</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Controller
                    name="priority"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select priority"
                      >
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Controller
                    name="notes"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter notes about this contact"
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
        title={`Edit ${selectedItem ? `${selectedItem.firstName} ${selectedItem.lastName}` : "Contact"}`}
        description="Update the contact details below"
        size="lg"
        isLoading={isSubmitting}
      >
      <FormValidationWrapper
          schema={contactSchema}
          defaultValues={{
            firstName: selectedItem?.firstName || "",
            lastName: selectedItem?.lastName || "",
            email: selectedItem?.email || "",
            phone: selectedItem?.phone || "",
            companyId: selectedItem?.companyId?.toString() || "",
            position: selectedItem?.position || "",
            department: selectedItem?.department || "",
            status: selectedItem?.status || "ACTIVE",
            priority: selectedItem?.priority || "MEDIUM",
            notes: selectedItem?.notes || "",
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
                        placeholder="john.doe@example.com"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone<span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="edit-companyId">Company</Label>
                  <Controller
                    name="companyId"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <ListValueDropdownWrapper
                        listKey="COMPANIES"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select Company"
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
                        listKey="DEPARTMENTS"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select Department"
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
                        <SelectItem value="DO_NOT_CONTACT">Do Not Contact</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Controller
                    name="priority"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select priority"
                      >
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Controller
                    name="notes"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter notes about this contact"
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

      {/* Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedItem={selectedItem ? `${selectedItem.firstName} ${selectedItem.lastName}` : ""}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedItem(null);
        }}
        title={`View ${selectedItem ? `${selectedItem.firstName} ${selectedItem.lastName}` : "Contact"}`}
        description="Complete contact details"
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
                  <Label className="text-sm font-medium text-gray-500">Company</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.companyName || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Position</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.position || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.department || "-"}</p>
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
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedItem.status || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedItem.priority === "LOW"
                        ? "bg-gray-100 text-gray-800"
                        : selectedItem.priority === "MEDIUM"
                        ? "bg-blue-100 text-blue-800"
                        : selectedItem.priority === "HIGH"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedItem.priority || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedItem.notes && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </ViewModal>
    </div>
  );
};

export default ContactManagement;
