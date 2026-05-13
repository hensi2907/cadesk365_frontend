"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { useDependsOn } from "./use-depends-on";
import type { FieldRendererProps } from "./engine.types";

import { RenderData } from "./renderers/render-data";
import { RenderText } from "./renderers/render-text";
import { RenderSelect } from "./renderers/render-select";
import { RenderLink } from "./renderers/render-link";
import { RenderCheck } from "./renderers/render-check";
import { RenderDate } from "./renderers/render-date";
import { RenderAttach } from "./renderers/render-attach";
import { RenderTable } from "./renderers/render-table";
import { RenderVisual } from "./renderers/render-visual";

export function FieldRenderer({ field, value, onChange, formData, readOnly, hideLabel, error }: FieldRendererProps) {
  // Evaluate visibility based on depends_on rule
  const isVisible = useDependsOn(field.depends_on, formData);

  if (!isVisible || field.hidden === 1) {
    return null;
  }

  const isReadOnly = readOnly || field.read_only === 1;

  const labelNode = hideLabel ? null : (
    <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
      {field.label || field.fieldname}
      {field.reqd === 1 && !isReadOnly && <span className="text-destructive">*</span>}
    </Label>
  );

  const baseProps = {
    field,
    value,
    onChange,
    isReadOnly,
    labelNode,
    formData,
    error,
  };

  let renderedField: React.ReactNode = null;

  switch (field.fieldtype) {
    // Data Fields
    case "Data":
    case "Int":
    case "Float":
    case "Currency":
    case "Percent":
    case "Password":
    case "Phone":
    case "Email":
    case "URL":
    case "Read Only":
      renderedField = <RenderData {...baseProps} />;
      break;

    // Text Fields
    case "Small Text":
    case "Text":
    case "Long Text":
    case "Text Editor":
    case "Code":
    case "JSON":
      renderedField = <RenderText {...baseProps} />;
      break;

    // Select Fields
    case "Select":
    case "MultiSelect":
      renderedField = <RenderSelect {...baseProps} />;
      break;

    // Link Fields
    case "Link":
    case "Dynamic Link":
      renderedField = <RenderLink {...baseProps} />;
      break;

    // Check Fields
    case "Check":
      renderedField = <RenderCheck {...baseProps} />;
      break;

    // Date Fields
    case "Date":
    case "Datetime":
    case "Time":
    case "Duration":
      renderedField = <RenderDate {...baseProps} />;
      break;

    // Attachment Fields
    case "Attach":
    case "Attach Image":
      renderedField = <RenderAttach {...baseProps} />;
      break;

    // Child Tables
    case "Table":
      renderedField = <RenderTable {...baseProps} />;
      break;

    // Visual / Layout Fields
    case "HTML":
      renderedField = null;
      break;
    case "Heading":
    case "Color":
    case "Rating":
      renderedField = <RenderVisual {...baseProps} />;
      break;

    default:
      // Fallback for unknown fields
      renderedField = <RenderData {...baseProps} />;
      break;
  }

  if (renderedField === null) return null;

  return (
    <div id={`field-${field.fieldname}`} className="flex flex-col relative w-full group">
      {renderedField}
      {error && (
        <span className="text-[11px] font-medium text-destructive mt-1.5 animate-in slide-in-from-top-1 fade-in-0 flex items-center gap-1">
          {error}
        </span>
      )}
    </div>
  );
}
