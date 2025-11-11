import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DeleteModal from "@/components/model/DeleteModal";
import { AddModal } from "@/components/model/AddModel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {  post, put, get, del } from "@/services/apiService";
import CommonTable, {
  ColumnConfig,
} from "@/components/ui/data-display/CommonTable";
import { EditModal } from "@/components/model/EditModel";
import { exportData, importDataFromFile } from "@/utils/exportImportUtils";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { z } from "zod";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValidationWrapper } from "../ui/data-display/FormValidationWrapper";
import { InputWithError } from "../ui/form-fields/InputWithError";
import { SelectWithError } from "../ui/form-fields/SelectWithError";
import { TextareaWithError } from "../ui/form-fields/TextareaWithError";

const listValueSchema = z.object({
  key: z.string().min(1, "Key is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  isTableBased: z.boolean(),
  tableName: z.string().optional(),
  values: z.array(
    z.object({
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
      value: z.string().min(1, "Value is required"),
    })
  ).optional()
}).superRefine((data, ctx) => {
  if (data.isTableBased) {
    if (!data.tableName || data.tableName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Table name is required for table-based values",
        path: ["tableName"]
      });
    }
  } else {
    if (!data.values || data.values.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one value is required for non-table-based values",
        path: ["values"]
      });
    }
  }
});

type ListValueFormData = z.infer<typeof listValueSchema>;

interface ListValue {
  id?: string;
  key: string;
  description: string;
  values?: Array<{
    code: string;
    name: string;
    value: string;
  }>;
  status: "ACTIVE" | "INACTIVE";
  isTableBased: boolean;
  tableName?: string;
}

const ListValueComponent = () => {
  const { toast } = useToast();
  const [data, setData] = useState<ListValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListValue | null>(null);

  // Form refs
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();

  const getDefaultFormData = (): ListValueFormData => ({
    key: '',
    description: '',
    status: 'ACTIVE',
    isTableBased: false,
    tableName: '',
    values: [{ code: '', name: '', value: '' }]
  });

  // Helper function to transform selectedItem to form data
  const getEditFormData = (item: ListValue | null): ListValueFormData => {
    if (!item) return getDefaultFormData();
    
    return {
      key: item.key || '',
      description: item.description || '',
      status: item.status,
      isTableBased: item.isTableBased,
      tableName: item.tableName || '',
      values: item.isTableBased ? [] : (item.values || [{ code: '', name: '', value: '' }])
    };
  };

  // Column configuration
  const columnConfig: ColumnConfig[] = useMemo(
    () => [
      {
        title: "Key",
        key: "key",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Description",
        key: "description",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Type",
        key: "isTableBased",
        dataType: "boolean",
        sortable: true,
      },
      {
        title: "Status",
        key: "status",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["ACTIVE", "INACTIVE"],
      },
      {
        title: "Actions",
        key: "actions",
        dataType: "action",
        actions: {
          view: false,
          edit: true,
          delete: true,
        },
      },
    ],
    []
  );

  // Fetch all data
  const fetchListValues = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await get("/api/v1/list-values/all")) as ListValue[];
      setData(response);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch list values",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchListValues();
  }, [fetchListValues]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: ListValue) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((item: ListValue) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await del(`/api/v1/list-values/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `List value ${selectedItem.key} deleted successfully`,
        variant: "success",
      });
      fetchListValues();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete list value",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  }, [selectedItem, fetchListValues, toast]);

  const handleSaveAdd = useCallback(async (formData: ListValueFormData) => {
    setIsSubmitting(true);
    try {
      // Base payload structure
      const payload: ListValue = {
        key: formData.key.trim(),
        description: formData.description.trim(),
        status: formData.status,
        isTableBased: formData.isTableBased,
      };

      // Add conditional fields based on isTableBased
      if (formData.isTableBased) {
        payload.tableName = formData.tableName?.trim();
        // Don't include values for table-based entries
      } else {
        payload.values = formData.values?.map(v => ({
          code: v.code.trim(),
          name: v.name.trim(),
          value: v.value.trim()
        }));
        // Don't include tableName for value-based entries
      }

      console.log('Payload being sent:', payload); // Debug log

      await post("/api/v1/list-values", payload);
      toast({
        title: "Success",
        description: `List value ${formData.key} added successfully`,
        variant: "success",
      });
      fetchListValues();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Save error:', error); // Debug log
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add list value",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchListValues, toast]);

  const handleSaveEdit = useCallback(async (formData: ListValueFormData) => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      // Base payload structure
      const payload: ListValue = {
        key: formData.key.trim(),
        description: formData.description.trim(),
        status: formData.status,
        isTableBased: formData.isTableBased,
      };

      // Add conditional fields based on isTableBased
      if (formData.isTableBased) {
        payload.tableName = formData.tableName?.trim();
        // Don't include values for table-based entries
      } else {
        payload.values = formData.values?.map(v => ({
          code: v.code.trim(),
          name: v.name.trim(),
          value: v.value.trim()
        }));
        // Don't include tableName for value-based entries
      }

      console.log('Payload being sent:', payload); // Debug log

      await put(`/api/v1/list-values/${selectedItem.id}`, payload);
      toast({
        title: "Success",
        description: `List value ${formData.key} updated successfully`,
        variant: "success",
      });
      fetchListValues();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Save error:', error); // Debug log
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update list value",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItem, fetchListValues, toast]);

  const handleRefresh = useCallback(() => {
    fetchListValues();
  }, [fetchListValues]);

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

  // Value array handlers with proper form methods
  const handleAddValue = useCallback((methods: UseFormReturn<ListValueFormData>) => {
    const currentValues = methods.getValues('values') || [];
    methods.setValue('values', [...currentValues, { code: '', name: '', value: '' }], { shouldValidate: true });
  }, []);

  const handleRemoveValue = useCallback((methods: UseFormReturn<ListValueFormData>, index: number) => {
    const currentValues = methods.getValues('values') || [];
    if (currentValues.length > 1) {
      const newValues = currentValues.filter((_, i) => i !== index);
      methods.setValue('values', newValues, { shouldValidate: true });
    }
  }, []);

  // Handle isTableBased toggle with proper form state management
  const handleTableBasedChange = useCallback((
    checked: boolean, 
    methods: UseFormReturn<ListValueFormData>
  ) => {
    methods.setValue('isTableBased', checked, { shouldValidate: true });
    
    if (checked) {
      // Switching to table-based: clear values array
      methods.setValue('values', [], { shouldValidate: true });
      // Keep tableName if it exists
    } else {
      // Switching to value-based: clear tableName and ensure at least one value
      methods.setValue('tableName', '', { shouldValidate: true });
      const currentValues = methods.getValues('values') || [];
      if (currentValues.length === 0) {
        methods.setValue('values', [{ code: '', name: '', value: '' }], { shouldValidate: true });
      }
    }
    
    // Trigger validation
    methods.trigger();
  }, []);

  const importTemplate = useMemo(
    () => [
      {
        key: "EXAMPLE_KEY",
        description: "Example description",
        values: [{ code: "CODE1", name: "Name 1", value: "Value 1" }],
        status: "ACTIVE",
        isTableBased: false,
        tableName: ""
      },
    ],
    []
  );

  const handleExport = useCallback(() => {
    try {
      exportData(
        data,
        columnConfig,
        `list-values-${new Date().toISOString().split("T")[0]}`,
        "xlsx"
      );

      toast({
        title: "Export Successful",
        description: "Data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  }, [data, columnConfig, toast]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const importedData = await importDataFromFile(file);
      await post("/api/v1/list-values/bulk", importedData);
      toast({
        title: "Import Successful",
        description: `${importedData.length} records imported.`,
      });
      fetchListValues();
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
  }, [toast, fetchListValues]);

  // Form content component to reduce duplication
  const FormContent = ({ methods, isEdit = false }: { 
    methods: UseFormReturn<ListValueFormData>, 
    isEdit?: boolean 
  }) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Key*</Label>
          <Controller
            name="key"
            control={methods.control}
            render={({ field, fieldState }) => (
              <InputWithError
                {...field}
                placeholder="Enter unique key"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Status*</Label>
          <Controller
            name="status"
            control={methods.control}
            render={({ field, fieldState }) => (
              <SelectWithError
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
              >
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectWithError>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description*</Label>
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

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Controller
            name="isTableBased"
            control={methods.control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`isTableBased-${isEdit ? 'edit' : 'add'}`}
                  checked={field.value}
                  onChange={(e) => handleTableBasedChange(e.target.checked, methods)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor={`isTableBased-${isEdit ? 'edit' : 'add'}`}>Table Based</Label>
              </div>
            )}
          />
        </div>
      </div>

      {methods.watch('isTableBased') ? (
        <div className="space-y-2">
          <Label>Table Name*</Label>
          <Controller
            name="tableName"
            control={methods.control}
            render={({ field, fieldState }) => (
              <InputWithError
                {...field}
                placeholder="Enter table name"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Values*</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddValue(methods)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </Button>
          </div>

          <div className="space-y-2">
            {methods.watch('values')?.map((value, index) => (
              <div
                key={`value-${index}`}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-3">
                  <Controller
                    name={`values.${index}.code`}
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="Code"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="col-span-4">
                  <Controller
                    name={`values.${index}.name`}
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="Name"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="col-span-3">
                  <Controller
                    name={`values.${index}.value`}
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="Value"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveValue(methods, index)}
                    disabled={(methods.watch('values')?.length || 0) <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      <CommonTable
        title="List Values"
        description="Manage key-value pair configurations"
        data={data}
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
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        exportFileName="list-values"
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
        title="Add New List Value"
        description="Create a new key-value pair configuration"
        size="md"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={listValueSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => <FormContent methods={methods} />}
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
        title={`Edit ${selectedItem?.key || "List Value"}`}
        description="Update the key-value pair configuration"
        size="md"
        isLoading={isSubmitting}
      >
        {/* Key change: Use selectedItem as key to force re-render when item changes */}
        <FormValidationWrapper
          key={selectedItem?.id || 'edit-form'} // This forces re-render with new data
          schema={listValueSchema}
          defaultValues={getEditFormData(selectedItem)}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => <FormContent methods={methods} isEdit />}
        </FormValidationWrapper>
      </EditModal>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedItem={selectedItem?.key}
      />
    </div>
  );
};

export default ListValueComponent;