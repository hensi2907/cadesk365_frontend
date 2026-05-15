"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useQuery } from "@tanstack/react-query";
import { getCalendarData } from "@/lib/api/compliance";
import { Button } from "@/components/ui/button";
import { getRecordRoute } from "@/lib/utils/route";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState<number | null>(new Date().getDate());
  const [filters, setFilters] = React.useState({
    monthly: true,
    quarterly: true,
    annually: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => getCalendarData() as any,
  });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  const currentMonthStr = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Stats calculation
  const stats = React.useMemo(() => {
    if (!data) return { total: 0, monthly: 0, quarterly: 0, annually: 0 };
    let total = 0, monthly = 0, quarterly = 0, annually = 0;

    const currentMonthIdx = currentDate.getMonth();

    data.forEach((event: any) => {
      const eMonthIdx = MONTHS.findIndex(m => event.month?.startsWith(m.slice(0, 3)));
      if (eMonthIdx === currentMonthIdx) {
        total++;
        const freq = event.frequency?.toLowerCase() || "monthly";
        if (freq === "monthly") monthly++;
        if (freq === "quarterly") quarterly++;
        if (freq === "annually" || freq === "yearly") annually++;
      }
    });
    return { total, monthly, quarterly, annually };
  }, [data, currentDate]);

  // Map events to days and apply filters
  const eventsByDay = React.useMemo(() => {
    const map = new Map<number, typeof data>();
    if (!data) return map;

    const currentMonthIdx = currentDate.getMonth();

    data.forEach((event: any) => {
      const eMonthIdx = MONTHS.findIndex(m => event.month?.startsWith(m.slice(0, 3)));
      if (eMonthIdx === currentMonthIdx) {
        const freq = event.frequency?.toLowerCase() || "monthly";
        // Apply filters
        if (freq === "monthly" && !filters.monthly) return;
        if (freq === "quarterly" && !filters.quarterly) return;
        if ((freq === "annually" || freq === "yearly") && !filters.annually) return;

        let d = parseInt(event.date, 10);
        if (isNaN(d) || d === 0) d = daysInMonth; // default to last day if 0
        if (!map.has(d)) map.set(d, []);
        map.get(d)?.push(event);
      }
    });
    return map;
  }, [data, currentDate, filters, daysInMonth]);

  // Upcoming Events (next 5 events this month onwards)
  const upcomingEvents = React.useMemo(() => {
    if (!data) return [];
    const today = new Date();
    const upcomingList: any[] = [];

    data.forEach((e: any) => {
      const eMonthIdx = MONTHS.findIndex(m => e.month?.startsWith(m.slice(0, 3)));
      if (eMonthIdx === -1) return;

      // Calculate how many months from today
      let offset = eMonthIdx - today.getMonth();
      if (offset < 0) offset += 12; // Next year

      let d = parseInt(e.date, 10);
      if (isNaN(d) || d === 0) {
        const targetYear = today.getFullYear() + (eMonthIdx < today.getMonth() ? 1 : 0);
        d = new Date(targetYear, eMonthIdx + 1, 0).getDate();
      }

      // If it's the current month but date has passed, it belongs to NEXT year
      if (offset === 0 && d < today.getDate()) {
        offset = 12;
      }

      const targetYear = today.getFullYear() + Math.floor((today.getMonth() + offset) / 12);

      upcomingList.push({
        ...e,
        date: d,
        targetMonthIdx: eMonthIdx,
        targetYear: targetYear,
        sortKey: targetYear * 10000 + eMonthIdx * 100 + d
      });
    });

    upcomingList.sort((a, b) => a.sortKey - b.sortKey);

    // Format the display month for the events
    return upcomingList.slice(0, 5).map(e => ({
      ...e,
      month: MONTHS[e.targetMonthIdx].slice(0, 3)
    }));
  }, [data]);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getEventStyle = (frequency: string) => {
    const f = frequency?.toLowerCase() || "monthly";
    if (f === "annually") return { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20" };
    if (f === "quarterly") return { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" };
    return { dot: "bg-primary", text: "text-primary dark:text-primary", bg: "bg-primary/5 dark:bg-primary/10", border: "border-primary/20" };
  };

  return (
    <div className="space-y-6 fluid-container h-full flex flex-col">
      <PageHeader
        title="Compliance Calendar"
        description="Track and manage statutory compliance due dates."
      />

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Events This Month"
          value={stats.total.toString()}
          icon={CalendarIcon}
          variant="info"
          description="Total compliance due"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Events"
          value={stats.monthly.toString()}
          icon={Clock}
          variant="default"
          description="Recurring monthly"
          isLoading={isLoading}
        />
        <StatCard
          title="Quarterly Events"
          value={stats.quarterly.toString()}
          icon={CheckCircle2}
          variant="warning"
          description="Recurring quarterly"
          isLoading={isLoading}
        />
        <StatCard
          title="Annual Events"
          value={stats.annually.toString()}
          icon={Filter}
          variant="danger"
          description="Recurring annually"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[700px]">

        {/* Left/Main Column - Calendar */}
        <div className="lg:col-span-3 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden h-full">
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {currentDate.toLocaleString('default', { month: 'long' })}
              <span className="text-muted-foreground font-medium">{currentYear}</span>
            </h2>
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0 rounded-md hover:bg-background shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 px-3 text-xs font-semibold rounded-md hover:bg-background shadow-sm">
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0 rounded-md hover:bg-background shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b bg-muted/20">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="py-2 md:py-3 text-center text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-border gap-px">
            {blanks.map(b => (
              <div key={`b-${b}`} className="bg-card/50 min-h-[60px] md:min-h-[140px]" />
            ))}

            {days.map(day => {
              const isToday = day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              const events = eventsByDay.get(day) || [];
              console.log("events", events)

              const isSelected = selectedDay === day;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "bg-card min-h-[60px] md:min-h-[140px] p-1 md:p-2 flex flex-col transition-all hover:bg-muted/30 group relative cursor-pointer md:cursor-default",
                    isToday && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                    isSelected && "ring-2 ring-inset ring-primary/50 md:ring-0 md:ring-transparent"
                  )}
                >
                  <div className="flex justify-center md:justify-between items-start mb-1 md:mb-1.5">
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold transition-colors",
                      isToday ? "bg-primary text-primary-foreground shadow-md" :
                        isSelected ? "bg-primary/20 text-primary md:bg-transparent md:text-foreground/80" :
                          "text-foreground/80 group-hover:text-primary group-hover:bg-primary/10"
                    )}>
                      {day}
                    </span>
                    {events.length > 0 && (
                      <span className="hidden md:inline-flex text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {events.length} due
                      </span>
                    )}
                  </div>

                  {/* Mobile Event Dots */}
                  {events.length > 0 && (
                    <div className="flex md:hidden flex-wrap gap-0.5 justify-center mt-auto pb-1">
                      {events.slice(0, 3).map((e: any, i: number) => (
                        <div key={i} className={cn("h-1.5 w-1.5 rounded-full", getEventStyle(e.frequency).dot)} />
                      ))}
                      {events.length > 3 && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
                    </div>
                  )}

                  {/* Scrollable Event List (Desktop) */}
                  <div className="hidden md:flex flex-1 overflow-y-auto pr-1 flex-col space-y-1.5 custom-scrollbar pb-2 max-h-[120px]">
                    {events.map((e: any, i: number) => {
                      const style = getEventStyle(e.frequency);
                      return (
                        <Popover key={i}>
                          <PopoverTrigger className="w-full text-left">
                            <div className={cn(
                              "flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] font-medium transition-all hover:shadow-sm",
                              style.bg, style.border, style.text
                            )}>
                              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
                              <span className="truncate flex-1">{e.item}</span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 rounded-xl shadow-xl overflow-hidden" align="start" side="right">
                            <div className={cn("border-b px-4 py-3 flex items-start gap-3", style.bg)}>
                              <div className={cn("mt-1 h-2 w-2 rounded-full", style.dot)} />
                              <div>
                                <h4 className="font-semibold text-foreground text-sm leading-tight">{e.item}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{e.frequency} Compliance</p>
                              </div>
                            </div>
                            <div className="p-4 space-y-3 bg-card text-sm">
                              <div className="flex justify-between items-center py-1 border-b border-border/50">
                                <span className="text-muted-foreground">Due Date</span>
                                <span className="font-bold text-foreground">{e.date} {e.month}</span>
                              </div>
                              {/* <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Customer</span>
                                <span className="font-medium">{e.customer || "N/A"}</span>
                              </div> */}
                              <div className="pt-2">
                                <Button size="sm" className="w-full rounded-lg shadow-sm !bg-primary"
                                  onClick={() => window.location.href = getRecordRoute("Item", e.item)}
                                >View Details</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Selected Day Events Panel */}
          <div className="block md:hidden border-t bg-muted/10 p-4">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              {selectedDay} {currentMonthStr} {currentYear}
              {eventsByDay.get(selectedDay || 0)?.length ? (
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {eventsByDay.get(selectedDay || 0)?.length} Events
                </span>
              ) : null}
            </h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {eventsByDay.get(selectedDay || 0)?.length ? (
                eventsByDay.get(selectedDay || 0)?.map((e: any, idx: number) => {
                  const style = getEventStyle(e.frequency);
                  return (
                    <div key={idx} className="flex flex-col p-3 rounded-xl border bg-card shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                      onClick={() => window.location.href = getRecordRoute("Item", e.item)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
                          <span className="font-semibold text-sm leading-tight">{e.item}</span>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span className={cn("px-2 py-0.5 rounded-md font-medium", style.bg, style.text)}>
                          {e.frequency}
                        </span>
                        {e.customer && <span className="truncate max-w-[120px]">For: {e.customer}</span>}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 flex flex-col items-center text-center text-muted-foreground bg-card rounded-xl border border-dashed">
                  <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No events planned</p>
                  <p className="text-xs opacity-70 mt-1">Select a different date</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Filters Card */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4 text-foreground font-bold">
              <Filter className="h-4 w-4 text-primary" />
              <h3>Filters</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => toggleFilter("monthly")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                  filters.monthly ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Monthly
                </div>
                {filters.monthly && <CheckCircle2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => toggleFilter("quarterly")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                  filters.quarterly ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Quarterly
                </div>
                {filters.quarterly && <CheckCircle2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => toggleFilter("annually")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                  filters.annually ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Annually
                </div>
                {filters.annually && <CheckCircle2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="rounded-xl border bg-card shadow-sm p-0 flex flex-col flex-1 min-h-[300px]">
            <div className="p-5 border-b flex items-center gap-2 font-bold">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3>Upcoming Schedule</h3>
            </div>

            <div className="p-2 flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingEvents.map((e: any, idx: number) => {
                    const style = getEventStyle(e.frequency);
                    return (
                      <div key={idx} className="group flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = getRecordRoute("Item", e.item)}
                      >
                        <div className="flex flex-col items-center justify-center w-10 shrink-0 bg-background rounded-md py-1 border shadow-sm group-hover:border-primary/20 transition-colors">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{e.month}</span>
                          <span className="text-sm font-black text-foreground">{e.date}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {e.item}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {e.frequency}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* <div className="p-3 border-t bg-muted/10 mt-auto">
              <Button variant="outline" className="w-full text-xs font-bold" size="sm" onClick={() => window.location.href = "/cadesk365/client-service/view"}>
                View All Schedule
              </Button>
            </div> */}
          </div>

        </div>
      </div>
    </div>
  );
}
