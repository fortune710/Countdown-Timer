import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ScheduleItem {
    title: string,
    duration: number
}

export default function ScheduleEntryPage() {
    const [schedules, setSchedules] = useState<Array<ScheduleItem>>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("");

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const data: string = await invoke("load_schedules");
    setSchedules(JSON.parse(data));
  };

  const saveSchedules = async (updatedSchedules: any) => {
    await invoke("save_schedules", { schedules: JSON.stringify(updatedSchedules) });
    loadSchedules(); // Refresh list
  };

  const addSchedule = () => {
    if (newTitle && newDuration) {
      const updatedSchedules = [...schedules, { title: newTitle, duration: parseInt(newDuration) }];
      saveSchedules(updatedSchedules);
      setNewTitle("");
      setNewDuration("");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Event Scheduler</h1>
      <div>
        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Event Title" />
        <input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="Duration (s)" />
        <button onClick={addSchedule}>Add Event</button>
      </div>
      <h3>Upcoming Events:</h3>
      <ul>
        {schedules.map((event, index) => (
          <li key={index}>{event.title} ({event.duration}s)</li>
        ))}
      </ul>
    </div>
  );
}