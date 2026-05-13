import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LinkField } from "@/components/shared/link-field";
import { fetchAPI, createDocument } from "@/lib/api/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ComplianceModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName: string;
  businessEntity: string;
  country: string;
  onSuccess: () => void;
}

interface ComplianceRow {
  compliance: string;
  is_mandatory: boolean;
  type: string;
  freq: string;
  availableFreqs: string[];
  selected: boolean;
}

export function ComplianceModal({ open, onOpenChange, customerName, businessEntity, onSuccess }: ComplianceModalProps) {
  const [rows, setRows] = React.useState<ComplianceRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open && businessEntity) {
      loadProfile();
    } else {
      setRows([]);
    }
  }, [open, businessEntity]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Compliance Profile
      const res = await fetchAPI<any>(`/api/method/frappe.client.get?doctype=Compliance+Profile&name=${encodeURIComponent(businessEntity)}`);
      const compliances = res?.compliance_profile || [];

      const parsedRows: ComplianceRow[] = [];

      for (const c of compliances) {
        // 2. Fetch frequencies for each item
        const itemRes = await fetchAPI<any>(`/api/method/frappe.client.get?doctype=Item&name=${encodeURIComponent(c.compliance)}`).catch(() => null);
        const freqs = itemRes?.custom_compliance_due_date?.map((r: any) => r.frequency).filter(Boolean) || [];
        const uniqueFreqs = [...new Set(freqs)] as string[];

        parsedRows.push({
          compliance: c.compliance,
          is_mandatory: c.is_mandatory === 1,
          type: "Recursive",
          freq: c.frequency || (uniqueFreqs.length > 0 ? uniqueFreqs[0] : ""),
          availableFreqs: uniqueFreqs,
          selected: c.is_mandatory === 1,
        });
      }
      setRows(parsedRows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load compliance profile");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFrequencies = async (idx: number, itemName: string) => {
    try {
      const itemRes = await fetchAPI<any>(`/api/method/frappe.client.get?doctype=Item&name=${encodeURIComponent(itemName)}`).catch(() => null);
      const freqs = itemRes?.custom_compliance_due_date?.map((r: any) => r.frequency).filter(Boolean) || [];
      const uniqueFreqs = [...new Set(freqs)] as string[];
      setRows(prev => {
        const next = [...prev];
        next[idx].availableFreqs = uniqueFreqs;
        next[idx].freq = uniqueFreqs.length > 0 ? uniqueFreqs[0] : "";
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addCustom = () => {
    setRows([...rows, {
      compliance: "",
      is_mandatory: false,
      type: "Recursive",
      freq: "",
      availableFreqs: [],
      selected: true,
    }]);
  };

  const updateRow = (idx: number, updates: Partial<ComplianceRow>) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      // Clear frequency if type becomes One-time
      if (updates.type === "One-time") {
        next[idx].freq = "";
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const selectedRows = rows.filter(r => r.selected && r.compliance);
    if (!selectedRows.length) {
      toast.error("Please select at least one compliance.");
      return;
    }

    // Validate
    for (const row of selectedRows) {
      if (row.type === "Recursive" && !row.freq) {
        toast.error(`Frequency required for Recursive compliance: ${row.compliance}`);
        return;
      }
      if (row.type === "One-time" && row.freq) {
        toast.error(`Frequency should NOT be set for One-time: ${row.compliance}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      for (const row of selectedRows) {
        // Check existing
        const check = await fetchAPI<any[]>(`/api/method/frappe.client.get_list?doctype=Client+Service&filters=${encodeURIComponent(JSON.stringify({ customer: customerName, service: row.compliance, is_active: 1 }))}&limit_page_length=1`).catch(() => []);
        if (check && check.length > 0) continue;

        const today = new Date().toISOString().slice(0, 10);
        await createDocument({
          doctype: "Client Service",
          customer: customerName,
          service: row.compliance,
          compliance_type: row.type,
          frequency: row.freq || null,
          is_active: 1,
          start_date: today
        });
      }
      toast.success("Client Services created successfully!");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create Client Services");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl md:max-w-[800px] lg:max-w-[1000px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Compliances for {customerName}</DialogTitle>
          <DialogDescription>Assign initial compliance services to this client.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b">
                  <tr>
                    <th className="p-3 w-12">Select</th>
                    <th className="p-3">Compliance</th>
                    <th className="p-3 w-36">Type</th>
                    <th className="p-3 w-48">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="p-3 text-center">
                        <Checkbox checked={row.selected} onCheckedChange={(c) => updateRow(i, { selected: !!c })} />
                      </td>
                      <td className="p-3 font-medium">
                        {row.compliance ? row.compliance : (
                          <LinkField
                            doctype="Item"
                            searchFields={["name", "item_name"]}
                            value={row.compliance}
                            onChange={(val) => {
                              updateRow(i, { compliance: val });
                              loadFrequencies(i, val);
                            }}
                            placeholder="Search compliance..."
                          />
                        )}
                      </td>
                      <td className="p-3">
                        <Select value={row.type} onValueChange={(val) => updateRow(i, { type: val as string })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Recursive">Recursive</SelectItem>
                            <SelectItem value="One-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select value={row.freq} onValueChange={(val) => updateRow(i, { freq: val as string })} disabled={row.type === "One-time"}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {row.availableFreqs.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            {!row.availableFreqs.length && <SelectItem value="none" disabled>No frequencies</SelectItem>}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" className="w-full border-dashed !bg-primary/90 text-primary-foreground hover:!bg-primary/90 hover:text-primary-foreground" onClick={addCustom}>
              + Add Custom Compliance
            </Button>
          </div>
        )}

        <DialogFooter className="mt-6 flex justify-between items-center sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="!bg-primary/80 hover:bg-primary/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Client Services
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
