import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface FilterMultiSelectProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  /** Only show the search bar when options exceed this count. Default: 5 */
  searchThreshold?: number;
}

export const FilterMultiSelect = ({
  label,
  options,
  selectedValues,
  onChange,
  searchThreshold = 5,
}: FilterMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input when dropdown opens (for long lists)
      if (options.length > searchThreshold) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, options.length, searchThreshold]);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  // Filtered options based on search
  const filteredOptions = searchQuery.trim()
    ? options.filter((o) => o.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  let pluralLabel = `${label}s`;
  if (label === "Category") pluralLabel = "Categories";
  else if (label === "Availability") pluralLabel = "Availabilities";

  const displayText =
    selectedValues.length === 0
      ? `All ${pluralLabel}`
      : selectedValues.length === 1
      ? selectedValues[0]
      : `${selectedValues.length} Selected`;

  const showSearch = options.length > searchThreshold;

  return (
    <div>
      {/*
        Mandatory rule applied: "If data missing: show section heading only without checkbox options...
        Never show static placeholder options."
      */}
      <label
        className={`block text-xs font-medium text-[#6B5D4F] uppercase tracking-wide mb-2 ${
          options.length === 0 ? "opacity-50" : ""
        }`}
      >
        {label}
      </label>

      {options.length === 0 ? (
        <div className="w-full px-4 py-2.5 bg-[#F9F7F3] border border-[#E8DCC4] rounded-lg text-sm text-[#9B8B7E] flex items-center justify-between opacity-50 cursor-not-allowed">
          <span className="truncate">{displayText}</span>
          <ChevronDown className="w-4 h-4 text-[#9B8B7E] flex-shrink-0" />
        </div>
      ) : (
        <div className="relative" ref={dropdownRef}>
          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (isOpen) setSearchQuery("");
            }}
            className="w-full px-4 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] hover:border-[#D4AF37] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all flex items-center justify-between"
          >
            <span className="truncate">{displayText}</span>
            <ChevronDown
              className={`w-4 h-4 text-[#6B5D4F] transition-transform duration-200 flex-shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-[#E8DCC4] rounded-xl shadow-2xl overflow-hidden">
              {/* ── Search Bar (only shown when options > threshold) ── */}
              {showSearch && (
                <div className="px-3 pt-3 pb-2 border-b border-[#F0E9DA]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B8B7E] pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={`Search ${label.toLowerCase()}…`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-7 py-2 bg-[#F8F4EC] border border-[#E8DCC4] rounded-lg text-xs text-[#2C2416] placeholder-[#B5A898] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Options List ── */}
              <div className="max-h-52 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-0.5">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                      const isSelected = selectedValues.includes(option);
                      return (
                        <div
                          key={option}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOption(option);
                          }}
                          className="flex items-center px-3 py-2 rounded-lg hover:bg-[#FDFBF7] cursor-pointer group transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors flex-shrink-0 ${
                              isSelected
                                ? "bg-[#D4AF37] border-[#D4AF37]"
                                : "border-[#D4C5A9] group-hover:border-[#D4AF37]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span
                            className={`text-sm truncate ${
                              isSelected ? "text-[#D4AF37] font-medium" : "text-[#2C2416]"
                            }`}
                          >
                            {option}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-[#9B8B7E]">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer: selected count + clear ── */}
              {selectedValues.length > 0 && (
                <div className="px-3 py-2 border-t border-[#F0E9DA] flex items-center justify-between bg-[#FDFBF7]">
                  <span className="text-[11px] text-[#9B8B7E]">
                    {selectedValues.length} selected
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    className="text-[11px] font-medium text-[#D4AF37] hover:text-[#C9A55C] transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
