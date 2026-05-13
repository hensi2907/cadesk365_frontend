import { useMemo } from "react";

/**
 * Safely evaluates Frappe's depends_on expressions to determine field visibility.
 * @param dependsOn The expression from Frappe (e.g. "eval:doc.status=='Closed'" or "status")
 * @param formData The complete form data object
 * @returns boolean indicating if the field should be visible
 */
export function useDependsOn(dependsOn: string | undefined | null, formData: any): boolean {
  return useMemo(() => {
    if (!dependsOn) return true; // Visible by default if no rule

    const rule = dependsOn.trim();

    if (rule.startsWith("eval:")) {
      const expression = rule.substring(5).trim();
      try {
        // We use a safe Function constructor to evaluate the expression.
        // In Frappe, expressions use `doc.` to reference the form data.
        const evaluator = new Function("doc", `
          try {
            return !!(${expression});
          } catch(e) {
            return false;
          }
        `);
        return evaluator(formData || {});
      } catch (e) {
        console.error("Failed to evaluate depends_on rule:", rule, e);
        return true; // Fallback to visible if evaluation fails
      }
    } else {
      // If it doesn't start with eval:, it's simply a truthy check on the fieldname
      return !!(formData && formData[rule]);
    }
  }, [dependsOn, formData]);
}
