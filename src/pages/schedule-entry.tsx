import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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

interface ScheduleItem {
  title: string,
  duration: number
  id: string
}

export default function ScheduleEntryPage() {
  const [schedules, setSchedules] = useState<Array<ScheduleItem>>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("");


  //We can afford to use useEffect here wihtout caching since it's a small scale app
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const data: string = await invoke("load_schedules");
    const schedules: Array<ScheduleItem> = JSON.parse(data).map((item: ScheduleItem) => ({
      title: item.title,
      duration: item.duration,
      id: `${item.title}-${item.duration}`
    }))
    setSchedules(schedules);
  };

  const saveSchedules = async (updatedSchedules: any) => {
    await invoke("save_schedules", { schedules: JSON.stringify(updatedSchedules) });
    loadSchedules(); // Refresh list
  };

  const addSchedule = () => {
    if (newTitle && newDuration) {
      const updatedSchedules = [...schedules, { title: newTitle, duration: Number(newDuration) * 60 }];
      saveSchedules(updatedSchedules);
      setNewTitle("");
      setNewDuration("");
    }
  };

  const deleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter((item) => item.id !== id);
    saveSchedules(updatedSchedules);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = schedules.findIndex((item) => item.id === active.id);
      const newIndex = schedules.findIndex((item) => item.id === over.id);

      const updatedSchedules = arrayMove(schedules, oldIndex, newIndex).map((item) => ({ title: item.title, duration: item.duration}))
      saveSchedules(updatedSchedules);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <main className="w-screen grid grid-cols-2 gap-4 h-screen">
        <section className="pl-2">
          <h1 className="text-center mb-3 font-medium">Event Scheduler</h1>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input 
                type="text" 
                id="title" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                placeholder="Event Title" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input 
                type="number" 
                id="duration" 
                value={newDuration} 
                onChange={(e) => setNewDuration(e.target.value)} 
                placeholder="Duration (minutes)" 
              />
            </div>
            <Button variant="default" className="text-zinc-800 w-full" onClick={addSchedule}>Add Event</Button>
          </div>
        </section>

        <section className="pr-4">
          <h3 className="font-medium text-center">Upcoming Events:</h3>
          <ScrollArea className="h-[450px] mt-3">
            <ul className="list-none">
              {schedules.map((event, index) => (
                <ScheduleCard 
                  event={event} 
                  index={index} 
                  key={event.id}
                  deleteSchedule={deleteSchedule} 
                />
              ))}
            </ul>
          </ScrollArea>
        </section>
      </main>
    </DndContext>
  );
}