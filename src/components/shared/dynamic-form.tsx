/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useForm, DefaultValues, FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type FieldConfig<T> = {
  name: Path<T>;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "textarea" | "checkbox" | "date";
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
  disabled?: boolean;
  className?: string;
};

interface DynamicFormProps<T extends FieldValues> {
  schema: z.ZodType<any, any>;
  defaultValues: DefaultValues<T>;
  fields: FieldConfig<T>[];
  onSubmit: (data: T) => Promise<void> | void;
  submitLabel?: string;
  loadingLabel?: string;
  className?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  gridCols?: 1 | 2;
}

export function DynamicForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  onSubmit,
  submitLabel = "Submit",
  loadingLabel = "Submitting...",
  className,
  onCancel,
  cancelLabel = "Cancel",
  gridCols = 1,
}: DynamicFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const handleFormSubmit = async (data: T) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      <div className={cn(
        "grid gap-6",
        gridCols === 2 ? "sm:grid-cols-2" : "grid-cols-1"
      )}>
        {fields.map((field) => {
          const error = errors[field.name]?.message as string | undefined;

          // Full width exceptions
          const isFullWidth = field.type === "textarea" || field.type === "checkbox" || gridCols === 1;

          return (
            <div
              key={String(field.name)}
              className={cn("space-y-2", isFullWidth && "sm:col-span-2", field.className)}
            >
              {field.type !== "checkbox" && (
                <Label
                  htmlFor={String(field.name)}
                  className={cn(error && "text-destructive")}
                >
                  {field.label}
                </Label>
              )}

              {field.type === "text" || field.type === "email" || field.type === "password" || field.type === "number" || field.type === "date" ? (
                <Input
                  id={String(field.name)}
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled={field.disabled || isSubmitting}
                  className={cn(error && "border-destructive focus-visible:ring-destructive")}
                  {...register(field.name, {
                    valueAsNumber: field.type === "number",
                  })}
                />
              ) : field.type === "textarea" ? (
                <Textarea
                  id={String(field.name)}
                  placeholder={field.placeholder}
                  disabled={field.disabled || isSubmitting}
                  className={cn("min-h-[100px]", error && "border-destructive focus-visible:ring-destructive")}
                  {...register(field.name)}
                />
              ) : field.type === "select" ? (
                <Select
                  disabled={field.disabled || isSubmitting}
                  onValueChange={(val) => setValue(field.name, val as any, { shouldValidate: true })}
                  value={watch(field.name) as string | undefined}
                  defaultValue={defaultValues[field.name as keyof DefaultValues<T>] as string | undefined}
                >
                  <SelectTrigger
                    id={String(field.name)}
                    className={cn(error && "border-destructive focus-visible:ring-destructive")}
                  >
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "checkbox" ? (
                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <Checkbox
                    id={String(field.name)}
                    disabled={field.disabled || isSubmitting}
                    checked={!!watch(field.name)}
                    onCheckedChange={(checked) => setValue(field.name, checked as any, { shouldValidate: true })}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor={String(field.name)}>{field.label}</Label>
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {field.description && field.type !== "checkbox" && (
                <p className="text-[0.8rem] text-muted-foreground">{field.description}</p>
              )}

              {error && (
                <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto !bg-primary hover:bg-primary/90"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? loadingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
