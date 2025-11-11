/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { post } from "@/services/apiService";
import { SelectWithError } from "./SelectWithError";
import { SelectItem } from "@/components/ui/select";

interface ListValueItem {
  code: string;
  name: string;
  value?: string;
  description?: string;
  status?: string;
}

interface ListValueFilterDropdownWrapperProps {
  tableName: string;
  actionField: string[];
  actionValue: string[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  showCode?: boolean;
  showDescription?: boolean;
  useCodeAsValue?: boolean;
}

export const ListValueFilterDropdownWrapper = ({
  tableName,
  actionField,
  actionValue,
  value = "",
  onValueChange,
  placeholder = "Select an option",
  error,
  disabled = false,
  className = "",
  showCode = false,
  showDescription = false,
  useCodeAsValue = false,
}: ListValueFilterDropdownWrapperProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<ListValueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilteredList = async () => {
      try {
        setLoading(true);

        const response = (await post(`/api/v1/list-values/filter`, {
          tableName,
          actionField,
          actionValue,
        })) as any;

        let items: any[] = [];

        if (response?.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          items = response;
        } else if (response?.values && Array.isArray(response.values)) {
          items = response.values;
        } else {
          console.warn(`Unexpected response format for ${tableName}:`, response);
          items = [];
        }

        // Filter only ACTIVE ones if applicable
        const activeItems = items.filter(
          (item) =>
            !item.status ||
            item.status === "ACTIVE" ||
            item.status === "active"
        );

        setOptions(activeItems);
      } catch (error) {
        console.error(`Failed to fetch filtered values for ${tableName}:`, error);
        if (error instanceof Error && !error.message.includes("404")) {
          toast({
            title: "Error",
            description: `Failed to fetch filter values: ${error.message}`,
            variant: "destructive",
          });
        }
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (tableName && actionField.length && actionValue.length) {
      fetchFilteredList();
    } else {
      setOptions([]);
      setLoading(false);
    }
  }, [tableName, JSON.stringify(actionField), JSON.stringify(actionValue), toast]);

  const handleValueChange = (newValue: string) => {
    console.log(`${tableName} filter value changed to:`, newValue);
    onValueChange(newValue);
  };

  const getOptionLabel = (item: ListValueItem) =>
    showCode && item.code ? `${item.code} - ${item.name}` : item.name;

  const isDisabled = disabled || loading || !actionValue.length;

  return (
    <SelectWithError
      value={value || ""}
      onValueChange={handleValueChange}
      error={error}
      placeholder={
        loading
          ? "Loading..."
          : !actionValue.length
            ? "Select parent first"
            : options.length === 0
              ? "No options available"
              : placeholder
      }
      disabled={isDisabled}
      className={className}
    >
      {options.map((item) => {
        if (!item || !item.code) {
          console.warn(`Invalid item in ${tableName}:`, item);
          return null;
        }

        const itemValue = useCodeAsValue
          ? item.code
          : item.value || item.code;

        return (
          <SelectItem
            key={`${tableName}-${item.code}`}
            value={itemValue}
            title={showDescription ? item.description : undefined}
          >
            {getOptionLabel(item)}
          </SelectItem>
        );
      }).filter(Boolean)}
    </SelectWithError>
  );
};
