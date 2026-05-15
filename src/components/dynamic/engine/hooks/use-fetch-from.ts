import { useMemo } from "react";
import { getDoctypeValue } from "@/lib/api/doctype";
import type { DocField } from "@/types/frappe";

export function useFetchFrom(fields: DocField[]) {
  const fetchFromMap = useMemo(() => {
    const map: Record<string, { targetField: string; sourcePath: string }[]> = {};
    fields.forEach((f) => {
      if (f.fetch_from) {
        const parts = f.fetch_from.split(".");
        if (parts.length === 2) {
          const [sourceField, sourcePath] = parts;
          if (!map[sourceField]) map[sourceField] = [];
          map[sourceField].push({ targetField: f.fieldname, sourcePath });
        }
      }
    });
    return map;
  }, [fields]);

  const handleFetchFrom = async (
    fieldname: string,
    value: any,
    onUpdate: (updates: Record<string, any>) => void
  ) => {
    const targets = fetchFromMap[fieldname];
    if (targets && targets.length > 0) {
      if (!value) {
        const updates: Record<string, any> = {};
        targets.forEach((f) => (updates[f.targetField] = ""));
        onUpdate(updates);
        return;
      }

      const sourceFieldMeta = fields.find((f) => f.fieldname === fieldname);
      if (
        sourceFieldMeta &&
        sourceFieldMeta.fieldtype === "Link" &&
        sourceFieldMeta.options
      ) {
        const targetDoctype = sourceFieldMeta.options;
        const targetFields = targets.map((f) => f.sourcePath);

        try {
          // If multiple fields fetch from the same source, fetch them all in one call
          const fetchedData = await getDoctypeValue(
            targetDoctype,
            value,
            targetFields.length === 1 ? targetFields[0] : targetFields
          );

          if (fetchedData !== undefined && fetchedData !== null) {
            const updates: Record<string, any> = {};
            targets.forEach((f) => {
              let val;
              if (
                typeof fetchedData === "object" &&
                fetchedData !== null &&
                f.sourcePath in fetchedData
              ) {
                val = fetchedData[f.sourcePath];
              } else if (targets.length === 1) {
                // If only one field was requested, fetchedData might be the value itself
                val = fetchedData;
              }

              if (val !== undefined) {
                updates[f.targetField] = val;
              }
            });
            onUpdate(updates);
          }
        } catch (err) {
          console.error(`Fetch from failed for ${fieldname} -> ${value}`, err);
        }
      }
    }
  };

  return { handleFetchFrom };
}
