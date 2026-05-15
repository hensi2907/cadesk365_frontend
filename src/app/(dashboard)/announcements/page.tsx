"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Megaphone, ChevronRight, Info, Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { DetailDrawer } from "@/components/shared/detail-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getNewRecordRoute } from "@/lib/utils/route";
import { sanitizeHtml } from "@/lib/utils/sanitize";
export default function AnnouncementsPage() {
  const router = useRouter();
  const { isHighLevelUser } = useAuthStore();
  const [selectedNote, setSelectedNote] = React.useState<any | null>(null);

  // Fetch real data from dashboard API
  const { data: dashboardData, isLoading, isError } = useDashboard();

  const announcements = dashboardData?.note || [];

  return (
    <div className="space-y-8 fluid-container flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Announcements"
          description="Stay updated with the latest company news and important notices."
        />
        <div className="flex items-center gap-2">
          {announcements.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1 text-sm rounded-full shadow-sm !bg-primary/60">
              {announcements.length} Active {announcements.length === 1 ? 'Update' : 'Updates'}
            </Badge>
          )}
          {isHighLevelUser && (
            <Button size="sm" onClick={() => router.push(getNewRecordRoute("Note"))} className="!bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Announcement
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 flex-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border bg-card p-6 flex flex-col animate-pulse shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-muted/60" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted/60 rounded w-1/3" />
                  <div className="h-3 bg-muted/60 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <div className="h-5 bg-muted/60 rounded w-3/4" />
                <div className="h-4 bg-muted/60 rounded w-full" />
                <div className="h-4 bg-muted/60 rounded w-5/6" />
              </div>
              <div className="h-4 bg-muted/60 rounded w-1/2 mt-6" />
            </div>
          ))
        ) : announcements.length > 0 ? (
          announcements.map((note: any, idx: number) => {
            // Assigning some subtle background tints based on index for a premium feel
            const isFeatured = idx === 0;
            return (
              <div
                key={note.name}
                className={cn(
                  "group flex flex-col rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden relative",
                  isFeatured ? "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-primary/5 to-transparent border-primary/20" : ""
                )}
                onClick={() => setSelectedNote(note)}
              >
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform duration-500 group-hover:scale-150 group-hover:opacity-10">
                  <Megaphone className={cn("h-32 w-32 text-primary", isFeatured ? "h-48 w-48" : "")} />
                </div>

                <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    {isFeatured && (
                      <Badge className="bg-primary text-primary-foreground font-semibold px-2.5 py-0.5 rounded-full">
                        Latest
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className={cn(
                      "font-bold tracking-tight text-foreground mb-3 line-clamp-2",
                      isFeatured ? "text-2xl" : "text-xl"
                    )}>
                      {note.title}
                    </h3>
                    <div
                      className={cn(
                        "text-muted-foreground leading-relaxed line-clamp-3 mb-6",
                        isFeatured ? "text-base line-clamp-4" : "text-sm"
                      )}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
                    />
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {note.creation ? new Date(note.creation).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                    </span>
                    <span className="flex items-center text-sm font-semibold text-primary transition-all group-hover:gap-1.5 gap-1">
                      Read more <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-card/50">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">No Announcements</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              There are no active company announcements at this time. Check back later for updates.
            </p>
          </div>
        )}
      </div>

      <DetailDrawer
        open={!!selectedNote}
        onOpenChange={(open) => !open && setSelectedNote(null)}
        title="Announcement Details"
        subtitle={selectedNote?.name}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setSelectedNote(null)} className="w-full sm:w-auto">Close</Button>
          </div>
        }
      >
        {selectedNote && (
          <div className="space-y-8 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent">
                  <Megaphone className="h-3.5 w-3.5 mr-1.5" />
                  Official Update
                </Badge>
                {selectedNote.creation && (
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {new Date(selectedNote.creation).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-foreground leading-tight tracking-tight">
                {selectedNote.title || "Untitled Announcement"}
              </h2>
            </div>

            <div className="h-px bg-border/80 w-full" />

            <div
              className="prose prose-primary dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedNote.content || "") }}
            />
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
