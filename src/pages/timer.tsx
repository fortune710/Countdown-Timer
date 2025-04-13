import { useCallback, useEffect, useState } from "react";
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

  //Index of current event in schedule array
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  //Number of seconds left
  const [timeLeft, setTimeLeft] = useState(0);

  //If timer is running
  const [isRunning, setIsRunning] = useState(false);

  //If schedule is loaded
  const [isLoaded, setIsLoaded] = useState(false);

  //If current event is finished
  const [isTimeUp, setIsTimeUp] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      console.log("Loading schedules...");
      const data: string = await invoke("load_schedules");
      const parsedSchedules = JSON.parse(data) as Array<ScheduleItem>;
      console.log("Schedules loaded:", parsedSchedules);
      setSchedules(parsedSchedules);

      if (parsedSchedules.length > 0) {
        // Set initial state based on the first event
        setCurrentEventIndex(0);
        setTimeLeft(parsedSchedules[0].duration);
        setIsRunning(false); // Ensure timer is not running initially
        setIsTimeUp(false); // Ensure time is not up initially
      } else {
        // Handle empty schedule case
        setCurrentEventIndex(0);
        setTimeLeft(0);
        setIsRunning(false);
        setIsTimeUp(false);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setSchedules([]);
      setTimeLeft(0);
      setCurrentEventIndex(0);
      setIsRunning(false);
      setIsTimeUp(false);
      setIsLoaded(true); // Mark as loaded even on error to show message
    }
  }, []); // Empty dependency array - load only once

  //Use these
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);


  useEffect(() => {
    console.log("Setting up timer listener.");
    let isMounted = true;

    const setupListener = async () => {
      const unlistenFn = await listen("timer-update", (event: any) => {
        if (!isMounted) return;

        const payload = event.payload;
        console.log(`Listener Raw Payload Received: ${payload}`);

        // Always update the displayed time
        setTimeLeft(payload);

        // Use functional updates for isRunning and isTimeUp
        // to ensure we're working with the latest state values
        setIsRunning(currentIsRunning => {
          console.log(`Processing payload ${payload} with currentIsRunning: ${currentIsRunning}`);

          if (payload <= 0) {
            if (currentIsRunning) {
              // Timer reached 0 naturally while it was running
              console.log("Timer reached 0. Setting isTimeUp=true, isRunning=false.");
              // Set isTimeUp using its functional update form too for safety
              setIsTimeUp(true); // Set time up flag
              return false; // Stop running
            } else {
              // Timer received 0 but wasn't running (likely a reset signal)
              console.log("Timer at 0 but wasn't running. Ensuring isTimeUp=false.");
              // Ensure isTimeUp is false if we received 0 from a reset
              setIsTimeUp(false);
              return false; // Remain stopped
            }
          } else {
            // Payload > 0 (timer is ticking down)
            if (currentIsRunning) {
              // Timer ticking normally, ensure isTimeUp is false
               console.log("Timer ticking > 0. Ensuring isTimeUp=false.");
               setIsTimeUp(false);
               return true; // Remain running
            } else {
              // Received > 0 but wasn't running. This is unusual.
              // Could happen if the start command was slightly delayed relative to the first tick.
              // For safety, let's assume it should be running now.
              console.warn(`Received payload ${payload} > 0 but timer wasn't marked as running. Setting isRunning=true.`);
              setIsTimeUp(false); // Ensure time up is false
              return true; // Start running
            }
          }
        });
      });
      return unlistenFn;
    };

    const cleanupPromise = setupListener();

    return () => {
      console.log("Cleaning up timer listener.");
      isMounted = false; // Set flag on unmount
      cleanupPromise.then(unlisten => unlisten()); // Detach listener
    };
    // No dependencies needed here, as we use functional update for isRunning check
  }, []);

  // Handles starting the timer for the correct event (current or next)
  const handlePlay = useCallback(() => {
    if (isRunning) {
      // Already running, do nothing (or implement pause later if needed)
      return;
    }

    let eventIndexToStart = currentEventIndex;
    let durationToStart: number | undefined;

    // If the previous event just finished, move to the next one
    if (isTimeUp) {
      if (currentEventIndex < schedules.length - 1) {
        eventIndexToStart = currentEventIndex + 1;
        setCurrentEventIndex(eventIndexToStart); // Update the index state NOW
        durationToStart = schedules[eventIndexToStart]?.duration;
        console.log(`Time was up. Starting next event index: ${eventIndexToStart}`);
      } else {
        console.log("Time up on last event, cannot start next.");
        // Optionally reset or show a final message
        alert("All events completed!");
        //resetSchedule(); // Reset to beginning after acknowledging completion
        return; // Don't proceed to start timer
      }
    } else {
      // Otherwise, start/resume the currently selected event
      durationToStart = schedules[eventIndexToStart]?.duration;
      // If timeLeft is already set (e.g. after reset/initial load), use that, otherwise use full duration
      // This handles starting the very first event or starting after a reset correctly.
      durationToStart = timeLeft > 0 && !isTimeUp ? timeLeft : durationToStart;
      console.log(`Starting current event index: ${eventIndexToStart} with duration ${durationToStart}`);
    }


    if (durationToStart !== undefined && durationToStart > 0) {
      console.log(`Invoking start_timer for index ${eventIndexToStart}, duration ${durationToStart}`);
      invoke("start_timer", { seconds: durationToStart });
      setTimeLeft(durationToStart); // Ensure UI shows the correct starting time
      setIsRunning(true);
      setIsTimeUp(false); // Clear time up flag when starting
    } else {
      console.warn("Attempted to start timer with invalid duration or no schedules.");
      setIsRunning(false);
      setIsTimeUp(false);
    }
  }, [currentEventIndex, schedules, isRunning, isTimeUp, timeLeft]); // Added dependencies


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

  const currentEvent = schedules[currentEventIndex];
  const displayTitle = currentEvent?.title || "Event";
  const canStartNext = currentEventIndex < schedules.length - 1;

  // Determine if the play button should be enabled
  // Disabled if: timer is running OR (time is up AND there's no next event)
  const isPlayDisabled = isRunning || (isTimeUp && !canStartNext);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1 className="text-2xl font-medium">Currently Happening</h1>

      <div className="my-10">
        <h2 className="text-xl font-medium">{displayTitle}</h2>
        {/* Conditional Rendering for Time/TIME UP */}
        {isTimeUp ? (
          // Apply flashing class when time is up
          <h1 className={cn("time-display", "time-up-text")}>
            TIME UP
          </h1>
        ) : (
          // Apply regular time display and low time warning
          <h1 className={cn(
              "time-display",
              timeLeft <= 300 && timeLeft > 0 && "time-display-low" // Red under 5min, but not at 0
          )}>
            {convertSecondsToMinutes(Number(timeLeft))}
          </h1>
        )}
      </div>

      <Button variant="outline" className="mr-4" size="icon" disabled={isPlayDisabled} onClick={handlePlay}>
        <Play className="size-4 text-zinc-800" />
      </Button>
      {/* <Button variant="outline" size="icon" onClick={resetSchedule}>
        <RotateCcw className="text-destructive size-4" />
      </Button> */}

      <div className="mt-10">
        <h3 className="text-xl font-medium mb-2">Next Event:</h3>
        {/* Show next event title if available */}
        {canStartNext ? (
          <p className="text-2xl font-semibold">
            {schedules[currentEventIndex + 1].title}
          </p>
        ) : (
          // Indicate if it's the last event or if there are no events
          <p className="text-lg text-muted-foreground">
            {currentEventIndex >= schedules.length - 1 && schedules.length > 0 ? "Last event" : "No more events"}
          </p>
        )}
      </div>
    </div>
  );
}