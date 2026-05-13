// "use client";

// import * as React from "react";
// import { useQuery } from "@tanstack/react-query";
// import { getDoctypeMeta, getDoctypeRecord } from "@/lib/api/doctype";
// import { DynamicForm } from "@/components/dynamic/dynamic-form";
// import { ErrorState } from "@/components/shared/error-state";
// import { Loader2 } from "lucide-react";

// export default function DynamicRecordPage({ params }: { params: { doctype: string; name: string } }) {
//   const doctype = decodeURIComponent(params.doctype);
//   const name = decodeURIComponent(params.name);
//   const isNew = name.toLowerCase() === "new";

//   const { data: doctypeMeta, isLoading: metaLoading, isError: metaError, error: mError, refetch: refetchMeta } = useQuery({
//     queryKey: ["doctype-meta", doctype],
//     queryFn: () => getDoctypeMeta(doctype),
//   });

//   const { data: recordData, isLoading: recordLoading, isError: recordError, error: rError, refetch: refetchRecord } = useQuery({
//     queryKey: ["doctype-record", doctype, name],
//     queryFn: () => getDoctypeRecord(doctype, name),
//     enabled: !isNew && !!doctypeMeta,
//   });

//   if (metaLoading || (recordLoading && !isNew)) {
//     return (
//       <div className="flex h-[400px] items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         <span className="ml-2 text-muted-foreground">Loading {isNew ? "form" : name}...</span>
//       </div>
//     );
//   }

//   if (metaError || !doctypeMeta) {
//     return (
//       <div className="p-8">
//         <ErrorState
//           description={mError?.message || `Failed to load metadata for ${doctype}`}
//           onRetry={refetchMeta}
//         />
//       </div>
//     );
//   }

//   if (!isNew && (recordError || !recordData)) {
//     return (
//       <div className="p-8">
//         <ErrorState
//           description={rError?.message || `Failed to load record ${name}`}
//           onRetry={refetchRecord}
//         />
//       </div>
//     );
//   }

//   return <DynamicForm doctypeMeta={doctypeMeta} initialData={recordData} isNew={isNew} />;
// }


"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getDoctypeMeta,
  getDoctypeRecord,
} from "@/lib/api/doctype";

import { DynamicForm } from "@/components/dynamic/dynamic-form";
import { ErrorState } from "@/components/shared/error-state";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DynamicRecordPage() {
  const params = useParams();

  const doctype = decodeURIComponent(
    params.doctype as string
  );

  const name = decodeURIComponent(
    params.name as string
  );

  const isNew = name.toLowerCase() === "new";
  const router = useRouter();

  const {
    data: doctypeMeta,
    isLoading: metaLoading,
    isError: metaError,
    error: mError,
    refetch: refetchMeta,
  } = useQuery({
    queryKey: ["doctype-meta", doctype],
    queryFn: () => getDoctypeMeta(doctype),
    enabled: !!doctype,
  });

  const {
    data: recordData,
    isLoading: recordLoading,
    isError: recordError,
    error: rError,
    refetch: refetchRecord,
  } = useQuery({
    queryKey: ["doctype-record", doctype, name],
    queryFn: () => getDoctypeRecord(doctype, name),
    enabled: !isNew && !!doctypeMeta,
  });

  const {
    permissions,
    isLoading: permissionsLoading,
  } = usePermissions(doctype);

  React.useEffect(() => {
    if (!permissionsLoading && permissions) {
      if (isNew && !permissions.create) {
        toast.error("You do not have permission to create this record.");
        router.push("/dashboard");
      } else if (!isNew && !permissions.read) {
        toast.error("You do not have permission to access this record.");
        router.push("/dashboard");
      }
    }
  }, [permissions, permissionsLoading, isNew, router]);

  if (metaLoading || (recordLoading && !isNew) || permissionsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <span className="ml-2 text-muted-foreground">
          Loading {isNew ? "form" : name}...
        </span>
      </div>
    );
  }

  // If redirecting due to lack of permissions, render minimal content
  if (permissions) {
    if (isNew && !permissions.create) return null;
    if (!isNew && !permissions.read) return null;
  }

  if (metaError || !doctypeMeta) {
    return (
      <div className="p-8">
        <ErrorState
          description={
            mError?.message ||
            `Failed to load metadata for ${doctype}`
          }
          onRetry={refetchMeta}
        />
      </div>
    );
  }

  if (!isNew && (recordError || !recordData)) {
    return (
      <div className="p-8">
        <ErrorState
          description={
            rError?.message ||
            `Failed to load record ${name}`
          }
          onRetry={refetchRecord}
        />
      </div>
    );
  }

  return (
    <DynamicForm
      doctypeMeta={doctypeMeta}
      initialData={recordData}
      isNew={isNew}
      permissions={permissions!}
    />
  );
}