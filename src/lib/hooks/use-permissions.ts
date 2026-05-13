import { useQuery } from "@tanstack/react-query";
import { getAllUserPermissions, DocTypePermissions } from "@/lib/api/permissions";

export function usePermissions(doctype: string) {
  const {
    data: permissions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DocTypePermissions>({
    queryKey: ["doctype-permissions", doctype],
    queryFn: () => getAllUserPermissions(doctype),
    enabled: !!doctype,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    permissions,
    isLoading,
    isError,
    error,
    refetch,
  };
}
