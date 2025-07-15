import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Loader2 } from "lucide-react";
import { useAIServices } from "@/hooks/use-ai-services";

type LocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter your location",
  className = "",
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { useSuggestLocations } = useAIServices();
  const locationsMutation = useSuggestLocations();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debounce input value
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (inputValue.trim().length >= 2) {
      timerRef.current = setTimeout(() => {
        setDebouncedValue(inputValue);
      }, 500);
    } else {
      setSuggestions([]);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inputValue]);
  
  // Fetch location suggestions when debounced value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedValue.trim().length >= 2) {
        try {
          const result = await locationsMutation.mutateAsync(debouncedValue);
          setSuggestions(result.locations || []);
          setOpen(true);
        } catch (error) {
          console.error("Failed to fetch location suggestions:", error);
          setSuggestions([]);
        }
      }
    };
    
    fetchSuggestions();
  }, [debouncedValue, locationsMutation]);
  
  const handleSelect = (selectedLocation: string) => {
    setInputValue(selectedLocation);
    onChange(selectedLocation);
    setSuggestions([]);
    setOpen(false);
  };
  
  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            className={`pl-10 ${className}`}
            onFocus={() => {
              if (suggestions.length > 0) {
                setOpen(true);
              }
            }}
          />
          {locationsMutation.isPending && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No locations found</CommandEmpty>
            <CommandGroup>
              {suggestions.map((location, index) => (
                <CommandItem
                  key={index}
                  value={location}
                  onSelect={() => handleSelect(location)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {location}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}