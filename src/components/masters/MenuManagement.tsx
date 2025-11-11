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
import { post, put, get, del } from "@/services/apiService";
import CommonTable, {
  ColumnConfig,
} from "@/components/ui/data-display/CommonTable";
import { EditModal } from "@/components/model/EditModel";
import { exportData, importDataFromFile } from "@/utils/exportImportUtils";
import { z } from "zod";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValidationWrapper } from "../ui/data-display/FormValidationWrapper";
import { InputWithError } from "../ui/form-fields/InputWithError";
import { SelectWithError } from "../ui/form-fields/SelectWithError";

// Define the schema for form validation
const menuSchema = z.object({
  menuCode: z.string().min(1, "Menu Code is required"),
  menuName: z.string().min(1, "Menu Name is required"),
  icon: z.string().min(1, "Icon is required"),
  sortOrder: z.number().min(0, "Sort Order must be positive"),
  status: z.enum(["ACTIVE", "DEACTIVE", "SUSPEND"])
});

type MenuFormData = z.infer<typeof menuSchema>;

interface Menu {
  id: string;
  menuCode: string;
  menuName: string;
  icon: string;
  sortOrder: number;
  status: "ACTIVE" | "DEACTIVE" | "SUSPEND";
  createdAt?: string;
  updatedAt?: string;
}

const MenuManagement = () => {
  const { toast } = useToast();
  const [data, setData] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Menu | null>(null);

  // Form refs
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();

  const getDefaultFormData = (): MenuFormData => ({
    menuCode: "",
    menuName: "",
    icon: "",
    sortOrder: 0,
    status: "ACTIVE"
  });

  // Column configuration
  const columnConfig: ColumnConfig[] = useMemo(
    () => [
      {
        title: "Menu Code",
        key: "menuCode",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Menu Name",
        key: "menuName",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Icon",
        key: "icon",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Sort Order",
        key: "sortOrder",
        dataType: "number",
        sortable: true,
      },
      {
        title: "Status",
        key: "status",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["ACTIVE", "DEACTIVE", "SUSPEND"],
        render: (value: "ACTIVE" | "DEACTIVE" | "SUSPEND") => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "ACTIVE" ? "bg-green-100 text-green-800" :
            value === "DEACTIVE" ? "bg-blue-100 text-blue-800" :
            "bg-yellow-100 text-yellow-800"
          }`}>
            {value === "ACTIVE" ? "Active" : value === "DEACTIVE" ? "Deactive" : "Suspended"}
          </span>
        ),
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

  // Fetch all data from platform schema
  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await get("/api/v1/menus/all")) as any;
      setData(response);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch menus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: Menu) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((item: Menu) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await del(`/api/v1/menus/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `Menu ${selectedItem.menuName} deleted successfully`,
        variant: "success",
      });
      fetchMenus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  }, [selectedItem, fetchMenus, toast]);

  const handleSaveAdd = useCallback(async (formData: MenuFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        menuCode: formData.menuCode.trim().toUpperCase().replace(/\s+/g, '_'),
        menuName: formData.menuName.trim(),
        icon: formData.icon.trim(),
        sortOrder: formData.sortOrder,
        status: formData.status
      };

      await post("/api/v1/menus", payload);
      toast({
        title: "Success",
        description: `Menu ${formData.menuName} added successfully`,
        variant: "success",
      });
      fetchMenus();
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add menu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchMenus, toast]);

  const handleSaveEdit = useCallback(async (formData: MenuFormData) => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const payload = {
        menuCode: formData.menuCode.trim().toUpperCase().replace(/\s+/g, '_'),
        menuName: formData.menuName.trim(),
        icon: formData.icon.trim(),
        sortOrder: formData.sortOrder,
        status: formData.status
      };

      await put(`/api/v1/menus/${selectedItem.id}`, payload);
      toast({
        title: "Success",
        description: `Menu ${formData.menuName} updated successfully`,
        variant: "success",
      });
      fetchMenus();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update menu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItem, fetchMenus, toast]);

  const handleRefresh = useCallback(() => {
    fetchMenus();
  }, [fetchMenus]);

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
        menuCode: "MAIN_NAV",
        menuName: "Main Navigation",
        icon: "layout",
        sortOrder: 1,
        status: "ACTIVE",
      },
      {
        menuCode: "SALES",
        menuName: "Sales",
        icon: "dollar-sign",
        sortOrder: 2,
        status: "ACTIVE",
      },
    ],
    []
  );

  const handleExport = useCallback(() => {
    try {
      exportData(
        data,
        columnConfig,
        `menus-${new Date().toISOString().split("T")[0]}`,
        "xlsx"
      );

      toast({
        title: "Export Successful",
        description: "Menus exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export menus",
        variant: "destructive",
      });
    }
  }, [data, columnConfig, toast]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const importedData = await importDataFromFile(file);

      // Import items one by one since bulk endpoint doesn't exist
      let successCount = 0;
      for (const item of importedData) {
        try {
          const payload = {
            menuCode: item.menuCode.trim().toUpperCase().replace(/\s+/g, '_'),
            menuName: item.menuName.trim(),
            icon: item.icon.trim(),
            sortOrder: item.sortOrder || 0,
            status: item.status || "ACTIVE"
          };
          await post("/api/v1/menus", payload);
          successCount++;
        } catch (itemError) {
          console.error(`Failed to import menu ${item.menuName}:`, itemError);
        }
      }

      toast({
        title: "Import Completed",
        description: `${successCount} of ${importedData.length} menus imported successfully.`,
      });
      fetchMenus();
      return importedData;
    } catch (error) {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to import menus",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, fetchMenus]);

  return (
    <div className="p-6 bg-white min-h-screen">
      <CommonTable
        title="Menu Management"
        description="Manage menu groups and their display order"
        data={data}
        columnConfig={columnConfig}
        enableSearch={true}
        enableFilter={true}
        enableImport={false}
        enableExport={false}
        enableAdd={true}
        enableRefresh={true}
        pageSize={10}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        exportFileName="menus"
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
        title="Add New Menu"
        description="Create a new menu group"
        size="md"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={menuSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Menu Code*</Label>
                  <Controller
                    name="menuCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. MAIN_NAV"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Menu Name*</Label>
                  <Controller
                    name="menuName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. Main Navigation"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon*</Label>
                  <Controller
                    name="icon"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. layout"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Controller
                    name="sortOrder"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        type="number"
                        placeholder="0"
                        error={fieldState.error?.message}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
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
                      <SelectItem value="DEACTIVE">Deactive</SelectItem>
                      <SelectItem value="SUSPEND">Suspend</SelectItem>
                    </SelectWithError>
                  )}
                />
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
        title={`Edit ${selectedItem?.menuName || "Menu"}`}
        description="Update the menu details"
        size="md"
        isLoading={isSubmitting}
      >
        <FormValidationWrapper
          schema={menuSchema}
          defaultValues={{
            menuCode: selectedItem?.menuCode || '',
            menuName: selectedItem?.menuName || '',
            icon: selectedItem?.icon || '',
            sortOrder: selectedItem?.sortOrder || 0,
            status: selectedItem?.status || 'ACTIVE'
          }}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Menu Code*</Label>
                  <Controller
                    name="menuCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. MAIN_NAV"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Menu Name*</Label>
                  <Controller
                    name="menuName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. Main Navigation"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon*</Label>
                  <Controller
                    name="icon"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. layout"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Controller
                    name="sortOrder"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        type="number"
                        placeholder="0"
                        error={fieldState.error?.message}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
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
                      <SelectItem value="DEACTIVE">Deactive</SelectItem>
                      <SelectItem value="SUSPEND">Suspend</SelectItem>
                    </SelectWithError>
                  )}
                />
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
        selectedItem={selectedItem?.menuName}
      />
    </div>
  );
};

export default MenuManagement;
