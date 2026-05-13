"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterOption } from "@/components/shared/filter-bar";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { useQuery } from "@tanstack/react-query";
import { getClientDocuments } from "@/lib/api/notifications";
import type { ClientDocument } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, Download, ExternalLink, Image as ImageIcon, File as FileIcon, LayoutGrid, LayoutList, Eye, FileSpreadsheet, FileArchive, SearchX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePermissions } from "@/lib/hooks/use-permissions";
import Link from "next/link";

export default function DocumentsPage() {
  const { permissions } = usePermissions("Client Document");
  const [selectedDoc, setSelectedDoc] = React.useState<ClientDocument | null>(null);
  const [previewDoc, setPreviewDoc] = React.useState<ClientDocument | null>(null);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: () => getClientDocuments(),
  });

  const documents = data?.documents || [];

  const filteredDocs = React.useMemo(() => {
    return documents.filter((doc: ClientDocument) => {
      if (filters.search && !doc.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(doc.description || "").toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.client && doc.client !== filters.client) return false;
      if (filters.type && doc.document_type !== filters.type) return false;
      return true;
    });
  }, [documents, filters]);

  const groupedDocs = React.useMemo(() => {
    const groups: Record<string, ClientDocument[]> = {};
    filteredDocs.forEach((doc: ClientDocument) => {
      const client = doc.client || "Uncategorized";
      if (!groups[client]) groups[client] = [];
      groups[client].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  const getFileUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://192.168.1.150:8000";
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getFileIcon = (docType: string, fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon className="h-6 w-6" />;
    if (['pdf'].includes(ext || '')) return <FileText className="h-6 w-6" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="h-6 w-6" />;
    if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) return <FileArchive className="h-6 w-6" />;
    return <FileIcon className="h-6 w-6" />;
  };

  const isPreviewable = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext || '');
  };

  const handleDownload = (doc: ClientDocument | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!doc || !doc.attach_document) return;

    const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://192.168.1.150:8000";
    // Using Frappe's built-in download endpoint to force download headers
    const downloadUrl = `${baseUrl}/api/method/frappe.core.doctype.file.file.download_file?file_url=${encodeURIComponent(doc.attach_document)}`;

    window.location.href = downloadUrl;
  };

  const columns: ColumnDef<ClientDocument>[] = [
    {
      accessorKey: "name",
      header: "Ref ID",
      cell: ({ row }) => <span className="font-medium text-xs text-muted-foreground">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "document_type",
      header: "Type",
      cell: ({ row }) => {
        const fileName = row.original.attach_document?.split('/').pop();
        return (
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="text-primary/70">{getFileIcon(row.getValue("document_type"), fileName)}</span>
            {row.getValue("document_type")}
          </span>
        );
      },
    },
    {
      accessorKey: "client",
      header: "Client",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-muted-foreground truncate max-w-[200px] block">{row.getValue("description") || "—"}</span>,
    },
    {
      accessorKey: "creation",
      header: "Uploaded On",
      cell: ({ row }) => {
        const d = new Date(row.getValue("creation") as string);
        return <span>{format(d, "MMM d, yyyy")}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          {isPreviewable(row.original.attach_document) && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={(e) => {
              e.stopPropagation();
              setPreviewDoc(row.original);
            }}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Preview</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={(e) => handleDownload(row.original, e)}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      ),
    },
  ];

  const filterOptions: FilterOption[] = [
    {
      key: "search",
      label: "Search",
      type: "search",
      placeholder: "Search documents...",
    },
    {
      key: "client",
      label: "Client",
      type: "select",
      options: (data?.clients || []).map((c: string) => ({ label: c, value: c })),
    },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: Array.from(new Set(documents.map((d: ClientDocument) => d.document_type))).map((t) => ({ label: String(t), value: String(t) })),
    },
  ];

  const DocumentCard = ({ doc }: { doc: ClientDocument }) => {
    const fileName = doc.attach_document?.split('/').pop();
    const canPreview = isPreviewable(doc.attach_document);

    return (
      <div
        className="group relative flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
        onClick={() => setSelectedDoc(doc)}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
            {getFileIcon(doc.document_type, fileName)}
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {canPreview && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setPreviewDoc(doc)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDownload(doc, e)}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-base line-clamp-1">{doc.document_type}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1" title={fileName}>{fileName || "Document"}</p>
        </div>

        <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80 line-clamp-1 max-w-[60%]">{doc.client}</span>
          <span>{format(new Date(doc.creation), "MMM d, yyyy")}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Document Repository"
          description="Manage and access client compliance documents securely."
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted p-1 rounded-lg border">
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3 h-8 shadow-none transition-all", viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3 h-8 shadow-none transition-all", viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
          {permissions?.create && (
            <Link href="/cadesk365/client-document/new">
              <Button size="sm" className="h-10 shadow-sm font-semibold !bg-primary/80">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </Link>
          )}
        </div>
      </div>

      <FilterBar
        filters={filterOptions}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
        onReset={() => setFilters({})}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-xl bg-card border animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex justify-center py-12">
          <Button onClick={() => refetch()}>Retry Loading Documents</Button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-dashed">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No documents found</h3>
          <p className="text-muted-foreground text-sm max-w-sm text-center mt-2">Try adjusting your filters or search terms to find what you're looking for.</p>
          {(filters.search || filters.client || filters.type) && (
            <Button variant="outline" className="mt-6" onClick={() => setFilters({})}>Clear Filters</Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([client, docs]) => (
            <div key={client} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                {client}
                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  {docs.length} {docs.length === 1 ? 'file' : 'files'}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {docs.map(doc => (
                  <DocumentCard key={doc.name} doc={doc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([client, docs]) => (
            <div key={client} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {client}
                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  {docs.length}
                </span>
              </h2>
              <DataTable
                columns={columns}
                data={docs}
                onRowClick={(row: any) => setSelectedDoc(row)}
                hideToolbar
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between bg-card">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                {previewDoc && getFileIcon(previewDoc.document_type, previewDoc.attach_document?.split('/').pop())}
                <span className="truncate max-w-sm inline-block">{previewDoc?.attach_document?.split('/').pop() || "Document Preview"}</span>
              </DialogTitle>
              <DialogDescription>
                {previewDoc?.document_type} • {previewDoc?.client}
              </DialogDescription>
            </div>
            <Button onClick={(e) => handleDownload(previewDoc, e)} className="shrink-0 mr-6 !bg-primary">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-muted/30 relative flex items-center justify-center p-4 overflow-hidden">
            {previewDoc && (
              (() => {
                const url = getFileUrl(previewDoc.attach_document);
                const ext = previewDoc.attach_document?.split('.').pop()?.toLowerCase();

                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
                  return <img src={url} alt={previewDoc.document_type} className="max-w-full max-h-full object-contain rounded-md shadow-sm" />;
                } else if (ext === 'pdf') {
                  return <iframe src={url} className="w-full h-full rounded-md shadow-sm border bg-white" title={previewDoc.document_type} />;
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto bg-card rounded-2xl border border-dashed shadow-sm">
                      <div className="h-20 w-20 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 ring-8 ring-primary/5">
                        {getFileIcon(previewDoc.document_type, previewDoc.attach_document?.split('/').pop())}
                      </div>
                      <h3 className="text-xl font-bold mb-2">Preview Not Available</h3>
                      <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                        This file format ({ext?.toUpperCase() || 'Unknown'}) requires a native application to view. Please download it to your device to open it.
                      </p>
                      <Button onClick={(e) => handleDownload(previewDoc, e)} size="lg" className="rounded-xl font-semibold shadow-md">
                        <Download className="mr-2 h-5 w-5" />
                        Download File
                      </Button>
                    </div>
                  );
                }
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Drawer */}
      <DetailDrawer
        open={!!selectedDoc}
        onOpenChange={(o) => !o && setSelectedDoc(null)}
        title="Document Details"
        subtitle={selectedDoc?.name}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setSelectedDoc(null)}>Close</Button>

            {selectedDoc && isPreviewable(selectedDoc.attach_document) && (
              <Button variant="outline" onClick={() => {
                setPreviewDoc(selectedDoc);
                setSelectedDoc(null);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}

            <Button onClick={(e) => handleDownload(selectedDoc, e)} className="!bg-primary">
              <Download className="mr-2 h-4 w-4 " />
              Download
            </Button>
          </div>
        }
      >
        {selectedDoc && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {getFileIcon(selectedDoc.document_type, selectedDoc.attach_document?.split('/').pop())}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-semibold">{selectedDoc.document_type}</h3>
                <p className="text-sm text-muted-foreground truncate">{selectedDoc.attach_document?.split('/').pop() || "Document"}</p>
              </div>
            </div>

            <div className="grid gap-6 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Client</div>
                <div className="font-medium">{selectedDoc.client}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Uploaded On</div>
                <div className="font-medium">{format(new Date(selectedDoc.creation), "PPP p")}</div>
              </div>
              {selectedDoc.modified && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Last Modified</div>
                  <div className="font-medium">{format(new Date(selectedDoc.modified), "PPP p")}</div>
                </div>
              )}
              {selectedDoc.reference_record && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Linked Record</div>
                  <div className="font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                    onClick={() => window.location.href = `/compliance-tracker/${selectedDoc?.reference_record}`}
                  >
                    {selectedDoc.reference_record}
                  </div>
                </div>
              )}
              <div className="col-span-full">
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <div className="font-medium">{selectedDoc.description || "No description provided."}</div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
