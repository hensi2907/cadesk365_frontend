"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Clipboard, Loader2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkField } from "@/components/shared/link-field";
import { ComplianceModal } from "@/components/shared/compliance-modal";
import { createDocument, fetchAPI } from "@/lib/api/client";
import { toast } from "sonner";

const COUNTRY_CODES = [
  { code: "+91", country: "IN", name: "India", minLength: 10, maxLength: 10 },
  { code: "+1", country: "US", name: "USA/Canada", minLength: 10, maxLength: 10 },
  { code: "+44", country: "GB", name: "UK", minLength: 10, maxLength: 11 },
  { code: "+971", country: "AE", name: "UAE", minLength: 9, maxLength: 9 },
  { code: "+61", country: "AU", name: "Australia", minLength: 9, maxLength: 9 },
  { code: "+65", country: "SG", name: "Singapore", minLength: 8, maxLength: 8 },
];

const baseClientSchema = z.object({
  salutation: z.string().optional(),
  customer_name: z.string().min(2, "Customer Name is required"),
  gender: z.string().optional(),
  customer_type: z.string().min(1, "Customer Type is required"),
  custom_business_entity: z.string().min(1, "Business Entity is required"),
  account_manager: z.string().min(1, "Account Manager is required"),
  custom_international: z.boolean(),
  custom_country: z.string().min(1, "Country is required"),

  country_code: z.string().default("+91"),
  customer_primary_contact: z.string().optional().or(z.literal("")),
  address_type: z.string(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional().or(z.literal("")),

  email_id: z.string().email("Invalid email format").optional().or(z.literal("")),
  custom_pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid PAN format").optional().or(z.literal("")),
  custom_aadhaar: z.string().regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits").optional().or(z.literal("")),
  custom_gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i, "Invalid GSTIN format").optional().or(z.literal("")),
  custom_cin: z.string().regex(/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/i, "Invalid CIN format").optional().or(z.literal("")),
});

const clientSchema = baseClientSchema.superRefine((data, ctx) => {
  // Pincode validation based on international status
  if (!data.custom_international && data.pincode) {
    if (!/^[1-9][0-9]{5}$/.test(data.pincode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indian PIN code must be 6 digits",
        path: ["pincode"],
      });
    }
  }

  // Phone number validation based on country code
  if (data.customer_primary_contact) {
    if (!/^\d+$/.test(data.customer_primary_contact)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number must contain only digits",
        path: ["customer_primary_contact"],
      });
      return;
    }

    const countryInfo = COUNTRY_CODES.find(c => c.code === data.country_code);
    if (countryInfo) {
      const len = data.customer_primary_contact.length;
      if (len < countryInfo.minLength || len > countryInfo.maxLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Must be ${countryInfo.minLength === countryInfo.maxLength ? countryInfo.minLength : `${countryInfo.minLength}-${countryInfo.maxLength}`} digits for ${countryInfo.name}`,
          path: ["customer_primary_contact"],
        });
      }
    }
  }
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function OnboardClientPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [success, setSuccess] = React.useState(false);
  const [savedName, setSavedName] = React.useState("");
  const [showComplianceModal, setShowComplianceModal] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema as any),
    mode: "onChange",
    defaultValues: {
      salutation: "",
      customer_name: "",
      gender: "",
      customer_type: "",
      custom_business_entity: "",
      account_manager: "",
      custom_international: false,
      custom_country: "India",

      country_code: "+91",
      customer_primary_contact: "",
      address_type: "Office",
      address_line1: "",
      address_line2: "",
      city: "",
      county: "",
      state: "",
      pincode: "",

      email_id: "",
      custom_pan: "",
      custom_aadhaar: "",
      custom_gstin: "",
      custom_cin: "",
    },
  });

  const isInternational = watch("custom_international");

  React.useEffect(() => {
    if (isInternational) {
      setValue("custom_country", "India"); // Force clear or reset if needed, but per html it sets it to India if NOT intl
    }
  }, [isInternational, setValue]);

  const onSubmit = async (data: ClientFormValues) => {
    try {
      // 1. Create Customer
      const customerDoc: any = {
        doctype: "Customer",
        customer_name: data.customer_name,
        customer_type: data.customer_type,
        salutation: data.salutation,
        gender: data.gender,
        custom_business_entity: data.custom_business_entity,
        account_manager: data.account_manager,
        custom_international: data.custom_international ? 1 : 0,
        custom_country: data.custom_country,
        custom_pan: data.custom_pan?.toUpperCase() || undefined,
        custom_aadhaar: data.custom_aadhaar || undefined,
        custom_gstin: data.custom_gstin?.toUpperCase() || undefined,
        custom_cin: data.custom_cin?.toUpperCase() || undefined,
        customer_primary_contact: data.customer_primary_contact || undefined,
      };

      const newCustomer = await createDocument(customerDoc);
      const customerId = newCustomer.name;

      // 2. Create Address
      if (data.address_line1 || data.city) {
        const addressDoc: any = {
          doctype: "Address",
          address_title: data.customer_name,
          address_type: data.address_type,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          city: data.city,
          county: data.county,
          state: data.state,
          pincode: data.pincode,
          country: data.custom_country,
          links: [{
            link_doctype: "Customer",
            link_name: customerId
          }]
        };
        await createDocument(addressDoc).catch(e => console.error("Address error", e));
      }

      // 3. Create Contact
      if (data.customer_primary_contact || data.email_id) {
        const contactDoc: any = {
          doctype: "Contact",
          first_name: data.customer_name,
          is_primary_contact: 1,
          links: [{
            link_doctype: "Customer",
            link_name: customerId
          }]
        };
        if (data.email_id) {
          contactDoc.email_ids = [{ email_id: data.email_id, is_primary: 1 }];
        }
        if (data.customer_primary_contact) {
          contactDoc.phone_nos = [{ phone: data.customer_primary_contact, is_primary_phone: 1, is_primary_mobile_no: 1 }];
        }
        await createDocument(contactDoc).catch(e => console.error("Contact error", e));
      }

      setSavedName(customerId);
      setSuccess(true);
      toast.success("Client created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create client");
    }
  };

  const nextStep = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["customer_name", "customer_type", "custom_business_entity", "account_manager", "custom_country"]);
    } else if (step === 2) {
      isValid = await trigger(["address_line1", "city", "state", "pincode"]);
    }
    if (isValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  if (success) {
    return (
      <div className="space-y-6 fluid-container">
        <PageHeader title="Onboard New Client" />
        <div className="flex flex-col items-center justify-center p-12 space-y-6 rounded-xl border bg-card text-center shadow-sm">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <Check className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Client "{watch("customer_name")}" created successfully!</h2>
          <p className="text-muted-foreground">
            Customer ID: <b>{savedName}</b>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Button onClick={() => setShowComplianceModal(true)} variant="default" className="!bg-primary/90 hover:bg-primary/90">
              <Clipboard className="mr-2 h-4 w-4" /> Add Compliance Services
            </Button>
            <Button onClick={() => { setSuccess(false); setStep(1); reset(); }} variant="outline">
              Onboard Another Client
            </Button>
            <Button onClick={() => router.push(`/app/customer/${encodeURIComponent(savedName)}`)} variant="outline">
              View in Desk
            </Button>
          </div>
        </div>

        <ComplianceModal
          open={showComplianceModal}
          onOpenChange={setShowComplianceModal}
          customerName={savedName}
          businessEntity={watch("custom_business_entity")}
          country={watch("custom_country")}
          onSuccess={() => setShowComplianceModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fluid-container">
      <PageHeader
        title="Onboard New Client"
        description="Create a new client profile and set up their initial compliance requirements."
      />

      <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 dark:bg-primary/10 text-primary/90 dark:text-primary/70 text-sm font-medium border border-primary/10 dark:border-primary/20">
        <Clipboard className="h-4 w-4" />
        <span>Step {step} of 3 &mdash; Fill all sections below &rarr; Save &rarr; Assign Compliance Services</span>
      </div>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: step >= s ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="rounded-xl border bg-card shadow-sm overflow-hidden">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary/90 dark:bg-primary/20 dark:text-primary/80 text-sm font-bold">1</span>
              Basic Information
            </h3>
            <div className="auto-grid auto-grid-lg">
              <div className="space-y-2">
                <Label>Salutation</Label>
                <LinkField doctype="Salutation" value={watch("salutation") || ""} onChange={v => setValue("salutation", v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name" className={errors.customer_name ? "text-destructive" : ""}>Customer Name <span className="text-destructive">*</span></Label>
                <Input id="customer_name" placeholder="e.g. Acme Pvt. Ltd." {...register("customer_name")} className={errors.customer_name ? "border-destructive" : ""} />
                {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <LinkField doctype="Gender" value={watch("gender") || ""} onChange={v => setValue("gender", v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_type" className={errors.customer_type ? "text-destructive" : ""}>Customer Type <span className="text-destructive">*</span></Label>
                <Select value={watch("customer_type")} onValueChange={v => setValue("customer_type", v as string, { shouldValidate: true })}>
                  <SelectTrigger className={errors.customer_type ? "w-full border-destructive" : "w-full"}><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Company">Company</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
                {errors.customer_type && <p className="text-xs text-destructive">{errors.customer_type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.custom_business_entity ? "text-destructive" : ""}>Business Entity <span className="text-destructive">*</span></Label>
                <LinkField error={!!errors.custom_business_entity} doctype="Business Entity" value={watch("custom_business_entity") || ""} onChange={v => setValue("custom_business_entity", v, { shouldValidate: true })} />
                {errors.custom_business_entity && <p className="text-xs text-destructive">{errors.custom_business_entity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className={errors.account_manager ? "text-destructive" : ""}>Account Manager <span className="text-destructive">*</span></Label>
                <LinkField error={!!errors.account_manager} doctype="User" searchFields={["name", "full_name"]} value={watch("account_manager") || ""} onChange={v => setValue("account_manager", v, { shouldValidate: true })} />
                {errors.account_manager && <p className="text-xs text-destructive">{errors.account_manager.message}</p>}
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-8">
                <Checkbox id="custom_international" checked={watch("custom_international")} onCheckedChange={v => setValue("custom_international", !!v)} />
                <Label htmlFor="custom_international">International</Label>
              </div>
              <div className="space-y-2">
                <Label className={errors.custom_country ? "text-destructive" : ""}>Country <span className="text-destructive">*</span></Label>
                <div className={!watch("custom_international") ? "opacity-70 pointer-events-none" : ""}>
                  <LinkField error={!!errors.custom_country} doctype="Country" value={watch("custom_country") || "India"} onChange={v => setValue("custom_country", v, { shouldValidate: true })} />
                </div>
                {errors.custom_country && <p className="text-xs text-destructive">{errors.custom_country.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary/90 dark:bg-primary/20 dark:text-primary/80 text-sm font-bold">2</span>
              Address & Location
            </h3>
            <div className="auto-grid auto-grid-lg">
              <div className="space-y-2">
                <Label htmlFor="customer_primary_contact" className={errors.customer_primary_contact ? "text-destructive" : ""}>Customer Primary Contact</Label>
                <div className="flex gap-2">
                  <Select value={watch("country_code")} onValueChange={v => setValue("country_code", v || "", { shouldValidate: true })}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} {c.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="customer_primary_contact"
                    placeholder="9876543210"
                    {...register("customer_primary_contact")}
                    className={`flex-1 ${errors.customer_primary_contact ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.customer_primary_contact && <p className="text-xs text-destructive">{errors.customer_primary_contact.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_type">Address Type</Label>
                <Select value={watch("address_type")} onValueChange={v => setValue("address_type", v as string)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-full">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input id="address_line1" placeholder="Building, Street, Area" {...register("address_line1")} />
              </div>
              <div className="space-y-2 col-span-full">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input id="address_line2" placeholder="" {...register("address_line2")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="e.g. Mumbai" {...register("city")} />
              </div>
              {isInternational && (
                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input id="county" placeholder="e.g. King County" {...register("county")} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="e.g. Maharashtra" {...register("state")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode" className={errors.pincode ? "text-destructive" : ""}>Pincode</Label>
                <Input id="pincode" placeholder="e.g. 400001" {...register("pincode")} className={errors.pincode ? "border-destructive" : ""} />
                {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary/90 dark:bg-primary/20 dark:text-primary/80 text-sm font-bold">3</span>
              Contact & Compliance IDs
            </h3>
            <div className="auto-grid auto-grid-lg">
              <div className="space-y-2">
                <Label htmlFor="email_id" className={errors.email_id ? "text-destructive" : ""}>Email ID</Label>
                <Input id="email_id" type="email" placeholder="contact@company.com" {...register("email_id")} className={errors.email_id ? "border-destructive" : ""} />
                {errors.email_id && <p className="text-xs text-destructive">{errors.email_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_pan">PAN Number</Label>
                <Input id="custom_pan" placeholder="e.g. ABCDE1234F" {...register("custom_pan", {
                  pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]$/i, message: "Invalid PAN format" }
                })} />
                {errors.custom_pan && <p className="text-xs text-destructive">{errors.custom_pan.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_aadhaar">Aadhaar Number</Label>
                <Input id="custom_aadhaar" placeholder="e.g. 123456789012" {...register("custom_aadhaar", {
                  pattern: { value: /^[0-9]{12}$/, message: "Must be 12 digits" }
                })} />
                {errors.custom_aadhaar && <p className="text-xs text-destructive">{errors.custom_aadhaar.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_gstin">GSTIN</Label>
                <Input id="custom_gstin" placeholder="e.g. 27ABCDE1234F1Z5" {...register("custom_gstin", {
                  pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i, message: "Invalid GSTIN" }
                })} />
                {errors.custom_gstin && <p className="text-xs text-destructive">{errors.custom_gstin.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_cin">CIN Number</Label>
                <Input id="custom_cin" placeholder="e.g. L12345MH2000PLC123456" {...register("custom_cin", {
                  pattern: { value: /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/i, message: "Invalid CIN format" }
                })} />
                {errors.custom_cin && <p className="text-xs text-destructive">{errors.custom_cin.message}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-muted/30 p-6 md:p-8 flex items-center justify-between border-t">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          ) : (
            <div></div> // Spacer
          )}

          {step < 3 ? (
            <Button type="button" onClick={nextStep} className="!bg-primary hover:!bg-primary/90 text-primary-foreground pointer-cursor">
              Next Step <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => handleSubmit(onSubmit)()}
              disabled={isSubmitting}
              className="!bg-primary hover:!bg-primary/90 text-primary-foreground"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Client
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
