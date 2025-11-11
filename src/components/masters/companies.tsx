/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo, useRef } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { Upload, X, Eye, EyeOff } from "lucide-react";

import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { ListValueDropdownWrapper } from "../ui/form-fields/ListValueDropdownWrapper";

const companySchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-&.,]+$/, "Company name can only contain letters, numbers, spaces, and basic punctuation")
    .transform((val) => val.trim()),
  industry: z
    .string()
    .max(100, "Industry must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim()),
  companySize: z
    .string()
    .max(50, "Company size must be less than 50 characters")
    .optional()
    .transform((val) => val?.trim()),
  website: z
    .string()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal(""))
    .transform((val) => val?.trim()),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .transform((val) => val?.trim()),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .transform((val) => val?.trim()),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone must be less than 20 characters")
    .regex(/^\+[1-9]\d{1,14}$/, "Phone number must include country code (e.g., +1234567890)")
    .transform((val) => val?.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine((email) => {
      if (!email) return true; // Allow empty for optional fields
      const publicDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
        'icloud.com', 'live.com', 'msn.com', 'yahoo.co.in', 'rediffmail.com',
        'protonmail.com', 'mail.com', 'yandex.com', 'zoho.com'
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return !publicDomains.includes(domain);
    }, "Please use a business email address (gmail, outlook, yahoo, etc. are not allowed)")
    .transform((val) => val?.trim()),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

type CompanyFormData = z.infer<typeof companySchema>;

export const CompanyManagement = () => {
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

  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Form refs
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const getDefaultFormData = (): CompanyFormData => ({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
    description: "",
    address: "",
    phone: "",
    email: "",
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
        title: "Company Name",
        key: "companyName",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Industry",
        key: "industry",
        dataType: "string",
        sortable: true,
        render: (value: string) => value || "-",
      },
      {
        title: "Company Size",
        key: "companySize",
        dataType: "string",
        sortable: true,
        render: (value: string) => value || "-",
      },
      {
        title: "Email",
        key: "email",
        dataType: "string",
        sortable: true,
        render: (value: string) => value || "-",
      },
      {
        title: "Phone",
        key: "phone",
        dataType: "string",
        sortable: true,
        render: (value: string) => value || "-",
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
        title: "Logo",
        key: "logoUrl",
        dataType: "string",
        render: (value: string) => (
          value ? (
            <img
              src={value}
              alt="Company Logo"
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">N/A</span>
            </div>
          )
        ),
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
  const fetchCompanies = useCallback(
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
        const response = await apiService.post("/api/v1/companies/search", {
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
          description: "Failed to fetch companies",
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

  // Logo upload handler
  const handleLogoUpload = useCallback(async (companyId: number, file: File) => {
    setIsUploadingLogo(true);
    try {
      const response = await apiService.uploadFile(`/api/v1/companies/${companyId}/logo`, file);

      toast({
        title: "Success",
        description: "Company logo uploaded successfully",
        variant: "success",
      });

      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload company logo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploadingLogo(false);
    }
  }, [toast]);

  // Logo file change handler
  const handleLogoFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  // Remove logo
  const handleRemoveLogo = useCallback(() => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }, []);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setLogoFile(null);
    setLogoPreview(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: any) => {
    setSelectedItem(item);
    setLogoFile(null);
    setLogoPreview(item.logoUrl || null);
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
      await apiService.delete(`/api/v1/companies/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `Company ${selectedItem.companyName} deleted successfully`,
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
    async (data: CompanyFormData) => {
      setIsSubmitting(true);
      try {
        // Create company first
        const response = await apiService.post("/api/v1/companies", data);
        const newCompany = response;

        // Upload logo if provided
        if (logoFile && newCompany.id) {
          await handleLogoUpload(newCompany.id, logoFile);
        }

        toast({
          title: "Success",
          description: "Company created successfully",
          variant: "success",
        });
        setIsAddModalOpen(false);
        setLogoFile(null);
        setLogoPreview(null);
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
    [toast, logoFile, handleLogoUpload]
  );

  const handleSaveEdit = useCallback(
    async (data: CompanyFormData) => {
      setIsSubmitting(true);
      try {
        // Update company
        await apiService.put(`/api/v1/companies/${selectedItem.id}`, data);

        // Upload new logo if provided
        if (logoFile && selectedItem.id) {
          await handleLogoUpload(selectedItem.id, logoFile);
        }

        toast({
          title: "Success",
          description: "Company updated successfully",
          variant: "success",
        });
        setIsEditModalOpen(false);
        setLogoFile(null);
        setLogoPreview(null);
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
    [selectedItem, toast, logoFile, handleLogoUpload]
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
      const response = await apiService.get(`/api/v1/companies/export`, {
        params: { fileType },
        responseType: 'blob',
      }) as any;

      const blobData = response.data || response;
      if (blobData && blobData instanceof Blob && blobData.size > 0) {
        const contentDisposition = response.headers?.['content-disposition'];
        let filename = `companies-export-${Date.now()}.${fileType}`;

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
        companyName: "TechCorp Solutions",
        industry: "Technology",
        companySize: "51-200",
        website: "https://techcorp.com",
        description: "Leading technology solutions provider",
        address: "123 Tech Street, Silicon Valley, CA",
        phone: "+1-555-0123",
        email: "contact@techcorp.com",
        status: "ACTIVE",
      },
      {
        companyName: "Global Marketing Inc",
        industry: "Marketing",
        companySize: "11-50",
        website: "https://globalmarketing.com",
        description: "Digital marketing and advertising agency",
        address: "456 Marketing Ave, New York, NY",
        phone: "+1-555-0456",
        email: "info@globalmarketing.com",
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
        await apiService.post("/api/v1/companies/bulk", importedData);
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
        title="Company Management"
        description="Manage all companies in the system"
        fetchData={fetchCompanies}
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
        exportFileName="companies"
        importTemplate={importTemplate}
        onExport={handleExport}
        onImport={handleImport}
        loading={loading}
      />

      {/* Add Modal */}
      <AddModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setLogoFile(null);
          setLogoPreview(null);
        }}
        onSave={handleAddModalSubmit}
        title="Add New Company"
        description="Fill in the details for the new company"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={companySchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                  <Controller
                    name="companyName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="companyName"
                        {...field}
                        placeholder="Enter company name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Controller
                    name="industry"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <ListValueDropdownWrapper
                        listKey="INDUSTRY"
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select industry"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Controller
                    name="companySize"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select company size"
                      >
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectWithError>
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

                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Controller
                    name="email"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="email"
                        type="email"
                        {...field}
                        placeholder="Enter business email address"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
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

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="website">Website</Label>
                  <Controller
                    name="website"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="website"
                        {...field}
                        placeholder="https://example.com"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="address">Address</Label>
                  <Controller
                    name="address"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter company address"
                        rows={2}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter company description"
                        rows={3}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-2 md:col-span-3">
                  <Label>Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoFile ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {(logoPreview || logoFile) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {logoPreview && (
                    <div className="mt-2">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
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
          setLogoFile(null);
          setLogoPreview(null);
        }}
        formSubmit={handleEditModalSubmit}
        title={`Edit ${selectedItem ? selectedItem.companyName : "Company"}`}
        description="Update the company details below"
        size="lg"
        isLoading={isSubmitting}
      >
        <FormValidationWrapper
          schema={companySchema}
          defaultValues={{
            companyName: selectedItem?.companyName || "",
            industry: selectedItem?.industry || "",
            companySize: selectedItem?.companySize || "",
            website: selectedItem?.website || "",
            description: selectedItem?.description || "",
            address: selectedItem?.address || "",
            phone: selectedItem?.phone || "",
            email: selectedItem?.email || "",
            status: selectedItem?.status || "ACTIVE",
          }}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-companyName">Company Name <span className="text-red-500">*</span></Label>
                  <Controller
                    name="companyName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-companyName"
                        {...field}
                        placeholder="Enter company name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-industry">Industry</Label>
                  <Controller
                    name="industry"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <ListValueDropdownWrapper
                        listKey="INDUSTRY"
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select industry"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-companySize">Company Size</Label>
                  <Controller
                    name="companySize"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Select company size"
                      >
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectWithError>
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

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
                  <Controller
                    name="email"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-email"
                        type="email"
                        {...field}
                        placeholder="Enter business email address"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone <span className="text-red-500">*</span></Label>
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

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="edit-website">Website</Label>
                  <Controller
                    name="website"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-website"
                        {...field}
                        placeholder="https://example.com"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="edit-address">Address</Label>
                  <Controller
                    name="address"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter company address"
                        rows={2}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="edit-description">Description</Label>
                  <Controller
                    name="description"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextareaWithError
                        {...field}
                        placeholder="Enter company description"
                        rows={3}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-2 md:col-span-3">
                  <Label>Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoFile ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {(logoPreview || logoFile) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {logoPreview && (
                    <div className="mt-2">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
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
        title={`View ${selectedItem ? selectedItem.companyName : "Company"}`}
        description="Complete company details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Logo Display */}
            {selectedItem.logoUrl && (
              <div className="flex justify-center">
                <img
                  src={selectedItem.logoUrl}
                  alt={`${selectedItem.companyName} logo`}
                  className="w-24 h-24 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.companyName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Industry</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.industry || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company Size</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.companySize || "-"}</p>
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

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Website</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedItem.website ? (
                      <a
                        href={selectedItem.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {selectedItem.website}
                      </a>
                    ) : "-"}
                  </p>
                </div>
              </div>
            </div>

            {selectedItem.address && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedItem.address}</p>
              </div>
            )}

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
        selectedItem={selectedItem ? selectedItem.companyName : ""}
      />
    </div>
  );
};

export default CompanyManagement;
