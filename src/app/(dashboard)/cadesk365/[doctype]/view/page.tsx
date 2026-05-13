"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDoctypeMeta } from "@/lib/api/doctype";
import { DynamicList } from "@/components/dynamic/dynamic-list";
import { ErrorState } from "@/components/shared/error-state";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { toast } from "sonner";







export default function DynamicListPage() {
  const params = useParams();
  const router = useRouter();

  const doctype = decodeURIComponent(
    params.doctype as string
  );

  const {
    data: doctypeMeta,
    isLoading: metaLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["doctype-meta", doctype],
    queryFn: () => getDoctypeMeta(doctype),
    enabled: !!doctype,
  });

  const {
    permissions,
    isLoading: permissionsLoading,
  } = usePermissions(doctype);

  React.useEffect(() => {
    if (!permissionsLoading && permissions && !permissions.read) {
      toast.error("You do not have permission to access this page.");
      router.push("/dashboard");
    }
  }, [permissions, permissionsLoading, router]);

  if (metaLoading || permissionsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Loading {doctype}...
        </span>
      </div>
    );
  }

  // If no read permission, we are redirecting so render nothing/minimal
  if (permissions && !permissions.read) {
    return null;
  }

  if (isError || !doctypeMeta) {
    return (
      <div className="p-8">
        <ErrorState
          description={
            error?.message ||
            `Failed to load metadata for ${doctype}`
          }
          onRetry={refetch}
        />
      </div>
    );
  }

  return <DynamicList doctypeMeta={doctypeMeta} permissions={permissions!} />;
}