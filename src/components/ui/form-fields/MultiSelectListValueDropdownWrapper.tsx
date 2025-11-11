/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { get } from "@/services/apiService";

interface ListValueItem {
  code: string;
  name: string;
  value?: string;
  description?: string;
  status?: string;
}

interface MultiSelectListValueDropdownWrapperProps {
  listKey: string;
  value?: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  parentCode?: string | null;
  showCode?: boolean;
  showDescription?: boolean;
  useCodeAsValue?: boolean;
  label?: string;
}

export const MultiSelectListValueDropdownWrapper = ({
  listKey,
  value = [],
  onValueChange,
  placeholder = "Select options",
  error,
  disabled = false,
  className = "",
  parentCode = null,
  showCode = false,
  showDescription = false,
  useCodeAsValue = false,
  label,
}: MultiSelectListValueDropdownWrapperProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<ListValueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchListValues = async () => {
      try {
        setLoading(true);
        let url = "";
        if (parentCode) {
          url = `/api/v1/list-values/${listKey}/items?parentCode=${encodeURIComponent(parentCode)}`;
        } else {
          url = `/api/v1/list-values/key/${listKey}`;
        }
        const response = (await get(url)) as any;
        let items = [];
        if (response?.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (response?.values) {
          if (typeof response.values === 'function') {
            items = Array.from(response.values());
          } else if (Array.isArray(response.values)) {
            items = response.values;
          } else {
            items = [];
          }
        } else if (Array.isArray(response)) {
          items = response;
        } else if (response && typeof response === 'object') {
          if (typeof response.values === 'function') {
            items = Array.from(response.values());
          } else if (typeof response.entries === 'function') {
            items = Array.from(response.entries()).map(([key, value]) => value);
          } else {
            const objectValues = Object.values(response);
            items = objectValues.find(val => Array.isArray(val)) || [];
          }
        } else {
          items = [];
        }
        if (Array.isArray(items)) {
          const activeItems = items.filter(item =>
            !item.status || item.status === 'ACTIVE' || item.status === 'active'
          );
          setOptions(activeItems);
        } else {
          setOptions([]);
        }
      } catch (error) {
        setOptions([]);
        if (error instanceof Error && !error.message.includes('404')) {
          toast({
            title: "Error",
            description: `Failed to fetch ${listKey} options: ${error.message}`,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (listKey && (parentCode === null || parentCode)) {
      fetchListValues();
    } else {
      setOptions([]);
      setLoading(false);
    }
  }, [listKey, parentCode, toast]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const getOptionLabel = (item: ListValueItem) => {
    return showCode && item.code ? `${item.code} - ${item.name}` : item.name;
  };

  const isDisabled = disabled || loading || (parentCode !== null && !parentCode);

  const selectedValues = Array.isArray(value) ? value : [];
  const handleMultiChange = (newValue: string) => {
    let updated: string[];
    if (selectedValues.includes(newValue)) {
      updated = selectedValues.filter(v => v !== newValue);
    } else {
      updated = [...selectedValues, newValue];
    }
    onValueChange(updated);
  };

  const clearAll = () => onValueChange([]);

return (
  <div className={`relative ${className}`} ref={dropdownRef}>
    {label && <label className="block mb-1 text-sm font-medium">{label}</label>}
    <div
      className={`border rounded-md px-3 py-2 bg-white cursor-pointer min-h-[40px] flex items-center justify-between ${isDisabled ? "bg-muted pointer-events-none opacity-60" : ""}`}
      onClick={() => !isDisabled && setOpen(!open)}
    >
      <span className="truncate text-gray-700">
        {selectedValues.length === 0
          ? placeholder
          : options
              .filter(item => selectedValues.includes(useCodeAsValue ? item.code : (item.value || item.code)))
              .map(item => getOptionLabel(item))
              .join(", ")
        }
      </span>
      <span className="ml-2">&#9662;</span>
    </div>
    {open && !isDisabled && (
      <div className="absolute z-50 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto w-full">
        {loading ? (
          <div className="p-2 text-sm text-gray-500">Loading...</div>
        ) : options.length === 0 ? (
          <div className="p-2 text-sm text-gray-500">No options available</div>
        ) : (
          options.map(item => {
            const itemValue = useCodeAsValue ? item.code : (item.value || item.code);
            const checked = selectedValues.includes(itemValue);
            return (
              <label
                key={`${listKey}-${item.code}-${item.value ?? ""}`}
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => {
                    e.stopPropagation();
                    handleMultiChange(itemValue);
                  }}
                  disabled={isDisabled}
                  className="mr-2"
                />
                {getOptionLabel(item)}
              </label>
            );
          })
        )}
        <div className="p-2 border-t flex justify-end">
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={e => {
              e.stopPropagation();
              clearAll();
            }}
            disabled={selectedValues.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>
    )}
    {/* Show selected as chips */}
  {selectedValues.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {selectedValues.map(val => {
      const item = options.find(
        item => (useCodeAsValue ? item.code : (item.value || item.code)) === val
      );
      return (
        <span
          key={val}
          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
        >
          {item ? getOptionLabel(item) : val}
          <button
            type="button"
            className="ml-1 text-blue-600 hover:text-blue-800"
            onClick={e => {
              e.stopPropagation();
              handleMultiChange(val);
            }}
          >
            ×
          </button>
        </span>
      );
    })}
  </div>
)}
    {error && <div className="text-destructive text-xs mt-1">{error}</div>}
  </div>
);
};