"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDoctypeMeta } from "@/lib/api/doctype";
import { resolveDocumentTitle } from "@/lib/utils/title-resolver";

interface LinkDisplayProps {
  doctype?: string;
  value?: string;
  fallback?: React.ReactNode;
  className?: string;
}

export function LinkDisplay({ doctype, value, fallback, className }: LinkDisplayProps) {
  const [display, setDisplay] = useState<string | undefined>(value);
  
  // Use a staleTime of 1 hour for doctype meta to minimize redundant fetches
  const { data: meta } = useQuery({
    queryKey: ["doctype-meta", doctype],
    queryFn: () => getDoctypeMeta(doctype!),
    enabled: !!doctype,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (!doctype || !value || !meta?.title_field || meta.title_field === "name") {
      setDisplay(value);
      return;
    }
    
    let isMounted = true;
    resolveDocumentTitle(doctype, value, meta.title_field).then(title => {
      if (isMounted) setDisplay(title);
    });
    
    return () => { isMounted = false; };
  }, [doctype, value, meta]);

  if (!value) return <>{fallback || <span className="text-muted-foreground">-</span>}</>;
  
  return <span className={className}>{display}</span>;
}
