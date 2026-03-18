import { useState } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";
import { ScheduleCard, ScheduleItem } from "../components/schedule-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleAddSchedule = () => {
    // Validation for title and duration
    if (!newTitle.trim()) {
      toast.error("Title is required.", {
        description: "Please enter a title for the schedule item."
      });
      return;
    }

    // Title uniqueness validation (optional)
    if (schedules.some(item => item.title.trim().toLowerCase() === newTitle.trim().toLowerCase())) {
      toast.error("Title must be unique.", {
        description: "A schedule item with this title already exists."
      });
      return;
    }

    if (!newDuration.trim()) {
      toast.error("Duration is required.", {
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
      <main className="min-h-screen w-full flex items-center justify-center p-8 bg-noise text-foreground overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[420px_1fr] gap-10 h-[85vh]">
          {/* Left Section: Form */}
          <section className="glass-card rounded-[2.5rem] p-10 flex flex-col justify-between border-white/5 shadow-2xl">
            <div className="flex-1">
              <header className="mb-12">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">Add Event</h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Design your day, one event at a time. Enter a title and select a duration.
                </p>
              </header>

              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-bold text-zinc-400 ml-1">Event Title</Label>
                  <Input
                    type="text"
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Focus Session, Lunch, Meeting..."
                    className="bg-white/5 border-white/10 h-14 px-5 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all rounded-2xl text-lg font-medium placeholder:text-zinc-600 shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-sm font-bold text-zinc-400 ml-1">Duration (minutes)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      id="duration"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="15"
                      className="bg-white/5 border-white/10 h-14 px-5 pr-12 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all rounded-2xl text-lg font-medium placeholder:text-zinc-600 shadow-inner"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600">min</span>
                  </div>

                  {/* Quick select buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[5, 15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setNewDuration(String(mins))}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                          newDuration === String(mins)
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/40 scale-[1.02]"
                            : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full h-16 text-xl font-extrabold bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-2xl shadow-primary/40 transition-all active:scale-[0.97] mt-10"
              onClick={handleAddSchedule}
            >
              Confirm Event
            </Button>
          </section>

          {/* Right Section: List */}
          <section className="glass-card rounded-[2.5rem] p-10 flex flex-col border-white/5 shadow-2xl">
            <header className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Timeline</h3>
                <p className="text-zinc-500 text-sm font-medium mt-1">Your upcoming sequence</p>
              </div>
              <div className="px-5 py-2 bg-primary/20 rounded-2xl border border-primary/20 text-xs font-black text-primary uppercase tracking-widest shadow-inner">
                {schedules.length} Items
              </div>
            </header>

            <ScrollArea className="flex-1 pr-4 -mr-4">
              <ul className="space-y-4 pb-6">
                {schedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-28 text-center bg-white/[0.02] rounded-[2rem] border-2 border-dashed border-white/[0.05]">
                    <div className="w-16 h-16 rounded-full bg-primary/20 shadow-xl mb-6 flex items-center justify-center border border-primary/20 animate-bounce">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h4 className="text-lg font-bold text-white/40 mb-2">Clean Slate</h4>
                    <p className="text-sm text-zinc-500 font-medium max-w-[200px]">Your timeline is empty. Start adding events to stay productive.</p>
                  </div>
                ) : (
                  schedules.map((event, index) => (
                    <ScheduleCard
                      event={event}
                      index={index}
                      key={event.id}
                      isActive={index === currentEventIndex}
                      deleteSchedule={onDeleteSchedule}
                      updateSchedule={onUpdateSchedule}
                    />
                  ))
                )}
              </ul>
            </ScrollArea>
          </section>
        </div>
      </main>
    </DndContext>
  );
}
