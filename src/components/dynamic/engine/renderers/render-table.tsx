import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDoctypeMeta } from "@/lib/api/doctype";
import type { BaseRendererProps } from "../engine.types";
import { FieldRenderer } from "../field-renderer";
import { useFetchFrom } from "../hooks/use-fetch-from";

export function RenderTable({ field, value, onChange, isReadOnly, labelNode, formData }: BaseRendererProps) {
  const childDoctype = field.options;

  // Fetch child doctype metadata
  const { data: meta, isLoading, isError } = useQuery({
    queryKey: ["doctype-meta", childDoctype],
    queryFn: () => getDoctypeMeta(childDoctype!),
    enabled: !!childDoctype,
  });

  const { handleFetchFrom } = useFetchFrom(meta?.fields || []);

  const rows: any[] = Array.isArray(value) ? value : [];

  const handleAddRow = () => {
    if (isReadOnly) return;
    const newRow: any = { __local_id: Math.random().toString(36).substring(2, 9) };
    if (meta) {
      meta.fields.forEach(f => {
        if (f.default !== undefined) newRow[f.fieldname] = f.default;
      });
    }
    onChange([...rows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (isReadOnly) return;
    const newRows = [...rows];
    newRows.splice(index, 1);
    onChange(newRows);
  };

  const handleCellChange = (index: number, fieldname: string, val: any) => {
    if (isReadOnly) return;
    
    // Initial change
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [fieldname]: val };
    onChange(newRows);

    // Handle fetch_from
    handleFetchFrom(fieldname, val, (updates) => {
      const updatedRows = [...newRows];
      updatedRows[index] = { ...updatedRows[index], ...updates };
      onChange(updatedRows);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col border rounded-md p-4 bg-muted/20">
        {labelNode}
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading table structure...
        </div>
      </div>
    );
  }

  if (isError || !meta) {
    return (
      <div className="flex flex-col border rounded-md p-4 bg-destructive/10 text-destructive text-sm">
        {labelNode}
        <span>Failed to load table definition for {childDoctype}</span>
      </div>
    );
  }

  // Get columns to display in grid (in_list_view)
  let columns = meta.fields.filter(f => f.in_list_view === 1);
  if (columns.length === 0) {
    // Fallback: pick the first 4 fields that are not layout breaks
    columns = meta.fields.filter(f => !["Section Break", "Column Break", "HTML", "Table"].includes(f.fieldtype)).slice(0, 4);
  } else {
    columns = columns.slice(0, 5); // Limit to 5 for UX
  }

  return (
    <div className="flex flex-col space-y-3 col-span-full">
      <div className="flex items-center justify-between">
        {labelNode}
        {!isReadOnly && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-2" /> Add Row
          </Button>
        )}
      </div>

      <div className="border rounded-md overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              {columns.map(col => (
                <th key={col.fieldname} className="px-4 py-3 font-medium">
                  {col.label} {col.reqd ? "*" : ""}
                </th>
              ))}
              {!isReadOnly && <th className="px-4 py-3 w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const rowKey = row.name || row.__local_id || idx;
                return (
                  <tr key={rowKey} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 text-center text-muted-foreground">{idx + 1}</td>
                    {columns.map(col => (
                      <td key={col.fieldname} className="px-4 py-2 align-top">
                        <FieldRenderer
                          field={{...col, in_list_view: 0}}
                          value={row[col.fieldname]}
                          onChange={(val) => handleCellChange(idx, col.fieldname, val)}
                          formData={row}
                          readOnly={isReadOnly || col.read_only === 1}
                          hideLabel={true}
                        />
                      </td>
                    ))}
                    {!isReadOnly && (
                      <td className="px-4 py-2 text-right">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveRow(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
