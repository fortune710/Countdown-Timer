import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { cn, convertSecondsToMinutes } from "@/lib/utils";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleItem {
    title: string,
    duration: number
}

export default function TimerPage() {
  // List of events with title and duration
  const [schedules, setSchedules] = useState<Array<ScheduleItem>>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  //Use these
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
      const data: string = await invoke("load_schedules");
      setSchedules(JSON.parse(data));
      setIsLoaded(true);
  };

  useEffect(() => {
    const unlisten = listen("timer-update", (event: any) => {
      setTimeLeft(event.payload);
    });

    return () => {
        unlisten.then((fn) => fn());
    }
  }, [currentEventIndex, schedules]);

  useEffect(() => {
    if (timeLeft === 0 && currentEventIndex < schedules.length - 1) {
      moveToNextEvent();
    }

  }, [timeLeft])

  const startTimer = (duration?: number) => {
    const timeStart = schedules[currentEventIndex].duration;
    invoke("start_timer", { seconds: duration ?? timeStart });
    setIsRunning(true);
  };

  const moveToNextEvent = () => {
    setIsRunning(false);
    console.log("Current schedules:", schedules); // Add logging to debug
    console.log("Current index:", currentEventIndex);

    if (currentEventIndex < schedules.length - 1) {
      const nextIndex = currentEventIndex + 1;
      setCurrentEventIndex((prev) => prev + 1);

      setTimeLeft(schedules[nextIndex].duration);
      startTimer(schedules[nextIndex].duration);
    } else {

    }
  };

  // const resetSchedule = () => {
  //   setIsRunning(false);
  //   setCurrentEventIndex(0);
  //   invoke("reset_timer")
  //   setTimeLeft(schedules[0].duration);
  // };

  if (!isLoaded) {
    return <div>Loading schedules...</div>;
  }

  if (schedules.length === 0) {
    return <div>No schedules found. Please create some events.</div>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1 className="text-2xl font-medium">Currently Happening</h1>

      <div className="my-10">
        <h2 className="text-xl font-medium">{schedules[currentEventIndex]?.title || "No event"}</h2>
        <h1 className={cn("text-9xl", timeLeft <= 300 ? "text-destructive" : "text-zinc-800")}>
          {convertSecondsToMinutes(Number(timeLeft))}
        </h1>
      </div>

      <Button variant="outline" className="mr-4" size="icon" disabled={isRunning} onClick={() => startTimer()}>
        <Play className="size-4 text-zinc-800" />
      </Button>
      {/* <Button variant="outline" size="icon" onClick={resetSchedule}>
        <RotateCcw className="text-destructive size-4" />
      </Button> */}

      <div className="mt-5">
        <h3 className="font-medium">Next Event</h3>
        <ul>
          {schedules.slice(currentEventIndex + 1, currentEventIndex + 2).map((event, index) => (
            <li className="text-2xl font-semibold" key={index}>{event.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}