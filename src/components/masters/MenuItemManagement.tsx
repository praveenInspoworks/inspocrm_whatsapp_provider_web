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
import { ListValueDropdownWrapper } from "../ui/form-fields/ListValueDropdownWrapper";

// Define the schema for form validation
const menuItemSchema = z.object({
  itemCode: z.string().min(1, "Item Code is required"),
  itemName: z.string().min(1, "Item Name is required"),
  itemType: z.enum(["LINK", "MODULE", "SECTION"]),
  url: z.string(),
  icon: z.string().min(1, "Icon is required"),
  sortOrder: z.number().min(0, "Sort Order must be positive"),
  requiresPermission: z.string(),
  parentId: z.string().nullable(),
  menuId: z.string().min(1, "Menu is required"),
  status: z.enum(["ACTIVE", "DEACTIVE", "SUSPEND"]),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: "LINK" | "MODULE" | "SECTION";
  url: string | null;
  icon: string;
  sortOrder: number;
  requiresPermission: string | null;
  parentId: string | null;
  menuId: string | null;
  status: "ACTIVE" | "SUSPEND";
  createdAt?: string;
  updatedAt?: string;
}

interface Menu {
  id: string;
  menuCode: string;
  menuName: string;
  icon: string;
  sortOrder: number;
  status: "ACTIVE" | "SUSPEND";
}

const MenuItemManagement = () => {
  const { toast } = useToast();
  const [data, setData] = useState<MenuItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form refs
  const addFormSubmitRef = useRef<() => void>();
  const editFormSubmitRef = useRef<() => void>();

  const getDefaultFormData = (): MenuItemFormData => ({
    itemCode: "",
    itemName: "",
    itemType: "LINK",
    url: "",
    icon: "",
    sortOrder: 0,
    requiresPermission: "",
    parentId: null,
    menuId: "",
    status: "ACTIVE",
  });

  // Column configuration
  const columnConfig: ColumnConfig[] = useMemo(
    () => [
      {
        title: "Item Code",
        key: "itemCode",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Item Name",
        key: "itemName",
        dataType: "string",
        sortable: true,
      },
      {
        title: "Menu",
        key: "menuId",
        dataType: "number",
        sortable: true,
      },
      {
        title: "Type",
        key: "itemType",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["LINK", "MODULE", "SECTION"],
      },
      {
        title: "Icon",
        key: "icon",
        dataType: "string",
        sortable: true,
      },
      {
        title: "URL",
        key: "url",
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
        title: "Parent Menu Item",
        key: "parentId",
        dataType: "custom",
        render: (record: MenuItem, allItems: MenuItem[]) => {
          if (!record.parentId) return <span>None</span>;
          const parent = allItems.find(
            (parentItem) => String(parentItem.id) === String(record.parentId)
          );
          return <span>{parent?.itemName || "None"}</span>;
        },
        sortable: true,
      },
      {
        title: "Status",
        key: "status",
        dataType: "status",
        sortable: true,
        filter: true,
        options: ["ACTIVE", "SUSPEND"],
        render: (value: "ACTIVE" | "SUSPEND") => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {value === "ACTIVE" ? "Active" : "Suspended"}
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
    [menus]
  );

  // Fetch all menu items from platform schema
  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await get("/api/v1/menus/items")) as MenuItem[];
      setData(response);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch all menus for dropdown
  const fetchMenus = useCallback(async () => {
    try {
      const response = (await get("/api/v1/menus/groups")) as Menu[];
      setMenus(response);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch menus",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchMenuItems();
    fetchMenus();
  }, [fetchMenuItems, fetchMenus]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await del(`/api/v1/menus/items/${selectedItem.id}`);
      toast({
        title: "Success",
        description: `Menu item ${selectedItem.itemName} deleted successfully`,
        variant: "success",
      });
      fetchMenuItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  }, [selectedItem, fetchMenuItems, toast]);

  const handleSaveAdd = useCallback(
    async (formData: MenuItemFormData) => {
      setIsSubmitting(true);
      try {
        const payload = {
          itemCode: formData.itemCode.trim().toUpperCase().replace(/\s+/g, '_'),
          itemName: formData.itemName.trim(),
          itemType: formData.itemType,
          url: formData.url?.trim() || null,
          icon: formData.icon.trim(),
          sortOrder: formData.sortOrder,
          requiresPermission: formData.requiresPermission?.trim() || null,
          parentId: formData.parentId || null,
          menuId: formData.menuId.trim(),
          status: formData.status,
        };

        await post("/api/v1/menus/items", payload);
        toast({
          title: "Success",
          description: `Menu item ${formData.itemName} added successfully`,
          variant: "success",
        });
        fetchMenuItems();
        setIsAddModalOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to add menu item",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchMenuItems, toast]
  );

  const handleSaveEdit = useCallback(
    async (formData: MenuItemFormData) => {
      if (!selectedItem) return;

      setIsSubmitting(true);
      try {
        const payload = {
          itemName: formData.itemName.trim(),
          itemType: formData.itemType,
          url: formData.url?.trim() || null,
          icon: formData.icon.trim(),
          sortOrder: formData.sortOrder,
          requiresPermission: formData.requiresPermission?.trim() || null,
          parentId: formData.parentId || null,
          menuId: formData.menuId.trim(),
          status: formData.status,
        };

        await put(`/api/v1/menus/items/${selectedItem.id}`, payload);
        toast({
          title: "Success",
          description: `Menu item ${formData.itemName} updated successfully`,
          variant: "success",
        });
        fetchMenuItems();
        setIsEditModalOpen(false);
        setSelectedItem(null);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update menu item",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedItem, fetchMenuItems, toast]
  );

  const handleRefresh = useCallback(() => {
    fetchMenuItems();
    fetchMenus();
  }, [fetchMenuItems, fetchMenus]);

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
        itemCode: "DASHBOARD",
        itemName: "Dashboard",
        itemType: "LINK",
        url: "/dashboard",
        icon: "layout-dashboard",
        sortOrder: 1,
        requiresPermission: null,
        parentId: null,
        menuId: "MAIN",
        status: "ACTIVE",
      },
      {
        itemCode: "CONTACTS",
        itemName: "Contacts",
        itemType: "LINK",
        url: "/contacts",
        icon: "users",
        sortOrder: 2,
        requiresPermission: "view_contacts",
        parentId: null,
        menuId: "MAIN",
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
        `menu-items-${new Date().toISOString().split("T")[0]}`,
        "xlsx"
      );

      toast({
        title: "Export Successful",
        description: "Menu items exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export menu items",
        variant: "destructive",
      });
    }
  }, [data, columnConfig, toast]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const importedData = await importDataFromFile(file);

        // Import items one by one since bulk endpoint doesn't exist
        let successCount = 0;
        for (const item of importedData) {
          try {
            const payload = {
              itemCode: item.itemCode.trim().toUpperCase().replace(/\s+/g, '_'),
              itemName: item.itemName.trim(),
              itemType: item.itemType || "LINK",
              url: item.url?.trim() || null,
              icon: item.icon.trim(),
              sortOrder: item.sortOrder || 0,
              requiresPermission: item.requiresPermission?.trim() || null,
              parentId: item.parentId || null,
              menuId: Number(item.menuId) || null,
              status: item.status || "ACTIVE",
            };
            await post("/api/v1/menus/items", payload);
            successCount++;
          } catch (itemError) {
            console.error(
              `Failed to import menu item ${item.itemName}:`,
              itemError
            );
          }
        }

        toast({
          title: "Import Completed",
          description: `${successCount} of ${importedData.length} menu items imported successfully.`,
        });
        fetchMenuItems();
        return importedData;
      } catch (error) {
        toast({
          title: "Import Failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to import menu items",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast, fetchMenuItems]
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      <CommonTable
        title="Menu Item Management"
        description="Manage navigation menu items and their hierarchy"
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
        exportFileName="menu-items"
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
        title="Add New Menu Item"
        description="Create a new menu item or submenu"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <FormValidationWrapper
          schema={menuItemSchema}
          defaultValues={getDefaultFormData()}
          onSubmit={handleSaveAdd}
          submitRef={addFormSubmitRef}
        >
          {(methods) => (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Code*</Label>
                  <Controller
                    name="itemCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. DASHBOARD"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item Name*</Label>
                  <Controller
                    name="itemName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. Dashboard"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Type*</Label>
                  <Controller
                    name="itemType"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                      >
                        <SelectItem value="LINK">Link</SelectItem>
                        <SelectItem value="MODULE">Module</SelectItem>
                        <SelectItem value="SECTION">Section</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon*</Label>
                  <Controller
                    name="icon"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. layout-dashboard"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Menu*</Label>
                <Controller
                  name="menuId"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <ListValueDropdownWrapper
                      listKey="MENUS"
                      value={field.value}
                      onValueChange={field.onChange}
                      error={fieldState.error?.message}
                      placeholder="Select a menu"
                     // useCodeAsValue={true}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Controller
                  name="url"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputWithError
                      {...field}
                      placeholder="e.g. /dashboard"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Permission</Label>
                  <Controller
                    name="requiresPermission"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. view_dashboard"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Parent Menu Item</Label>
                <Controller
                  name="parentId"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <SelectWithError
                      value={field.value || "null"}
                      onValueChange={(value) =>
                        field.onChange(value === "null" ? null : value)
                      }
                      error={fieldState.error?.message}
                    >
                      <SelectItem value="null">None (Top Level)</SelectItem>
                      {data
                        .filter((menuItem) => menuItem.id !== selectedItem?.id) // Prevent self-selection in edit mode
                        .map((menuItem) => {
                          // Find the menu name for better identification
                          const menu = menus.find(
                            (m) => String(m.id) === String(menuItem.menuId)
                          );
                          const menuName = menu ? menu.menuName : 'No Menu';

                          return (
                            <SelectItem key={menuItem.id} value={menuItem.id}>
                              {menuItem.itemName} - {menuName}
                            </SelectItem>
                          );
                        })}
                    </SelectWithError>
                  )}
                />
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
        title={`Edit ${selectedItem?.itemName || "Menu Item"}`}
        description="Update the menu item details"
        size="lg"
        isLoading={isSubmitting}
      >
        <FormValidationWrapper
          schema={menuItemSchema}
          defaultValues={{
            itemCode: selectedItem?.itemCode || '',
            itemName: selectedItem?.itemName || '',
            itemType: selectedItem?.itemType || 'LINK',
            url: selectedItem?.url || '',
            icon: selectedItem?.icon || '',
            sortOrder: selectedItem?.sortOrder || 0,
            requiresPermission: selectedItem?.requiresPermission || '',
            parentId: selectedItem?.parentId || null,
            menuId: selectedItem?.menuId.toString() || '',
            status: selectedItem?.status || 'ACTIVE',
          }}
          onSubmit={handleSaveEdit}
          submitRef={editFormSubmitRef}
        >
          {(methods) => (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Code*</Label>
                  <Controller
                    name="itemCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. DASHBOARD"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item Name*</Label>
                  <Controller
                    name="itemName"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. Dashboard"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Type*</Label>
                  <Controller
                    name="itemType"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={fieldState.error?.message}
                      >
                        <SelectItem value="LINK">Link</SelectItem>
                        <SelectItem value="MODULE">Module</SelectItem>
                        <SelectItem value="SECTION">Section</SelectItem>
                      </SelectWithError>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon*</Label>
                  <Controller
                    name="icon"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. layout-dashboard"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Menu*</Label>
                <Controller
                  name="menuId"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <ListValueDropdownWrapper
                      listKey="MENUS"
                      value={field.value}
                      onValueChange={field.onChange}
                      error={fieldState.error?.message}
                      placeholder="Select a menu"
                      //useCodeAsValue={true}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Controller
                  name="url"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <InputWithError
                      {...field}
                      placeholder="e.g. /dashboard"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Permission</Label>
                  <Controller
                    name="requiresPermission"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <InputWithError
                        {...field}
                        placeholder="e.g. view_dashboard"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Parent Menu Item</Label>
                <Controller
                  name="parentId"
                  control={methods.control}
                  render={({ field, fieldState }) => (
                    <SelectWithError
                      value={field.value || "null"}
                      onValueChange={(value) =>
                        field.onChange(value === "null" ? null : value)
                      }
                      error={fieldState.error?.message}
                    >
                      <SelectItem value="null">None (Top Level)</SelectItem>
                      {data
                        .filter((menuItem) => menuItem.id !== selectedItem?.id) // Prevent self-selection in edit mode
                        .map((menuItem) => {
                          // Find the menu name for better identification
                          const menu = menus.find(
                            (m) => String(m.id) === String(menuItem.menuId)
                          );
                          const menuName = menu ? menu.menuName : 'No Menu';

                          return (
                            <SelectItem key={menuItem.id} value={menuItem.id}>
                              {menuItem.itemName} - {menuName}
                            </SelectItem>
                          );
                        })}
                    </SelectWithError>
                  )}
                />
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
        selectedItem={selectedItem?.itemName}
      />
    </div>
  );
};

export default MenuItemManagement;
