"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: CountryCode[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
];

export interface CountryCodeSelectProps {
  value: string; // Dial code e.g. "+91" or country code e.g. "IN"
  onChange: (country: CountryCode) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function CountryCodeSelect({
  value,
  onChange,
  id = "country-code-select",
  className,
  disabled = false,
}: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected country
  const fallbackCountry = COUNTRIES[0] as CountryCode;
  const selectedCountry: CountryCode =
    COUNTRIES.find(
      (c) =>
        c.dialCode === value ||
        c.code.toLowerCase() === value.toLowerCase() ||
        value.startsWith(c.dialCode)
    ) || fallbackCountry;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.dialCode.includes(term) ||
      c.code.toLowerCase().includes(term)
    );
  });

  const handleSelect = (country: CountryCode) => {
    onChange(country);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left shrink-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center gap-1.5 py-1 text-xs font-bold text-[#08093B] hover:text-[#4F27E8] transition-colors focus:outline-none select-none",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-[#76799C] transition-transform duration-200",
            isOpen && "rotate-180 text-[#663CF6]"
          )}
        />
        <span className="font-bold text-[#08093B]">{selectedCountry.dialCode}</span>
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Country Code"
          className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl border border-[#D6DBF0] bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Search Box */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#76799C]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full rounded-xl border border-[#E2E6F5] bg-[#F7F8FC] py-1.5 pl-8 pr-3 text-xs font-medium text-[#08093B] placeholder-[#9094B0] focus:border-[#663CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EDE7FF]"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                  setSearch("");
                }
              }}
            />
          </div>

          {/* Countries List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <button
                    key={country.code}
                    id={`${id}-opt-${country.code}`}
                    data-testid={`country-opt-${country.code}`}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-[#EDE7FF] font-bold text-[#4F27E8]"
                        : "text-[#1B1D45] hover:bg-[#F5F7FD]"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none shrink-0">
                        {country.flag}
                      </span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span
                        className={cn(
                          "font-mono font-semibold text-[11px]",
                          isSelected ? "text-[#4F27E8]" : "text-[#76799C]"
                        )}
                      >
                        {country.dialCode}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#4F27E8]" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-[#76799C]">
                No country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
