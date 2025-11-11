/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { get } from "@/services/apiService";
import { SelectWithError } from "./SelectWithError";
import { SelectItem } from "@/components/ui/select";
import { InputWithError } from "./InputWithError";
import { Label } from "@/components/ui/label";

interface GeographicItem {
  code: string;
  name: string;
  value?: string;
  id?: string;
  parentCode?: string;
}

interface GeographicData {
  countries: GeographicItem[];
  states: GeographicItem[];
  cities: GeographicItem[];
  pincodes: GeographicItem[];
}

interface GeographicValues {
  country: string;
  state: string;
  city: string;
  pincode: string;
}

interface PincodeLocationResponse {
  country: string;
  state: string;
  city: string;
  pincode: string;
  countryName: string;
  stateName: string;
  cityName: string;
}

interface GeographicDropdownWrapperProps {
  values: GeographicValues;
  onValuesChange: (values: GeographicValues) => void;
  errors?: {
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
  };
  disabled?: boolean;
  required?: {
    country?: boolean;
    state?: boolean;
    city?: boolean;
    pincode?: boolean;
  };
  className?: string;
  layout?: "grid" | "vertical";
  enablePincodeSearch?: boolean;
}

export const GeographicDropdownWrapper = ({
  values,
  onValuesChange,
  errors = {},
  disabled = false,
  required = {},
  className = "",
  layout = "grid",
  enablePincodeSearch = true,
}: GeographicDropdownWrapperProps) => {
  const { toast } = useToast();

  // Loading states
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    pincodes: false,
    pincodeSearch: false,
  });

  // Data states
  const [data, setData] = useState<GeographicData>({
    countries: [],
    states: [],
    cities: [],
    pincodes: [],
  });

  // Control flags
  const [isInitialized, setIsInitialized] = useState(false);
  const [pincodeInputValue, setPincodeInputValue] = useState(values.pincode || "");
  const [lastFailedPincode, setLastFailedPincode] = useState<string>("");
  const [lastSearchedPincode, setLastSearchedPincode] = useState<string>("");
  const [lastAutoPopulatedPincode, setLastAutoPopulatedPincode] = useState<string>("");

  // Debounce timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync pincode input value with external values (except during searches)
  useEffect(() => {
    if (values.pincode !== pincodeInputValue && !loading.pincodeSearch) {
      // console.log("Syncing pincode input value:", values.pincode);
      setPincodeInputValue(values.pincode || "");
    }
  }, [values.pincode, pincodeInputValue, loading.pincodeSearch]);

  // Generic fetch function for list values
  const fetchListValues = useCallback(async (
    listKey: string,
    parentCode?: string
  ): Promise<GeographicItem[]> => {
    try {
      let url = "";
      
      if (parentCode) {
        url = `/api/v1/list-values/${listKey}/items?parentCode=${encodeURIComponent(parentCode)}`;
      } else {
        url = `/api/v1/list-values/key/${listKey}`;
      }

      const response = (await get(url)) as any;
      
      let items: GeographicItem[] = [];
      
      if (response?.values && Array.isArray(response.values)) {
        items = response.values;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (response?.data && Array.isArray(response.data)) {
        items = response.data;
      }
      
      return items;
    } catch (error) {
      // console.error(`Failed to fetch ${listKey}:`, error);
      if (error instanceof Error && !error.message.includes('404')) {
        toast({
          title: "Error",
          description: `Failed to fetch ${listKey} options: ${error.message}`,
          variant: "destructive",
        });
      }
      return [];
    }
  }, [toast]);

  // Initialize countries on mount
  useEffect(() => {
    const initializeCountries = async () => {
      if (!isInitialized) {
        setLoading(prev => ({ ...prev, countries: true }));
        const countries = await fetchListValues("COUNTRIES");
        setData(prev => ({ ...prev, countries }));
        setLoading(prev => ({ ...prev, countries: false }));
        setIsInitialized(true);
      }
    };

    initializeCountries();
  }, [isInitialized, fetchListValues]);

  // Track previous values for comparison
  const [prevValues, setPrevValues] = useState<GeographicValues>(values);

  // Load hierarchical data when values change (for edit mode)
  useEffect(() => {
    if (!isInitialized || loading.pincodeSearch) return;

    const loadHierarchicalData = async () => {
      const { country, state, city } = values;
      // console.log("=== Loading hierarchical data for values:", { country, state, city });
      // console.log("Previous values were:", prevValues);

      if (country && country !== prevValues.country) {
        // console.log(`Loading states for country: ${country}`);
        setLoading(prev => ({ ...prev, states: true }));
        try {
          const states = await fetchListValues("STATE", country);
          // console.log(`Loaded ${states.length} states for country ${country}`);
          setData(prev => ({ ...prev, states, cities: [], pincodes: [] }));
        } catch (error) {
          // console.error(`Failed to load states for country ${country}:`, error);
        }
        setLoading(prev => ({ ...prev, states: false }));
      }

      if (state && country && state !== prevValues.state) {
        // console.log(`Loading cities for state: ${state}`);
        setLoading(prev => ({ ...prev, cities: true }));
        try {
          const cities = await fetchListValues("CITIES", state);
          // console.log(`Loaded ${cities.length} cities for state ${state}`);
        
          setData(prev => ({ ...prev, cities, pincodes: [] }));
        } catch (error) {
          // console.error(`Failed to load cities for state ${state}:`, error);
        }
        setLoading(prev => ({ ...prev, cities: false }));
      }

      if (city && state && city !== prevValues.city) {
        // console.log(`Loading pincodes for city: ${city}`);
        setLoading(prev => ({ ...prev, pincodes: true }));
        try {
          const pincodes = await fetchListValues("PINCODES", city);
          // console.log(`Loaded ${pincodes.length} pincodes for city ${city}`);
          setData(prev => ({ ...prev, pincodes }));
          
          // Auto-populate pincode if only one is available
          if (pincodes.length === 1 && !values.pincode) {
            const autoPincode = pincodes[0].code;
            // console.log("Auto-populating pincode:", autoPincode);
            setPincodeInputValue(autoPincode);
            setLastAutoPopulatedPincode(autoPincode);
            onValuesChange({ ...values, pincode: autoPincode });
          }
        } catch (error) {
          // console.error(`Failed to load pincodes for city ${city}:`, error);
        }
        setLoading(prev => ({ ...prev, pincodes: false }));
      }

      // Update prev values
      // console.log("Updating previous values to:", values);
      setPrevValues(values);
    };

    loadHierarchicalData();
  }, [values.country, values.state, values.city, isInitialized, loading.pincodeSearch, fetchListValues, prevValues, values]);

  // Pincode search function
  const performPincodeSearch = useCallback(async (pincode: string) => {
    if (!enablePincodeSearch || !pincode || pincode.length < 6) return;

    // Prevent searching the same pincode that just failed
    if (pincode === lastFailedPincode) {
      // console.log("Skipping search for previously failed pincode:", pincode);
      return;
    }

    // Prevent duplicate searches
    if (pincode === lastSearchedPincode) {
      // console.log("Already searched for this pincode:", pincode);
      return;
    }

    // Check if this pincode was auto-populated from city selection
    if (pincode === lastAutoPopulatedPincode) {
      // console.log("Skipping search for auto-populated pincode:", pincode);
      return;
    }

    // Allow search if:
    // 1. All geographic fields are empty (new entry), OR
    // 2. User entered a different pincode than current (allows re-entry)
    const isNewEntry = !values.country && !values.state && !values.city;
    const isDifferentPincode = pincodeInputValue && pincodeInputValue !== lastAutoPopulatedPincode;

    const shouldAutoSearch = isNewEntry || isDifferentPincode;

    if (!shouldAutoSearch) {
      // console.log("Skipping search - conditions not met");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, pincodeSearch: true }));
      setLastSearchedPincode(pincode);

      // console.log("Searching for pincode:", pincode);

      const response = (await get(`/api/v1/list-values/pincode-lookup?pincode=${encodeURIComponent(pincode)}`)) as PincodeLocationResponse;

      // console.log("Pincode lookup response:", response);

      if (response && response.country && response.state && response.city) {
        // console.log("Loading hierarchical data for auto-population...");

        // Clear the failed pincode on success
        setLastFailedPincode("");
        setLastAutoPopulatedPincode("");

        // Load all hierarchical data in sequence
        const [countries, states, cities, pincodes] = await Promise.all([
          fetchListValues("COUNTRIES"),
          fetchListValues("STATE", response.country),
          fetchListValues("CITIES", response.state),
          fetchListValues("PINCODES", response.city),
        ]);

        // console.log("Hierarchical data loaded, updating form...");

        // Update data state first
        setData({ countries, states, cities, pincodes });

        // Create new values object
        const newValues = {
          country: response.country,
          state: response.state,
          city: response.city,
          pincode: pincode,
        };

        // console.log("Updating form values:", newValues);

        // Update form values
        onValuesChange(newValues);
      } else {
        // Mark this pincode as failed
        // console.log("Pincode lookup failed - no data returned");
        setLastFailedPincode(pincode);

        // Just update pincode if lookup fails
        onValuesChange({ ...values, pincode });
      }
    } catch (error: any) {
      // Handle pincode lookup errors gracefully
      // If it's a 500 error or network error for non-existent pincode, treat it as "pincode not found"
      // This is expected behavior when a pincode doesn't exist in the system

      if (error?.response?.status === 500 || error?.message?.includes('500')) {
        // Server error for non-existent pincode - this is expected
        // console.log("Pincode not found in system (500 error) - allowing manual entry");
        setLastFailedPincode(pincode);
      } else if (error?.message?.includes('Network Error') || error?.message?.includes('404')) {
        // Network error or 404 - pincode not found
        // console.log("Pincode not found (network/404 error) - allowing manual entry");
        setLastFailedPincode(pincode);
      } else {
        // For other types of errors, still allow pincode entry
        // console.error("Pincode lookup error:", error);
        setLastFailedPincode(pincode);
      }

      // Always update the pincode field regardless of lookup result
      onValuesChange({ ...values, pincode });
    } finally {
      setLoading(prev => ({ ...prev, pincodeSearch: false }));
    }
  }, [enablePincodeSearch, fetchListValues, onValuesChange, values, lastFailedPincode, lastSearchedPincode, lastAutoPopulatedPincode, toast]);

  // Debounced pincode search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (pincodeInputValue && pincodeInputValue.length >= 3 && enablePincodeSearch) {
      // Reset the last searched pincode when user types a different pincode
      if (pincodeInputValue !== lastSearchedPincode) {
        setLastSearchedPincode("");
      }
      
      // Reset failed pincode when user modifies the input
      if (pincodeInputValue !== lastFailedPincode) {
        setLastFailedPincode("");
      }

      debounceTimeoutRef.current = setTimeout(() => {
        performPincodeSearch(pincodeInputValue);
      }, 500);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [pincodeInputValue, enablePincodeSearch, performPincodeSearch, lastSearchedPincode, lastFailedPincode]);

  // Handle field changes
  const handleCountryChange = (country: string) => {
    setPincodeInputValue("");
    setLastFailedPincode("");
    setLastSearchedPincode("");
    setLastAutoPopulatedPincode("");
    onValuesChange({ country, state: "", city: "", pincode: "" });
  };

  const handleStateChange = (state: string) => {
    setPincodeInputValue("");
    setLastFailedPincode("");
    setLastSearchedPincode("");
    setLastAutoPopulatedPincode("");
    onValuesChange({ ...values, state, city: "", pincode: "" });
  };

  const handleCityChange = (city: string) => {
    setPincodeInputValue("");
    setLastFailedPincode("");
    setLastSearchedPincode("");
    onValuesChange({ ...values, city, pincode: "" });
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    setPincodeInputValue(pincode);
    
    // Reset auto-populated flag when user manually types different pincode
    if (pincode !== lastAutoPopulatedPincode) {
      setLastAutoPopulatedPincode("");
    }
    
    onValuesChange({ ...values, pincode });

    // Immediate search for common pincode lengths
    if (enablePincodeSearch && (pincode.length === 6 || pincode.length === 5)) {
      if (pincode !== lastFailedPincode && pincode !== lastAutoPopulatedPincode) {
        performPincodeSearch(pincode);
      }
    }
  };

  const handlePincodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const pincode = (e.target as HTMLInputElement).value;
      if (enablePincodeSearch && pincode.length >= 6) {
        if (pincode !== lastFailedPincode) {
          // Force a fresh search on Enter key
          setLastSearchedPincode("");
          setLastAutoPopulatedPincode("");
          performPincodeSearch(pincode);
        }
      }
    }
  };

  const handlePincodeDropdownChange = (pincode: string) => {
    setPincodeInputValue(pincode);
    setLastAutoPopulatedPincode(pincode);
    onValuesChange({ ...values, pincode });
  };

  const containerClass = layout === "grid" 
    ? "grid grid-cols-1 md:grid-cols-3 gap-6"
    : "space-y-2";

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Country Dropdown */}
      <div className="space-y-2">
        <Label>
          Country{required.country && "*"}
        </Label>
        <SelectWithError
          value={values.country || ""}
          onValueChange={handleCountryChange}
          error={errors.country}
          placeholder={loading.countries ? "Loading..." : "Select country"}
          disabled={disabled || loading.countries || loading.pincodeSearch}
        >
          {data.countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.code} - {country.name}
            </SelectItem>
          ))}
        </SelectWithError>
      </div>

      {/* State Dropdown */}
      <div className="space-y-2">
        <Label>
          State/Province{required.state && "*"}
        </Label>
        <SelectWithError
          value={values.state || ""}
          onValueChange={handleStateChange}
          error={errors.state}
          placeholder={
            loading.states || loading.pincodeSearch
              ? "Loading..." 
              : !values.country 
                ? "Select country first"
                : data.states.length === 0
                  ? "No states available"
                  : "Select state"
          }
          disabled={disabled || loading.states || !values.country || loading.pincodeSearch}
        >
          {data.states.map((state) => (
            <SelectItem key={state.code} value={state.code}>
              {state.code} - {state.name}
            </SelectItem>
          ))}
        </SelectWithError>
      </div>

      {/* City Dropdown */}
      <div className="space-y-2">
        <Label>
          City{required.city && "*"}
        </Label>
        <SelectWithError
          value={values.city || ""}
          onValueChange={handleCityChange}
          error={errors.city}
          placeholder={
            loading.cities || loading.pincodeSearch
              ? "Loading..." 
              : !values.state 
                ? "Select state first"
                : data.cities.length === 0
                  ? "No cities available"
                  : "Select city"
          }
          disabled={disabled || loading.cities || !values.state || loading.pincodeSearch}
        >
          {data.cities.map((city) => (
            <SelectItem key={city.code} value={city.code}>
              {city.code} - {city.name}
            </SelectItem>
          ))}
        </SelectWithError>
      </div>

      {/* Pincode Input/Dropdown */}
      <div className="space-y-2">
        <Label>
          Pincode{required.pincode && "*"}
        
        </Label>
        {enablePincodeSearch ? (
          <InputWithError
            value={pincodeInputValue}
            onChange={handlePincodeChange}
            onKeyPress={handlePincodeKeyPress}
            error={errors.pincode}
            placeholder="Enter pincode"
            disabled={disabled || loading.pincodeSearch}
            maxLength={9}
          />
        ) : (
          <SelectWithError
            value={values.pincode || ""}
            onValueChange={handlePincodeDropdownChange}
            error={errors.pincode}
            placeholder={
              loading.pincodes 
                ? "Loading..." 
                : !values.city 
                  ? "Select city first"
                  : data.pincodes.length === 0
                    ? "No pincodes available"
                    : "Select pincode"
            }
            disabled={disabled || loading.pincodes || !values.city}
          >
            {data.pincodes.map((pincode) => (
              <SelectItem key={pincode.code} value={pincode.code}>
                {pincode.code} - {pincode.name}
              </SelectItem>
            ))}
          </SelectWithError>
        )}
        {loading.pincodeSearch && (
          <div className="text-sm text-blue-500">Searching for location...</div>
        )}
      </div>
    </div>
  );
};
