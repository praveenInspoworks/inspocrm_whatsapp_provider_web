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

const aiSettingsSchema = z.object({
  aiModel: z
    .string()
    .min(1, "AI model is required")
    .max(100, "AI model must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "AI model can only contain letters, numbers, spaces, hyphens, underscores, and dots")
    .transform((val) => val.trim()),
  apiKey: z
    .string()
    .min(10, "API key must be at least 10 characters")
    .max(500, "API key must be less than 500 characters")
    .transform((val) => val.trim()),
  apiUrl: z
    .string()
    .min(1, "API URL is required")
    .max(500, "API URL must be less than 500 characters")
    .url("API URL must be a valid URL")
    .transform((val) => val.trim()),
  provider: z
    .string()
    .max(100, "Provider must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim()),
  isDefault: z.boolean().default(false),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .transform((val) => val?.trim()),
});

type AISettingsFormData = z.infer<typeof aiSettingsSchema>;

export const AISettingsManagement = () => {
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

  const getDefaultFormData = (): AISettingsFormData => ({
    aiModel: "",
    apiKey: "",
    apiUrl: "",
    provider: "",
    isDefault: false,
    description: "",
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
        title: "AI Model",
        key: "aiModel",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Provider",
        key: "provider",
        dataType: "string",
        sortable: true,
        render: (value: string) => value || "-",
      },
      {
        title: "API URL",
        key: "apiUrl",
        dataType: "string",
        sortable: false,
        render: (value: string) => (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        ),
      },

      {
        title: "Default",
        key: "isDefault",
        dataType: "boolean",
        sortable: true,
        render: (value: boolean) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}>
            {value ? "Yes" : "No"}
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
  const fetchAISettings = useCallback(
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
        const response = await apiService.post("/api/v1/ai-settings/search", {
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
          description: "Failed to fetch AI settings",
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
      await apiService.delete(`/api/v1/ai-settings/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `AI settings for ${selectedItem.aiModel} deleted successfully`,
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
    async (data: AISettingsFormData) => {
      setIsSubmitting(true);
      try {
        await apiService.post("/api/v1/ai-settings", data);
        toast({
          title: "Success",
          description: "AI settings created successfully",
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
    async (data: AISettingsFormData) => {
      setIsSubmitting(true);
      try {
        await apiService.put(`/api/v1/ai-settings/${selectedItem.id}`, data);
        toast({
          title: "Success",
          description: "AI settings updated successfully",
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
      const response = await apiService.get(`/api/v1/ai-settings/export`, {
        params: { fileType },
        responseType: 'blob',
      }) as any;

      const blobData = response.data || response;
      if (blobData && blobData instanceof Blob && blobData.size > 0) {
        const contentDisposition = response.headers?.['content-disposition'];
        let filename = `ai-settings-export-${Date.now()}.${fileType}`;

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
        aiModel: "gpt-4",
        apiKey: "sk-your-api-key-here",
        apiUrl: "https://api.openai.com/v1",
        provider: "OpenAI",
        isDefault: true,
        description: "OpenAI GPT-4 model configuration",
      },
      {
        aiModel: "claude-3",
        apiKey: "sk-ant-your-api-key-here",
        apiUrl: "https://api.anthropic.com",
        provider: "Anthropic",
        isDefault: false,
        description: "Anthropic Claude-3 model configuration",
      },
    ],
    []
  );

  // Import handler
  const handleImport = useCallback(
    async (file: File) => {
      try {
        const importedData = await importDataFromFile(file);
        await apiService.post("/api/v1/ai-settings/bulk", importedData);
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
        title="AI Settings Management"
        description="Manage AI model configurations and API settings"
        fetchData={fetchAISettings}
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
        exportFileName="ai-settings"
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
        title="Add New AI Settings"
        description="Fill in the details for the new AI configuration"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={aiSettingsSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="aiModel">AI Model <span className="text-red-500">*</span></Label>
                  <Controller
                    name="aiModel"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="aiModel"
                        {...field}
                        placeholder="Enter AI model name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Controller
                    name="provider"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="provider"
                        {...field}
                        placeholder="Enter provider name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="apiUrl">API URL <span className="text-red-500">*</span></Label>
                  <Controller
                    name="apiUrl"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="apiUrl"
                        {...field}
                        placeholder="Enter API URL"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="apiKey">API Key <span className="text-red-500">*</span></Label>
                  <Controller
                    name="apiKey"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="apiKey"
                        type="password"
                        {...field}
                        placeholder="Enter API key"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isDefault">Set as Default</Label>
                  <Controller
                    name="isDefault"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(value === "true")}
                        error={fieldState.error?.message}
                        placeholder="Select default option"
                      >
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
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
                        placeholder="Enter description"
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
        title={`Edit ${selectedItem ? selectedItem.aiModel : "AI Settings"}`}
        description="Update the AI settings details below"
        size="lg"
        isLoading={isSubmitting}
      >
        <FormValidationWrapper
          schema={aiSettingsSchema}
          defaultValues={{
            aiModel: selectedItem?.aiModel || "",
            apiKey: selectedItem?.apiKey || "",
            apiUrl: selectedItem?.apiUrl || "",
            provider: selectedItem?.provider || "",
            isDefault: selectedItem?.isDefault || false,
            description: selectedItem?.description || "",
          }}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => (
            <div className="px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-aiModel">AI Model <span className="text-red-500">*</span></Label>
                  <Controller
                    name="aiModel"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-aiModel"
                        {...field}
                        placeholder="Enter AI model name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-provider">Provider</Label>
                  <Controller
                    name="provider"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-provider"
                        {...field}
                        placeholder="Enter provider name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-apiUrl">API URL <span className="text-red-500">*</span></Label>
                  <Controller
                    name="apiUrl"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-apiUrl"
                        {...field}
                        placeholder="Enter API URL"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-apiKey">API Key <span className="text-red-500">*</span></Label>
                  <Controller
                    name="apiKey"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        id="edit-apiKey"
                        type="password"
                        {...field}
                        placeholder="Enter API key"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-isDefault">Set as Default</Label>
                  <Controller
                    name="isDefault"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value ? "true" : "false"}
                        onValueChange={(value) => field.onChange(value === "true")}
                        error={fieldState.error?.message}
                        placeholder="Select default option"
                      >
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
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
                        placeholder="Enter description"
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
        title={`View ${selectedItem ? selectedItem.aiModel : "AI Settings"}`}
        description="Complete AI settings details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">AI Model</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.aiModel}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Provider</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.provider || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Default</Label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedItem.isDefault
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {selectedItem.isDefault ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">API URL</Label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{selectedItem.apiUrl}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">API Key</Label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {selectedItem.apiKey ? "••••••••" + selectedItem.apiKey.slice(-4) : "-"}
                  </p>
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
        selectedItem={selectedItem ? selectedItem.aiModel : ""}
      />
    </div>
  );
};

export default AISettingsManagement;
