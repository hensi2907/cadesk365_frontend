"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { searchLink } from "@/lib/api/client";
import { getDoctypeMeta } from "@/lib/api/doctype";
import { resolveDocumentTitle } from "@/lib/utils/title-resolver";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LinkFieldProps {
  doctype: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchFields?: string[];
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export function LinkField({
  doctype,
  value,
  onChange,
  placeholder = "Search...",
  searchFields = ["name"],
  className,
  error,
  disabled,
}: LinkFieldProps) {
  // Use a staleTime of 1 hour for doctype meta
  const { data: meta } = useQuery({
    queryKey: ["doctype-meta", doctype],
    queryFn: () => getDoctypeMeta(doctype),
    enabled: !!doctype,
    staleTime: 1000 * 60 * 60,
  });

  const titleField = meta?.title_field && meta.title_field !== "name" ? meta.title_field : null;

  const [query, setQuery] = React.useState("");
  const [displayValue, setDisplayValue] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // When external `value` changes (e.g. initial load), resolve its title
  React.useEffect(() => {
    let isMounted = true;
    
    if (!value) {
      setDisplayValue("");
      setQuery("");
      return;
    }

    if (!titleField) {
      setDisplayValue(value);
      setQuery(value);
      return;
    }

    resolveDocumentTitle(doctype, value, titleField).then((title) => {
      if (isMounted) {
        setDisplayValue(title);
        setQuery(title);
      }
    });

    return () => { isMounted = false; };
  }, [value, doctype, titleField]);

  const updateRect = React.useCallback(() => {
    if (wrapperRef.current) {
      setRect(wrapperRef.current.getBoundingClientRect());
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      updateRect();
      window.addEventListener("scroll", updateRect, true); // capture scroll from any scrollable parent
      window.addEventListener("resize", updateRect);
    } else {
      setRect(null);
    }
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [isOpen, updateRect]);

  // Handle outside clicks to close the dropdown and reset the query text
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isInsideWrapper = wrapperRef.current && wrapperRef.current.contains(e.target as Node);
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target as Node);

      if (!isInsideWrapper && !isInsideDropdown) {
        setIsOpen(false);
        setQuery(displayValue || ""); // Reset search text back to the resolved display value
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [displayValue]);

  // Fetch search options based on typing
  React.useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const fetchFields = [...searchFields];
        if (titleField && !fetchFields.includes(titleField)) {
          fetchFields.push(titleField);
        }
        
        const res = await searchLink(doctype, query, fetchFields);
        setOptions(res);
      } catch (err) {
        console.error("Failed to fetch link options", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchOptions, 300);
    return () => clearTimeout(debounce);
  }, [query, isOpen, doctype, searchFields, titleField]);

  const handleSelect = (opt: any) => {
    const resolvedTitle = titleField ? (opt[titleField] || opt.name) : opt.name;
    setDisplayValue(resolvedTitle);
    setQuery(resolvedTitle);
    onChange(opt.name); // Always pass back the internal name/ID
    setIsOpen(false);
  };

  return (
    <>
      <div className={cn("relative", className)} ref={wrapperRef}>
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => { if (!disabled) setIsOpen(true) }}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(error && "border-destructive", "w-full pr-8")}
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {isOpen && rect && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[100] mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95"
          style={{
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
          }}
        >
          {options.length === 0 && !isLoading ? (
            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-muted-foreground">
              No results found.
            </div>
          ) : (
            options.map((opt, i) => {
              const displayTitle = titleField ? (opt[titleField] || opt.name) : opt.name;
              return (
                <div
                  key={i}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => handleSelect(opt)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{displayTitle}</span>
                    {titleField && opt.name !== displayTitle && (
                      <span className="text-[10px] text-muted-foreground">{opt.name}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}
    </>
  );
}
