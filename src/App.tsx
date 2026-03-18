import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ScheduleEntryPage from './pages/schedule-entry'
import TimerPage from './components/timer-layout'

import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import './App.css'
import './index.css'

interface ScheduleItem {
  title: string,
  duration: number
}


function App() {
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

  //Number of seconds used after time up
  const [extraTimeUsed, setExtraTimeUsed] = useState(0);

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
              console.log({ timeLeft: payload });
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isTimeUp) {
      intervalId = setInterval(() => {
        setExtraTimeUsed((prevExtraTimeUsed) => prevExtraTimeUsed + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        setExtraTimeUsed(0);
        clearInterval(intervalId);
      }
    };
  }, [isTimeUp]);

  // Handles starting the timer for the correct event (current or next)
  const handlePlay = useCallback(() => {
    if (isRunning) {
      // Already running, do nothing (or implement pause later if needed)
      return;
    }

    let eventIndexToStart = currentEventIndex;
    let durationToStart: number | undefined;

    console.log({ isTimeUp })
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

  // Reset Schedule Logic
  const resetSchedule = useCallback(() => {
    console.log("App: Resetting schedule requested");
    invoke("reset_timer");
    setIsRunning(false);
    setIsTimeUp(false);
    setCurrentEventIndex(0);
    if (schedules.length > 0) {
      setTimeLeft(schedules[0].duration);
    } else {
      setTimeLeft(0);
    }
  }, [schedules]); // Depends on schedules

  const moveToNextEvent = useCallback(() => {
    console.log("App: moveToNextEvent called");
    if (currentEventIndex < schedules.length - 1) {
      const nextIndex = currentEventIndex + 1;
      const nextDuration = schedules[nextIndex]?.duration;

      if (nextDuration !== undefined && nextDuration > 0) {
        console.log(`App: Moving to index ${nextIndex}`);
        // 1. Update the index state
        // 2. Tell the backend to start the new timer (backend handles stopping the old one)
        invoke("reset_timer");
        setTimeLeft(0)
        setIsTimeUp(true);

        // --- REMOVED ---
        // setTimeLeft(nextDuration); // Let listener handle this from backend event
        // setIsRunning(true);       // Let listener handle this from backend event
        // setIsTimeUp(false);      // Listener handles this too
      } else {
        console.warn(`App: Cannot move to next event, invalid duration for index ${nextIndex}`);
      }
    } else {
      console.log("App: Already at the last event.");
      // Optionally reset or show completion message
      alert("Last event finished or skipped.");
      resetSchedule(); // Example: Reset after last event is skipped
    }
  }, [currentEventIndex, schedules, resetSchedule]);

  // const startTimer = (duration?: number) => {
  //   const timeStart = schedules[currentEventIndex].duration;
  //   invoke("start_timer", { seconds: duration ?? timeStart });
  //   setIsRunning(true);
  // };

  // const moveToNextEvent = () => {
  //   setIsRunning(false);
  //   console.log("Current schedules:", schedules); // Add logging to debug
  //   console.log("Current index:", currentEventIndex);

  //   if (currentEventIndex < schedules.length - 1) {
  //     const nextIndex = currentEventIndex + 1;
  //     setCurrentEventIndex((prev) => prev + 1);

  //     setTimeLeft(schedules[nextIndex].duration);
  //     startTimer(schedules[nextIndex].duration);
  //   } else {

  //   }
  // };

  // const resetSchedule = () => {
  //   setIsRunning(false);
  //   setCurrentEventIndex(0);
  //   invoke("reset_timer")
  //   setTimeLeft(schedules[0].duration);
  // };




  return (
    <BrowserRouter>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <nav className="glass-card px-2 py-2 rounded-2xl flex items-center gap-1 border-white/10 shadow-2xl shadow-black/40">
          <Link
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5 active:scale-95 flex items-center gap-2"
            to="/"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Schedule
          </Link>
          <div className="w-[1px] h-4 bg-white/10" />
          <Link
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5 active:scale-95 flex items-center gap-2"
            to="/timer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            Timer
          </Link>
        </nav>
      </div>

      <div className="pt-16">
        <Routes>

          <Route
            path="/"
            element={
              <ScheduleEntryPage
                currentEventIndex={currentEventIndex}
                appSchedules={schedules}
              />
            }
          />
          <Route
            path="/timer"
            element={
              <TimerPage
                schedules={schedules}
                currentEventIndex={currentEventIndex}
                extraTime={extraTimeUsed}
                timeLeft={timeLeft}
                isRunning={isRunning}
                isLoaded={isLoaded}
                isTimeUp={isTimeUp}
                handlePlay={handlePlay}
                resetSchedule={resetSchedule}
                moveToNextEvent={moveToNextEvent}
              // Pass any other needed state/functions
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App