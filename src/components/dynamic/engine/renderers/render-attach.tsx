import * as React from "react";
import { Input } from "@/components/ui/input";
import type { BaseRendererProps } from "../engine.types";
import { uploadFile } from "@/lib/api/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function RenderAttach({ field, value, onChange, isReadOnly, labelNode }: BaseRendererProps) {
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadFile(file, undefined, undefined, field.fieldname);
      onChange(result.file_url);
      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col">
      {labelNode}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="file"
            accept={field.fieldtype === "Attach Image" ? "image/*" : undefined}
            onChange={handleUpload}
            disabled={isReadOnly || isUploading}
            className={isUploading ? "opacity-50 pr-10" : ""}
          />
          {isUploading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {value && typeof value === 'string' && (
          <a href={value} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate max-w-[150px]">
            {value.split('/').pop()}
          </a>
        )}
      </div>
    </div>
  );
}
