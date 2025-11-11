/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useToast } from "../use-toast";
import { get } from "../../../services/apiService";
import { SelectWithError } from "./SelectWithError";
import { SelectItem } from "../select";

interface ListValueItem {
  code: string;
  name: string;
  value?: string;
  description?: string;
  status?: string;
}

interface ListValueDropdownWrapperProps {
  listKey: string;
  value?: string;
  onValueChange: (value: string) => void; 
  onValueChangeData?: (item: ListValueItem) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  parentCode?: string | null;
  showCode?: boolean;
  showDescription?: boolean;
  useCodeAsValue?: boolean;
}

export const ListValueDropdownWrapper = ({
  listKey,
  value = "",
  onValueChange,
  onValueChangeData,
  placeholder = "Select an option",
  error,
  disabled = false,
  className = "",
  parentCode = null,
  showCode = false,
  showDescription = false,
  useCodeAsValue = false,
}: ListValueDropdownWrapperProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<ListValueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListValues = async () => {
      try {
        setLoading(true);
        let url = "";

        if (parentCode) {
          url = `/api/v1/list-values/${listKey}/items?parentCode=${encodeURIComponent(
            parentCode
          )}`;
        } else {
          url = `/api/v1/list-values/key/${listKey}`;
        }

        const response = (await get(url)) as any;
        let items = [];

        if (response?.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (response?.values) {
          if (typeof response.values === "function") {
            items = Array.from(response.values());
          } else if (Array.isArray(response.values)) {
            items = response.values;
          } else {
            items = [];
          }
        } else if (Array.isArray(response)) {
          items = response;
        } else if (response && typeof response === "object") {
          if (typeof response.values === "function") {
            items = Array.from(response.values());
          } else if (typeof response.entries === "function") {
            items = Array.from(response.entries()).map(
              ([key, value]) => value
            );
          } else {
            const objectValues = Object.values(response);
            items = objectValues.find((val) => Array.isArray(val)) || [];
          }
        } else {
          console.warn(`Unexpected response format for ${listKey}:`, response);
          items = [];
        }

        if (Array.isArray(items)) {
          const activeItems = items.filter(
            (item) =>
              !item.status ||
              item.status === "ACTIVE" ||
              item.status === "active"
          );
          setOptions(activeItems);
        } else {
          console.warn(`Expected array for ${listKey} but got:`, items);
          setOptions([]);
        }
      } catch (error) {
        console.error(`Failed to fetch ${listKey}:`, error);

        if (error instanceof Error && !error.message.includes("404")) {
          toast({
            title: "Error",
            description: `Failed to fetch ${listKey} options: ${error.message}`,
            variant: "destructive",
          });
        }
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (listKey) {
      if (parentCode !== null) {
        setOptions([]);
      }
      fetchListValues();
    } else {
      setOptions([]);
      setLoading(false);
    }
  }, [listKey, parentCode, toast]);

  // ✅ Modified handler
  const handleValueChange = (newValue: string) => {
    const selectedItem = options.find(
      (item) =>
        (useCodeAsValue ? item.code : item.value || item.code) === newValue
    );

    console.log(`${listKey} selected:`, selectedItem);

    // Old way - still works
    onValueChange(newValue);

    // New way - full object callback
    if (selectedItem && onValueChangeData) {
      onValueChangeData(selectedItem);
    }
  };

  const getOptionLabel = (item: ListValueItem) => {
    return showCode && item.code ? `${item.code} - ${item.name}` : item.name;
  };

  const isDisabled = disabled || loading || (parentCode !== null && !parentCode);

  return (
    <SelectWithError
      value={value || ""}
      onValueChange={handleValueChange}
      error={error}
      placeholder={
        loading
          ? "Loading..."
          : parentCode !== null && !parentCode
          ? "Select parent first"
          : options.length === 0
          ? "No options available"
          : placeholder
      }
      disabled={isDisabled}
      className={className}
    >
      {options
        .map((item) => {
          if (!item || !item.code) {
            console.warn(`Invalid item in ${listKey}:`, item);
            return null;
          }

          const itemValue = useCodeAsValue ? item.code : item.value || item.code;

          return (
            <SelectItem
              key={`${listKey}-${item.code}`}
              value={itemValue}
              title={showDescription ? item.description : undefined}
            >
              {getOptionLabel(item)}
            </SelectItem>
          );
        })
        .filter(Boolean)}
    </SelectWithError>
  );
};
