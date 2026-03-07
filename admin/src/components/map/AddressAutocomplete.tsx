import { useState, useRef, useEffect } from "react";

interface AddressSuggestion {
  display_name: string;
  formatted_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  address?: NominatimAddress;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect?: (address: string, lat: number, lon: number) => void;
  placeholder?: string;
  required?: boolean;
}

// Formatear dirección para mostrar de forma legible
function formatAddress(address: NominatimAddress, displayName: string): string {
  const parts: string[] = [];
  
  // Intentar extraer número de la dirección completa si existe
  const numberMatch = displayName.match(/\b(\d+)\b/);
  
  // Calle y número
  if (address.road) {
    if (address.house_number) {
      parts.push(`${address.road} ${address.house_number}`);
    } else if (numberMatch) {
      // Usar el número encontrado en display_name
      parts.push(`${address.road} ${numberMatch[1]}`);
    } else {
      parts.push(address.road);
    }
  }
  
  // Barrio/Zona
  const neighbourhood = address.neighbourhood || address.suburb;
  if (neighbourhood && neighbourhood !== address.city && neighbourhood !== address.town) {
    parts.push(neighbourhood);
  }
  
  // Ciudad
  const city = address.city || address.town || address.village;
  if (city) {
    parts.push(city);
  }
  
  // Si no pudimos formatear nada, devolver el nombre completo sin código postal
  if (parts.length === 0) {
    return displayName.replace(/,\s*\d{5}\s*,?/, '').replace(/, Uruguay$/, '');
  }
  
  return parts.join(", ");
}

// Buscar direcciones en Uruguay usando Nominatim
async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=uy&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EVSE-Admin-App'
        }
      }
    );
    
    const results: NominatimResult[] = await response.json();
    
    // Formatear las direcciones para mostrar de forma más limpia
    return results.map(result => ({
      display_name: result.display_name,
      formatted_name: result.address 
        ? formatAddress(result.address, result.display_name)
        : result.display_name.replace(/,\s*\d{5}\s*,?/, '').replace(/, Uruguay$/, ''),
      lat: result.lat,
      lon: result.lon,
      place_id: result.place_id,
    }));
  } catch (error) {
    console.error("Error al buscar direcciones:", error);
    return [];
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Ej: 18 de Julio 1234, Montevideo",
  required = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastTypedValueRef = useRef("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Buscar sugerencias mientras escribe
  useEffect(() => {
    if (suggestionTimer.current) {
      clearTimeout(suggestionTimer.current);
    }

    const isManualTypingValue = value === lastTypedValueRef.current;

    if (isInputFocused && isManualTypingValue && value && value.trim().length >= 3) {
      setIsSearching(true);
      
      suggestionTimer.current = setTimeout(async () => {
        const results = await searchAddresses(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsSearching(false);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      if (suggestionTimer.current) {
        clearTimeout(suggestionTimer.current);
      }
    };
  }, [value, isInputFocused]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    lastTypedValueRef.current = "";
    onChange(suggestion.formatted_name);
    
    if (onSelect) {
      const lat = parseFloat(suggestion.lat);
      const lon = parseFloat(suggestion.lon);
      onSelect(suggestion.formatted_name, lat, lon);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Dirección
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const nextValue = e.target.value;
            lastTypedValueRef.current = nextValue;
            setIsInputFocused(true);
            onChange(nextValue);
          }}
          onFocus={() => setIsInputFocused(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white dark:focus:border-brand-800"
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-9999 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                index === selectedIndex
                  ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="flex-1">{suggestion.formatted_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {value.length >= 3 && !isSearching && suggestions.length === 0 && showSuggestions && (
        <div className="absolute z-9999 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No se encontraron direcciones en Uruguay
          </p>
        </div>
      )}
    </div>
  );
}
