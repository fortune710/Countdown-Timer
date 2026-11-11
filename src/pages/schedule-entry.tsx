import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ScheduleCard } from "../components/schedule-item";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarBlank, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

interface ScheduleItem {
  title: string,
  duration: number
  id: string
}

interface ScheduleEntryPageProps {
  currentEventIndex: number;
  schedules: Array<ScheduleItem>;
  addSchedule: (title: string, durationInSeconds: number) => void;
  deleteSchedule: (id: string) => void;
  updateSchedule: (id: string, title: string, durationInSeconds: number) => void;
  reorderSchedules: (updatedSchedules: ScheduleItem[]) => void;
}

export default function ScheduleEntryPage({
  currentEventIndex,
  schedules,
  addSchedule,
  deleteSchedule,
  updateSchedule,
  reorderSchedules
}: ScheduleEntryPageProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const interval = window.setInterval(updateClock, 15_000);
    window.addEventListener("focus", updateClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateClock);
    };
  }, []);

  const totalDurationSeconds = schedules.reduce((total, moment) => total + moment.duration, 0);
  const estimatedEnd = new Date(now.getTime() + totalDurationSeconds * 1000);
  const estimatedEndLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(estimatedEnd);

  const handleAddSchedule = () => {
    // Validation for title and duration
    if (!newTitle.trim()) {
      toast.error("Moment title is required.", {
        description: "Give this part of the service a title."
      });
      return;
    }

    // Title uniqueness validation (optional)
    if (schedules.some(item => item.title.trim().toLowerCase() === newTitle.trim().toLowerCase())) {
      toast.error("Moment title must be unique.", {
        description: "A service moment with this title already exists."
      });
      return;
    }

    if (!newDuration.trim()) {
      toast.error("Moment duration is required.", {
        description: "Please enter a duration in minutes."
      });
      return;
    }

    const durationNum = Number(newDuration);
    if (
      isNaN(durationNum) ||
      !Number.isFinite(durationNum) ||
      durationNum <= 0 ||
      !/^\d+$/.test(newDuration.trim()) ||
      durationNum > 1440
    ) {
      toast.error("Invalid duration.", {
        description: "Please enter a valid duration in whole minutes (1-1440)."
      });
      return;
    }

    addSchedule(newTitle.trim(), durationNum * 60);
    setNewTitle("");
    setNewDuration("");
  };

  const onDeleteSchedule = (id: string) => {
    deleteSchedule(id);
  };

  const onUpdateSchedule = (id: string, title: string, duration: number) => {
    updateSchedule(id, title, duration);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = schedules.findIndex((item) => item.id === active.id);
    const newIndex = schedules.findIndex((item) => item.id === over.id);

    const updatedSchedules = arrayMove(schedules, oldIndex, newIndex);
    reorderSchedules(updatedSchedules);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <main className="schedule-page">
        <header className="page-heading">
          <div><p className="page-eyebrow">SUNDAY SERVICE</p><h1>Order of service</h1><p>Plan each moment of worship and keep the service flowing.</p></div>
          {schedules.length > 0 && (
            <Card className="estimated-end-card">
              <CardContent className="estimated-end-content">
                <div className="estimated-end-icon"><Clock size={20} aria-hidden="true" /></div>
                <div className="estimated-end-copy">
                  <span className="section-index">ESTIMATED SERVICE END</span>
                  <strong>{estimatedEndLabel}</strong>
                </div>
              </CardContent>
            </Card>
          )}
        </header>
        <div className="schedule-workspace">
          <section className="schedule-form-panel" aria-labelledby="add-event-heading">
            <div className="section-heading"><span className="section-index">01 / PLAN</span><h2 id="add-event-heading">Add a moment</h2><p>Set the flow for worship, prayer, teaching, and more.</p></div>
            <form onSubmit={(event) => { event.preventDefault(); handleAddSchedule(); }} className="schedule-form">
              <div className="field-group"><Label htmlFor="title">Moment title</Label><Input id="title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. Opening worship" /></div>
              <div className="field-group"><Label htmlFor="duration">Duration <span className="field-hint">in minutes</span></Label><Input id="duration" type="number" min="1" max="1440" value={newDuration} onChange={(event) => setNewDuration(event.target.value)} placeholder="15" /></div>
              <div className="duration-options" aria-label="Quick duration selection">{[5, 15, 30, 45, 60].map((mins) => <button key={mins} type="button" onClick={() => setNewDuration(String(mins))} className={cn("duration-option", newDuration === String(mins) && "is-selected")}>{mins} min</button>)}</div>
              <Button type="submit" className="schedule-submit">Add to service</Button>
            </form>
          </section>
          <section className="timeline-panel" aria-labelledby="timeline-heading">
            <div className="timeline-heading"><div><span className="section-index">02 / ORDER OF WORSHIP</span><h2 id="timeline-heading">Service flow</h2></div><span className="timeline-total">{schedules.length} {schedules.length === 1 ? "moment" : "moments"}</span></div>
            {schedules.length === 0 ? (
              <Empty className="timeline-empty">
                <EmptyMedia><CalendarBlank size={24} /></EmptyMedia>
                <EmptyHeader><EmptyTitle>No service moments yet</EmptyTitle><EmptyDescription>Add worship, prayer, a message, or any other part of Sunday service.</EmptyDescription></EmptyHeader>
                <EmptyContent><Button type="button" variant="outline" onClick={() => document.getElementById("title")?.focus()}>Add the first moment</Button></EmptyContent>
              </Empty>
            ) : (
              <ScrollArea className="timeline-scroll-area">
                <SortableContext items={schedules.map((event) => event.id)} strategy={verticalListSortingStrategy}>
                  <ul className="timeline-list">
                    {schedules.map((event, index) => (
                      <li key={event.id}>
                        <ScheduleCard event={event} index={index} isActive={index === currentEventIndex} deleteSchedule={onDeleteSchedule} updateSchedule={onUpdateSchedule} />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </ScrollArea>
            )}
          </section>
        </div>
      </main>
    </DndContext>
  );
}
