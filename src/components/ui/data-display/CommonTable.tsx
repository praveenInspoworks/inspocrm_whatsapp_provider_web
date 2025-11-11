/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "../use-toast";
import { exportData, importDataFromFile } from "@/utils/exportImportUtils";

// Helper function to get nested values
const getNestedValue = (obj: any, path: string) => {
  if (!path) return obj;
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

export interface ColumnConfig {
  title: string;
  key: string;

  dataType:
    | "string"
    | "date"
    | "currency"
    | "relation"
    | "status"
    | "boolean"
    | "action"
    | "number"
    | "badge"
    | "image"
    | "json"
    | "custom"
    | "file"
    | "enum"
    | "datetime";
  displayKey?: string; // For relation type to display a specific field
  sortable?: boolean;
  filter?: boolean;
  casing?: "capitalize" | "uppercase" | "lowercase";
  format?: string;
  currency?: string;
  relationPath?: string;
  relationKey?: string;
  options?: string[];
  actions?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean | ((row: any) => boolean);
  };
  badgeVariant?: string | ((value: string) => string);
  render?: (value: any, item?: any) => React.ReactNode;
}

export interface PaginationResponse {
  data: any[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface CommonTableProps {
  title: string;
  description: string;
  data?: any[]; // For client-side data
  fetchData?: (params: {
    page: number;
    size: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    filters?: any[];
    logicExpression?: string;
    searchTerm?: string; // Add searchTerm parameter
  }) => Promise<PaginationResponse>; // For server-side data
  columnConfig: ColumnConfig[];
  enableSearch?: boolean;
  enableFilter?: boolean;
  enableImport?: boolean;
  enableExport?: boolean;
  enableAdd?: boolean;
  enableRefresh?: boolean;
  enableSelection?: boolean;
  pageSize?: number;
  exportFileName?: string;
  importTemplate?: any[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onView?: (item: any) => void;
  onDelete?: (item: any) => void;
  onImport?: (file: File) => Promise<any[]> | void;
  onExport?: (fileType: 'csv' | 'xlsx') => void;
  onRefresh?: () => void;
  onSelectionChange?: (selectedIds: any[]) => void;
  loading?: boolean;
}

// Theme-aware status colors
const getStatusColor = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case "active":
      return "bg-success/20 text-success-foreground";
    case "inactive":
      return "bg-destructive/20 text-destructive-foreground";
    case "pending":
      return "bg-warning/20 text-warning-foreground";
    case "suspended":
      return "bg-orange-100/20 text-orange-800 dark:text-orange-200";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Button variants based on theme
const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export const CommonTable: React.FC<CommonTableProps> = ({
  title,
  description,
  data: clientData,
  fetchData,
  columnConfig,
  enableSearch = true,
  enableFilter = true,
  enableImport = false,
  enableExport = false,
  enableAdd = true,
  enableRefresh = true,
  enableSelection = false,
  pageSize = 10,
  exportFileName = "export",
  importTemplate = [],
  onAdd,
  onEdit,
  onView,
  onDelete,
  onImport,
  onExport,
  onRefresh,
  onSelectionChange,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "desc" | "asc";
  }>({
    key: null,
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<
    "csv" | "xlsx"
  >("csv");
  const [paginationData, setPaginationData] = useState<PaginationResponse>({
    data: [],
    page: 0,
    size: pageSize,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isServerSide = !!fetchData;
  const currentData = isServerSide ? paginationData.data : clientData || [];

  // Format cell values
  const formatCellValue = (value: any, column: ColumnConfig, item?: any) => {
    // Check if displayKey is available and get the display value instead
    if (column.displayKey && item) {
      const displayValue = getNestedValue(item, column.displayKey);
      if (
        displayValue !== null &&
        displayValue !== undefined &&
        displayValue !== ""
      ) {
        // Use display value for formatting but remove displayKey to prevent infinite recursion
        const { displayKey, ...columnWithoutDisplayKey } = column;
        return formatCellValue(
          displayValue,
          { ...columnWithoutDisplayKey, key: column.displayKey },
          item
        );
      }
    }

    if (value === null || value === undefined || value === "") return "-";

    try {
      switch (column.dataType) {
        case "string":
          if (typeof value !== "string") value = String(value);
          if (column.casing === "capitalize") {
            return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          } else if (column.casing === "uppercase") {
            return value.toUpperCase();
          } else if (column.casing === "lowercase") {
            return value.toLowerCase();
          }
          return value;

        case "date": {
          const date = new Date(value);
          if (isNaN(date.getTime())) return "-";
          if (column.format === "YYYY-MM-DD") {
            return date.toISOString().split("T")[0];
          } else if (column.format === "DD/MM/YYYY") {
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
          return date.toLocaleDateString();
        }

        case "currency": {
          const numValue = Number(value);
          if (isNaN(numValue)) return "-";
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: column.currency || "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(numValue);
        }

        case "number": {
          const numValue = Number(value);
          if (isNaN(numValue)) return "-";
          return numValue.toLocaleString();
        }

        case "relation":
          if (column.relationPath) {
            return getNestedValue(value, column.relationPath) || "-";
          }
          return value?.[column.relationKey || ""] || "-";

        case "status":
          if (column.key.toLowerCase().includes("status")) {
            return (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  value
                )}`}
              >
                {value}
              </span>
            );
          }
          return value;

        case "boolean":
          return value ? (
            <span className="text-green-500">True</span>
          ) : (
            <span className="text-red-500">False</span>
          );

        case "badge": {
          let variant;
          if (typeof column.badgeVariant === "function") {
            variant = column.badgeVariant(value);
          } else {
            variant = column.badgeVariant || "default";
          }
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium bg-${variant}/20 text-${variant}-foreground`}
            >
              {value}
            </span>
          );
        }

        case "custom":
          if (column.render) {
            return column.render(value, currentData);
          }
          return value;

        case "image":
          if (typeof value === "string" && value.startsWith("http")) {
            return (
              <img
                src={value}
                alt={column.title}
                className="w-10 h-10 object-cover rounded"
              />
            );
          }
          return "-";

        case "json":
          if (typeof value === "object") {
            return (
              <pre className="whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(value, null, 2)}
              </pre>
            );
          }
          return "-";

        default:
          return value;
      }
    } catch (error) {
      console.error("Error formatting cell value:", error);
      return "-";
    }
  };

  const buildSearchFilters = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim())
        return { filters: [], logicExpression: undefined };

      const searchableColumns = columnConfig.filter(
        (col) => col.dataType !== "action" && col.dataType !== "custom"
      );

      const searchFilters = searchableColumns
        .map((column) => {
          const searchTermTrimmed = searchTerm.trim();

          // Skip numeric fields if search term is not numeric
          if (
            isNumericField(column) &&
            !isNumericSearchTerm(searchTermTrimmed)
          ) {
            return null;
          }

          // Skip boolean fields if search term is not boolean
          if (
            isBooleanField(column) &&
            !isBooleanSearchTerm(searchTermTrimmed)
          ) {
            return null;
          }

          const { filterType, filterValue } = getFilterConfig(
            column,
            searchTermTrimmed
          );

          return {
            filterName: column.key,
            filterValue: filterValue,
            filterType: filterType,
          };
        })
        .filter(Boolean);

      if (searchFilters.length === 0) {
        return { filters: [], logicExpression: undefined };
      }

      const logicExpression = searchFilters
        .map((_, index) => `$${index}`)
        .join(" | ");

      return {
        filters: searchFilters,
        logicExpression,
      };
    },
    [columnConfig]
  );

  // Helper functions
  const isNumericField = (column: any) => {
    return (
      column.dataType === "number" ||
      column.key === "id" ||
      column.key.endsWith("Id") ||
      column.key.endsWith("_id")
    );
  };

  const isBooleanField = (column: any) => {
    return (
      column.dataType === "boolean" ||
      column.key === "active" ||
      column.key === "isActive" ||
      column.key === "enabled"
    );
  };

  const isNumericSearchTerm = (term: string) => {
    return !isNaN(Number(term)) && term !== "";
  };

  const isBooleanSearchTerm = (term: string) => {
    const lowerTerm = term.toLowerCase();
    return (
      lowerTerm === "true" ||
      lowerTerm === "false" ||
      lowerTerm === "yes" ||
      lowerTerm === "no" ||
      lowerTerm === "1" ||
      lowerTerm === "0"
    );
  };

  const getFilterConfig = (column: any, searchTerm: string) => {
    if (isNumericField(column)) {
      return {
        filterType: "equal",
        filterValue: Number(searchTerm),
      };
    } else if (isBooleanField(column)) {
      return {
        filterType: "equal",
        filterValue:
          searchTerm.toLowerCase() === "true" ||
          searchTerm === "1" ||
          searchTerm.toLowerCase() === "yes",
      };
    } else {
      return {
        filterType: "iContain",
        filterValue: searchTerm,
      };
    }
  };

  const fetchTableData = useCallback(async () => {
    if (!isServerSide) return;

    try {
      let apiFilters: any[] = [];
      let logicExpression: string | undefined = undefined;

      // Handle column filters
      const columnFilters = Object.entries(filters)
        .filter(([_, value]) => value && value !== "")
        .map(([key, value]) => ({
          filterName: key,
          filterValue: value,
          filterType: "equal",
        }));

      // Handle search
      const { filters: searchFilters, logicExpression: searchLogic } =
        buildSearchFilters(searchTerm);

      if (columnFilters.length > 0 && searchFilters.length > 0) {
        // Combine column filters and search filters
        // Column filters with AND logic: ($0 & $1 & ...)
        // Search filters with OR logic: ($X | $Y | ...)
        // Final logic: (column_filters) & (search_filters)

        apiFilters = [...columnFilters, ...searchFilters];

        const columnLogic = columnFilters
          .map((_, index) => `$${index}`)
          .join(" & ");

        const searchLogicAdjusted = searchFilters
          .map((_, index) => `$${columnFilters.length + index}`)
          .join(" | ");

        logicExpression = `(${columnLogic}) & (${searchLogicAdjusted})`;
      } else if (columnFilters.length > 0) {
        // Only column filters
        apiFilters = columnFilters;
        logicExpression = columnFilters
          .map((_, index) => `$${index}`)
          .join(" & ");
      } else if (searchFilters.length > 0) {
        // Only search filters
        apiFilters = searchFilters;
        logicExpression = searchLogic;
      }

      const params = {
        page: currentPage,
        size: pageSize,
        sortBy: sortConfig.key || "id",
        sortDirection: sortConfig.direction,
        filters: apiFilters.length > 0 ? apiFilters : undefined,
        logicExpression,
        searchTerm, // Also pass searchTerm for backend reference
      };

      // console.log("Fetching with params:", JSON.stringify(params, null, 2));

      const response = await fetchData(params);
      setPaginationData(response);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Set empty data structure to prevent undefined errors
      setPaginationData({
        data: [],
        page: 0,
        size: pageSize,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive",
      });
    }
  }, [
    currentPage,
    pageSize,
    sortConfig,
    filters,
    searchTerm,
    fetchData,
    isServerSide,
    buildSearchFilters,
  ]);

  // For client-side data processing (unchanged)
  const processedData = useMemo(() => {
    if (isServerSide) {
      // For server-side, return data as-is since filtering is done on server
      return Array.isArray(paginationData.data) ? paginationData.data : [];
    }

    // Client-side processing remains the same
    let filtered = [...(clientData || [])];

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        filtered = filtered.filter((item) => {
          const column = columnConfig.find((col) => col.key === key);
          if (!column) return true;

          let itemValue = getNestedValue(item, key);

          if (column.dataType === "relation" && column.relationPath) {
            itemValue = getNestedValue(item, column.relationPath);
          }

          if (column.dataType === "boolean") {
            const boolValue = itemValue ? "true" : "false";
            return boolValue === value;
          }

          if (column.dataType === "status" || column.options) {
            return String(itemValue).toLowerCase() === value.toLowerCase();
          }

          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply search
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        columnConfig.some((col) => {
          if (col.dataType === "action") return false;
          try {
            let value = getNestedValue(item, col.key);

            if (col.dataType === "relation" && col.relationPath) {
              value = getNestedValue(item, col.relationPath);
            }

            const formattedValue = formatCellValue(value, col);

            if (React.isValidElement(formattedValue)) {
              if (col.dataType === "status" || col.dataType === "boolean") {
                return String(value).toLowerCase().includes(searchLower);
              }
              return false;
            }

            return String(formattedValue).toLowerCase().includes(searchLower);
          } catch (error) {
            console.error("Error during search:", error);
            return false;
          }
        })
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const column = columnConfig.find((col) => col.key === sortConfig.key);
        let aValue = getNestedValue(a, sortConfig.key!);
        let bValue = getNestedValue(b, sortConfig.key!);

        if (column?.dataType === "relation" && column.relationPath) {
          aValue = getNestedValue(a, column.relationPath);
          bValue = getNestedValue(b, column.relationPath);
        }

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === "asc"
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    isServerSide,
    paginationData.data,
    clientData,
    searchTerm,
    filters,
    sortConfig,
    columnConfig,
  ]);

  // Update paginationInfo for both server-side and client-side
  const paginationInfo = useMemo(() => {
    if (isServerSide) {
      // For server-side, use the pagination data directly from API response
      return {
        totalPages: paginationData.totalPages || 0,
        totalRecords: paginationData.totalElements || 0,
        currentData: paginationData.data || [],
        hasNext: paginationData.hasNext || false,
        hasPrevious: paginationData.hasPrevious || false,
      };
    }

    // Client-side pagination
    const totalPages = Math.ceil(processedData.length / pageSize);
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      totalPages,
      totalRecords: processedData.length,
      currentData: processedData.slice(startIndex, endIndex),
      hasNext: currentPage < totalPages - 1,
      hasPrevious: currentPage > 0,
    };
  }, [isServerSide, paginationData, processedData, currentPage, pageSize]);

  // Fetch data when parameters change (server-side)
  useEffect(() => {
    if (isServerSide) {
      fetchTableData();
    }
  }, [fetchTableData, isServerSide]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [paginationInfo.currentData]);

  // Get unique filter options from data
  const getFilterOptions = (column: ColumnConfig) => {
    if (!column.filter) return [];

    if (column.options && column.options.length > 0) {
      return column.options;
    }

    const options = new Set<string>();
    const dataSource = isServerSide ? paginationData.data : clientData || [];

    dataSource.forEach((item) => {
      let value = getNestedValue(item, column.key);

      if (column.dataType === "relation" && column.relationPath) {
        value = getNestedValue(item, column.relationPath);
      }

      if (value != null && value !== "") {
        if (column.dataType === "boolean") {
          options.add(value ? "true" : "false");
        } else {
          options.add(String(value));
        }
      }
    });
    return Array.from(options).sort();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (column: ColumnConfig) => {
    if (
      !column.sortable ||
      column.dataType === "action" ||
      column.dataType === "custom"
    )
      return;

    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === column.key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }

    setSortConfig({ key: column.key, direction });
    setCurrentPage(0);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const toggleRowSelection = (row: any) => {
    const newSelectedRows = new Set(selectedRows);
    const rowId = row.id || JSON.stringify(row);

    const existingRow = Array.from(newSelectedRows).find(
      (r) =>
        (r.id && r.id === row.id) || JSON.stringify(r) === JSON.stringify(row)
    );

    if (existingRow) {
      newSelectedRows.delete(existingRow);
    } else {
      newSelectedRows.add(row);
    }

    setSelectedRows(newSelectedRows);
    setSelectAll(
      newSelectedRows.size === paginationInfo.currentData.length &&
        paginationInfo.currentData.length > 0
    );
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelectedRows));
    }
  };

  const toggleSelectAll = () => {
    if (selectAll || selectedRows.size === paginationInfo.currentData.length) {
      setSelectedRows(new Set());
      setSelectAll(false);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } else {
      const allRows = paginationInfo.currentData;
      setSelectedRows(new Set(allRows));
      setSelectAll(true);
      if (onSelectionChange) {
        onSelectionChange(allRows);
      }
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(
      paginationInfo.totalPages - 1,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Handle file import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importDataFromFile(file);
      if (onImport) {
        // await onImport(importedData);
      }
      toast({
        title: "Import Successful",
        description: `Found ${importedData.length} records in file`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Error processing file",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Generate comprehensive template data based on form data structure
  const generateTemplateData = useCallback(() => {
    const templateRows: any[] = [];

    // Check if we have any form data structure to work with
    if (!importTemplate || importTemplate.length === 0) {
      console.warn("No import template data available for template generation");
      return templateRows;
    }

    // Use the first row of importTemplate as the base structure
    const baseRow = importTemplate[0];
    if (!baseRow || typeof baseRow !== 'object') {
      console.warn("Invalid import template structure");
      return templateRows;
    }

    const sampleRow: any = {};

    // Generate sample data based on actual form field keys
    Object.keys(baseRow).forEach((key) => {
      const sampleValue = generateSampleValueFromKey(key, baseRow[key]);
      sampleRow[key] = sampleValue;
    });

    // Add the sample row to template
    templateRows.push(sampleRow);

    // Add additional sample rows for better template
    for (let i = 1; i <= 2; i++) {
      const additionalRow = { ...sampleRow };
      Object.keys(baseRow).forEach((key) => {
        // Generate variations for additional rows
        additionalRow[key] = generateVariationFromKey(key, sampleRow[key], i);
      });
      templateRows.push(additionalRow);
    }

    return templateRows;
  }, [importTemplate]);

  // Generate sample value from form data key
  const generateSampleValueFromKey = (key: string, currentValue?: any): any => {
    const keyLower = key.toLowerCase();

    // If we have a current value, try to infer the type from it
    if (
      currentValue !== undefined &&
      currentValue !== null &&
      currentValue !== ""
    ) {
      if (typeof currentValue === "number") {
        return generateNumberSampleFromKey(key);
      } else if (typeof currentValue === "boolean") {
        return true;
      } else if (
        currentValue instanceof Date ||
        (typeof currentValue === "string" && !isNaN(Date.parse(currentValue)))
      ) {
        return generateDateSampleFromKey(key);
      }
    }

    // Generate based on key patterns
    if (keyLower.includes("name")) {
      return `Sample ${key}`;
    } else if (keyLower.includes("code") || keyLower.includes("key")) {
      return `SC${Math.floor(Math.random() * 1000)}`;
    } else if (keyLower.includes("type")) {
      return "Standard";
    } else if (keyLower.includes("description")) {
      return `Sample description for ${key}`;
    } else if (keyLower.includes("email")) {
      return "sample@example.com";
    } else if (keyLower.includes("phone")) {
      return "+1-555-0123";
    } else if (keyLower.includes("address")) {
      return "123 Sample Street, City, State 12345";
    } else if (keyLower.includes("color")) {
      return "#FF5733";
    } else if (keyLower.includes("pantone")) {
      return "19-4052";
    } else if (keyLower.includes("hex")) {
      return "#FF5733";
    } else if (keyLower.includes("rgb")) {
      return "rgb(255, 87, 51)";
    } else if (keyLower.includes("status")) {
      return "ACTIVE";
    } else if (
      keyLower.includes("count") ||
      keyLower.includes("value") ||
      keyLower.includes("amount")
    ) {
      return generateNumberSampleFromKey(key);
    } else if (
      keyLower.includes("date") ||
      keyLower.includes("created") ||
      keyLower.includes("updated")
    ) {
      return generateDateSampleFromKey(key);
    } else {
      return `Sample ${key}`;
    }
  };

  // Generate number sample from key
  const generateNumberSampleFromKey = (key: string): number => {
    const keyLower = key.toLowerCase();

    if (keyLower.includes("id") || keyLower.includes("count")) {
      return Math.floor(Math.random() * 100) + 1;
    } else if (keyLower.includes("percentage") || keyLower.includes("rate")) {
      return Math.floor(Math.random() * 100);
    } else if (keyLower.includes("quantity") || keyLower.includes("qty")) {
      return Math.floor(Math.random() * 1000) + 1;
    } else if (
      keyLower.includes("price") ||
      keyLower.includes("cost") ||
      keyLower.includes("amount")
    ) {
      return Math.floor(Math.random() * 1000) + 10.99;
    } else if (keyLower.includes("weight") || keyLower.includes("mass")) {
      return Math.floor(Math.random() * 100) + 1.5;
    } else if (
      keyLower.includes("length") ||
      keyLower.includes("width") ||
      keyLower.includes("height")
    ) {
      return Math.floor(Math.random() * 200) + 10;
    } else if (
      keyLower.includes("metric") ||
      keyLower.includes("imperial") ||
      keyLower.includes("tex") ||
      keyLower.includes("denier")
    ) {
      return Math.floor(Math.random() * 100) + 5.5;
    } else if (keyLower.includes("ply")) {
      return Math.floor(Math.random() * 5) + 1;
    } else {
      return Math.floor(Math.random() * 100) + 1;
    }
  };

  // Generate date sample from key
  const generateDateSampleFromKey = (key: string): string => {
    const today = new Date();
    const keyLower = key.toLowerCase();

    if (keyLower.includes("created") || keyLower.includes("date")) {
      return today.toISOString().split('T')[0];
    } else if (keyLower.includes("updated") || keyLower.includes("modified")) {
      return today.toISOString().split('T')[0];
    } else if (keyLower.includes("expiry") || keyLower.includes("due")) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      return futureDate.toISOString().split('T')[0];
    } else {
      return today.toISOString().split('T')[0];
    }
  };

  // Generate variation from key
  const generateVariationFromKey = (
    key: string,
    originalValue: any,
    index: number
  ): any => {
    const keyLower = key.toLowerCase();

    if (typeof originalValue === "string") {
      if (keyLower.includes("name")) {
        return `Sample ${key} ${index + 1}`;
      } else if (keyLower.includes("code") || keyLower.includes("key")) {
        return `SC${Math.floor(Math.random() * 1000) + index * 10}`;
      } else if (keyLower.includes("status")) {
        const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
        return statuses[index % statuses.length];
      } else {
        return `${originalValue} ${index + 1}`;
      }
    } else if (typeof originalValue === "number") {
      return originalValue + index;
    } else if (typeof originalValue === "boolean") {
      return index % 2 === 0;
    } else if (
      keyLower.includes("date") ||
      keyLower.includes("created") ||
      keyLower.includes("updated")
    ) {
      const date = new Date(originalValue || new Date());
      date.setDate(date.getDate() + index);
      return date.toISOString().split('T')[0];
    } else {
      return originalValue;
    }
  };

  // Generate sample value based on column type (for backward compatibility)
  const generateSampleValue = (column: ColumnConfig): any => {
    switch (column.dataType) {
      case "string":
        return generateStringSample(column);
      case "number":
        return generateNumberSample(column);
      case "date":
        return generateDateSample(column);
      case "boolean":
        return true;
      case "status":
        return column.options?.[0] || "ACTIVE";
      case "currency":
        return 100.5;
      case "relation":
        return generateRelationSample(column);
      default:
        return generateStringSample(column);
    }
  };

  // Generate string sample based on column key
  const generateStringSample = (column: ColumnConfig): string => {
    const key = column.key.toLowerCase();

    if (key.includes("name")) {
      return `Sample ${column.title}`;
    } else if (key.includes("code")) {
      return `SC${Math.floor(Math.random() * 1000)}`;
    } else if (key.includes("type")) {
      return "Standard";
    } else if (key.includes("description")) {
      return `Sample description for ${column.title}`;
    } else if (key.includes("email")) {
      return "sample@example.com";
    } else if (key.includes("phone")) {
      return "+1-555-0123";
    } else if (key.includes("address")) {
      return "123 Sample Street, City, State 12345";
    } else if (key.includes("color")) {
      return "#FF5733";
    } else if (key.includes("pantone")) {
      return "19-4052";
    } else if (key.includes("hex")) {
      return "#FF5733";
    } else if (key.includes("rgb")) {
      return "rgb(255, 87, 51)";
    } else {
      return `Sample ${column.key}`;
    }
  };

  // Generate number sample
  const generateNumberSample = (column: ColumnConfig): number => {
    const key = column.key.toLowerCase();

    if (key.includes("id") || key.includes("count")) {
      return Math.floor(Math.random() * 100) + 1;
    } else if (key.includes("percentage") || key.includes("rate")) {
      return Math.floor(Math.random() * 100);
    } else if (key.includes("quantity") || key.includes("qty")) {
      return Math.floor(Math.random() * 1000) + 1;
    } else if (
      key.includes("price") ||
      key.includes("cost") ||
      key.includes("amount")
    ) {
      return Math.floor(Math.random() * 1000) + 10.99;
    } else if (key.includes("weight") || key.includes("mass")) {
      return Math.floor(Math.random() * 100) + 1.5;
    } else if (
      key.includes("length") ||
      key.includes("width") ||
      key.includes("height")
    ) {
      return Math.floor(Math.random() * 200) + 10;
    } else {
      return Math.floor(Math.random() * 100) + 1;
    }
  };

  // Generate date sample
  const generateDateSample = (column: ColumnConfig): string => {
    const today = new Date();
    const key = column.key.toLowerCase();

    if (key.includes("created") || key.includes("date")) {
      return today.toISOString().split('T')[0];
    } else if (key.includes("updated") || key.includes("modified")) {
      return today.toISOString().split('T')[0];
    } else if (key.includes("expiry") || key.includes("due")) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      return futureDate.toISOString().split('T')[0];
    } else {
      return today.toISOString().split('T')[0];
    }
  };

  // Generate relation sample
  const generateRelationSample = (column: ColumnConfig): any => {
    if (column.relationKey) {
      return `Sample ${column.relationKey}`;
    }
    return "Sample Relation";
  };

  // Generate variation for additional rows
  const generateVariationValue = (
    column: ColumnConfig,
    originalValue: any,
    index: number
  ): any => {
    switch (column.dataType) {
      case "string": {
        if (typeof originalValue === "string") {
          return originalValue.replace("Sample", `Sample ${index + 1}`);
        }
        return `Variation ${index + 1}`;
      }
      case "number": {
        if (typeof originalValue === "number") {
          return originalValue + index;
        }
        return index + 1;
      }
      case "boolean":
        return index % 2 === 0;
      case "status": {
        const statuses = column.options || ["ACTIVE", "INACTIVE", "SUSPENDED"];
        return statuses[index % statuses.length];
      }
      case "date": {
        const date = new Date(originalValue || new Date());
        date.setDate(date.getDate() + index);
        return date.toISOString().split('T')[0];
      }
      default:
        return originalValue;
    }
  };

  // Enhanced template download with comprehensive data
  const downloadTemplate = useCallback(async () => {
    try {
      // Generate comprehensive template data
      const templateData = generateTemplateData();

      // Check if we need multi-sheet export for parent-child relationships
      const hasParentChild = detectParentChildRelationships();

      if (hasParentChild) {
        // Create multi-sheet export for parent-child relationships
        await exportMultiSheetTemplate(templateData);
      } else {
        // Single sheet export
        await exportData(
          templateData,
          columnConfig,
          `${exportFileName}-template`,
          "xlsx"
        );
      }

      toast({
        title: "Template Downloaded",
        description: hasParentChild
          ? "Multi-sheet template downloaded as Excel"
          : "Template downloaded as Excel",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description:
          error instanceof Error ? error.message : "Error downloading template",
        variant: "destructive",
      });
    }
  }, [columnConfig, exportFileName, generateTemplateData]);

  // Detect if we need parent-child sheet structure
  const detectParentChildRelationships = useCallback(() => {
    // Look for common parent-child patterns in column keys
    const keys = columnConfig.map((col) => col.key.toLowerCase());

    // Common parent-child indicators
    const parentIndicators = ["parent", "master", "header", "main"];
    const childIndicators = ["child", "detail", "line", "item"];

    const hasParent = parentIndicators.some((indicator) =>
      keys.some((key) => key.includes(indicator))
    );
    const hasChild = childIndicators.some((indicator) =>
      keys.some((key) => key.includes(indicator))
    );

    return hasParent && hasChild;
  }, [columnConfig]);

  // Export multi-sheet template for parent-child relationships
  const exportMultiSheetTemplate = async (templateData: any[]) => {
    try {
      // Separate parent and child data based on column patterns
      const parentColumns = columnConfig.filter(
        (col) =>
          col.key.toLowerCase().includes("parent") ||
          col.key.toLowerCase().includes("master") ||
          col.key.toLowerCase().includes("header")
      );

      const childColumns = columnConfig.filter(
        (col) =>
          col.key.toLowerCase().includes("child") ||
          col.key.toLowerCase().includes("detail") ||
          col.key.toLowerCase().includes("line")
      );

      // Create parent sheet data
      const parentData = templateData.map((row) => {
        const parentRow: any = {};
        parentColumns.forEach((col) => {
          parentRow[col.key] = row[col.key];
        });
        return parentRow;
      });

      // Create child sheet data (related to parent)
      const childData = [];
      templateData.forEach((row, index) => {
        // Create 2-3 child records for each parent
        for (let i = 1; i <= 2; i++) {
          const childRow: any = {
            parent_id: `Parent_${index + 1}`,
            child_sequence: i,
          };

          childColumns.forEach((col) => {
            if (col.key !== "parent_id" && col.key !== "child_sequence") {
              childRow[col.key] = generateVariationValue(col, row[col.key], i);
            }
          });

          childData.push(childRow);
        }
      });

      // For now, export as separate sheets in Excel
      // Note: This would require a more sophisticated export utility that supports multiple sheets
      // For now, we'll export parent data and mention child data in description

      await exportData(
        parentData,
        parentColumns,
        `${exportFileName}-parent-template`,
        "xlsx"
      );

      toast({
        title: "Multi-Sheet Template",
        description:
          "Parent template downloaded. Child data structure: Use parent_id to link with child records",
      });
    } catch (error) {
      console.error("Error creating multi-sheet template:", error);
      throw error;
    }
  };

  // Handle export
  const handleExportClick = useCallback(async () => {
    try {
      if (isServerSide && onExport) {
        // For server-side, call the provided onExport function which handles backend API call
        await onExport(selectedExportFormat);
      } else {
        // For client-side, use the existing export utility
        const dataToExport = isServerSide ? paginationData.data : processedData;
        exportData(
          dataToExport,
          columnConfig,
          `${exportFileName}-${new Date().toISOString().split("T")[0]}`,
          selectedExportFormat
        );
        toast({
          title: "Export Successful",
          description: "Data exported successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  }, [
    isServerSide,
    onExport,
    paginationData.data,
    processedData,
    columnConfig,
    exportFileName,
    selectedExportFormat,
  ]);

  // Handle refresh
  const handleRefreshClick = useCallback(() => {
    setCurrentPage(0);
    setSearchTerm("");
    setFilters({});
    setSortConfig({ key: null, direction: "desc" });

    if (onRefresh) {
      onRefresh();
    } else if (isServerSide) {
      fetchTableData();
    }
  }, [onRefresh, isServerSide, fetchTableData]);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-primary-200">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
      />

      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            <div className="text-xs text-muted-foreground mt-1">
              {loading && <span className="ml-2 text-primary">Loading...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-card border-b border-border">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          {enableSearch && (
            <div className="flex-1 min-w-48 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search across all columns..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Dynamic Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {enableFilter &&
              columnConfig
                .filter(
                  (col) =>
                    col.filter &&
                    col.dataType !== "action" &&
                    col.dataType !== "custom"
                )
                .map((column) => {
                  const options = getFilterOptions(column);
                  if (options.length === 0) return null;

                  return (
                    <div key={column.key} className="relative">
                      <select
                        className="flex items-center px-3 py-2 border border-input rounded-lg hover:bg-accent hover:text-accent-foreground bg-background pr-8 min-w-28 text-sm"
                        value={filters[column.key] || ""}
                        onChange={(e) =>
                          handleFilterChange(column.key, e.target.value)
                        }
                      >
                        <option value="">All {column.title}</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {column.dataType === "boolean"
                              ? option === "true"
                                ? "Active"
                                : "Inactive"
                              : option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {enableImport && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${buttonVariants.outline}`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </button>
              </>
            )}

            {enableExport && (
              <div className="relative group">
                <button
                  onClick={handleExportClick}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${buttonVariants.outline}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>

                {/* Export format status */}
                <div className="absolute right-0 mt-1 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-10 hidden group-hover:block">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedExportFormat("csv");
                        handleExportClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        setSelectedExportFormat("xlsx");
                        handleExportClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={downloadTemplate}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-t border-gray-200"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>
            )}

            {enableAdd && (
              <button
                onClick={onAdd}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${buttonVariants.primary}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </button>
            )}

            {enableRefresh && (
              <button
                onClick={handleRefreshClick}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${buttonVariants.outline}`}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-card">
            <tr>
              {enableSelection && (
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate =
                            selectedRows.size > 0 && !selectAll;
                        }
                      }}
                    />
                  </div>
                </th>
              )}
              {columnConfig.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                    column.sortable && column.dataType !== "action"
                      ? "cursor-pointer hover:bg-accent select-none"
                      : ""
                  }`}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && column.dataType !== "action" && (
                      <div className="flex flex-col ml-1">
                        <ChevronUp
                          className={`w-3 h-3 -mb-1 ${
                            sortConfig.key === column.key &&
                            sortConfig.direction === "asc"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 ${
                            sortConfig.key === column.key &&
                            sortConfig.direction === "desc"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={columnConfig.length + (enableSelection ? 1 : 0)}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Loading...
                    </p>
                  </div>
                </td>
              </tr>
            ) : paginationInfo.currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columnConfig.length + (enableSelection ? 1 : 0)}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center">
                    <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No data found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginationInfo.currentData.map((item, index) => (
                <tr
                  key={item?.id || index}
                  className="hover:bg-accent/50 transition-colors"
                >
                  {enableSelection && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                          checked={Array.from(selectedRows).some(
                            (r) =>
                              (r.id && r.id === item.id) ||
                              JSON.stringify(r) === JSON.stringify(item)
                          )}
                          onChange={() => toggleRowSelection(item)}
                        />
                      </div>
                    </td>
                  )}
                  {columnConfig.map((column) => {
                    let cellValue = getNestedValue(item, column.key);

                    if (column.dataType === "relation" && column.relationPath) {
                      cellValue = getNestedValue(item, column.relationPath);
                    }

                    return (
                      <td
                        key={`${item?.id || index}-${column.key}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                      >
                        {column.dataType === "action" ? (
                          <div className="flex items-center space-x-2">
                            {column.actions?.view && (
                              <button
                                onClick={() => onView?.(item)}
                                className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10 transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {column.actions?.edit && (
                              <button
                                onClick={() => onEdit?.(item)}
                                className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {(() => {
                              // Handle both boolean and function for delete action
                              const shouldShowDelete =
                                typeof column.actions?.delete === 'function'
                                  ? column.actions.delete(item)
                                  : column.actions?.delete;

                              return shouldShowDelete ? (
                                <button
                                  onClick={() => onDelete?.(item)}
                                  className="text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : null;
                            })()}
                          </div>
                        ) : (
                          formatCellValue(cellValue, column, item)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="px-6 py-3 bg-background border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min(
                  currentPage * pageSize + 1,
                  paginationInfo.totalRecords
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(
                  (currentPage + 1) * pageSize,
                  paginationInfo.totalRecords
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {paginationInfo.totalRecords}
              </span>{" "}
              results
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
                className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {page + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= paginationInfo.totalPages - 1}
                className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(paginationInfo.totalPages - 1)}
                disabled={currentPage >= paginationInfo.totalPages - 1}
                className="p-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {currentPage + 1}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {paginationInfo.totalPages}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonTable;
