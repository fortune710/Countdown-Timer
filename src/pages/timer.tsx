import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

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

//   useEffect(() => {
//     loadSchedules();
//   }, []);

//   useEffect(() => {
//     // Setup event listener
//     const setupListener = async () => {
//         const unlisten = await listen("timer-update", (event: any) => {
//           setTimeLeft(event.payload);
//           if (event.payload === 0) {
//             moveToNextEvent();
//           }
//         });
        
//         return unlisten;
//       };
      
//       const cleanup = setupListener();
      
//       return () => {
//         cleanup.then(unlisten => unlisten());
//     };
//   }, [currentEventIndex])

//   const loadSchedules = async () => {
//     try {
//       const data: string = await invoke("load_schedules");
//       const parsedSchedules = JSON.parse(data) as Array<ScheduleItem>;
      
//       if (parsedSchedules.length > 0) {
//         setSchedules(parsedSchedules);
//         setTimeLeft(parsedSchedules[0].duration);
//       } else {
//         // Use default schedule if none is loaded
//         const defaultSchedule = [
//           { title: "Workout", duration: 10 },
//           { title: "Meditation", duration: 5 },
//           { title: "Break", duration: 10 }
//         ];
//         setSchedules(defaultSchedule);
//         setTimeLeft(defaultSchedule[0].duration);
//         // Save the default schedule
//         await invoke("save_schedules", { schedules: JSON.stringify(defaultSchedule) });
//       }
//       setIsLoaded(true);
//     } catch (error) {
//       console.error("Failed to load schedules:", error);
//       // Fallback to default schedule
//       const defaultSchedule = [
//         { title: "Workout", duration: 10 },
//         { title: "Meditation", duration: 5 },
//         { title: "Break", duration: 10 }
//       ];
//       setSchedules(defaultSchedule);
//       setTimeLeft(defaultSchedule[0].duration);
//       setIsLoaded(true);
//     }
//   };

//   const startTimer = () => {
//     if (schedules.length > currentEventIndex) {
//       invoke("start_timer", { seconds: schedules[currentEventIndex].duration });
//       setIsRunning(true);
//     }
//   };

//   const moveToNextEvent = () => {
//     setIsRunning(false);
//     if (currentEventIndex < schedules.length - 1) {
//         const nextIndex = currentEventIndex + 1;
//         setCurrentEventIndex(nextIndex);
//         setTimeLeft(schedules[nextIndex].duration);
//         // Automatically start the next timer
//         setTimeout(() => {
//           invoke("start_timer", { seconds: schedules[nextIndex].duration });
//           setIsRunning(true);
//         }, 100); // Small delay to ensure state updates complete
//     } else {
//       alert("All events completed!");
//       resetSchedule();
//     }
//   };

//   const resetSchedule = () => {
//     setIsRunning(false);
//     setCurrentEventIndex(0);
//     if (schedules.length > 0) {
//       setTimeLeft(schedules[0].duration);
//     }
//   };
  //Use these
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
      const data: string = await invoke("load_schedules");
      alert(JSON.parse(data).length)
      setSchedules(JSON.parse(data));
      setIsLoaded(true);
  };

  useEffect(() => {
    const unlisten = listen("timer-update", (event: any) => {
      setTimeLeft(event.payload);
      if (event.payload === 0) {
        moveToNextEvent();
      }
    });

    return () => {
        unlisten.then((fn) => fn());
    }
  }, [currentEventIndex, schedules]);

  const startTimer = () => {
    invoke("start_timer", { seconds: schedules[currentEventIndex].duration });
    setIsRunning(true);
  };

  const moveToNextEvent = () => {
    setIsRunning(false);
    console.log("Current schedules:", schedules); // Add logging to debug
    console.log("Current index:", currentEventIndex);

    if (currentEventIndex < schedules.length - 1) {
      setCurrentEventIndex((prev) => prev + 1);
      setTimeLeft(schedules[currentEventIndex + 1].duration);
      startTimer();
    } else {
        alert(currentEventIndex)
        alert(schedules.length - 1)
    }
  };

  const resetSchedule = () => {
    setIsRunning(false);
    setCurrentEventIndex(0);
    setTimeLeft(schedules[0].duration);
  };

  if (!isLoaded) {
    return <div>Loading schedules...</div>;
  }

  if (schedules.length === 0) {
    return <div>No schedules found. Please create some schedules.</div>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Event Schedule</h1>
      <h2>{schedules[currentEventIndex]?.title || "No event"}</h2>
      <h2>{timeLeft} seconds left</h2>
      <button onClick={startTimer} disabled={isRunning}>Start</button>
      <button onClick={() => setIsRunning(false)}>Pause</button>
      <button onClick={resetSchedule}>Reset</button>
      <h3>Upcoming Events:</h3>
      <ul>
        {schedules.slice(currentEventIndex + 1).map((event, index) => (
          <li key={index}>{event.title} ({event.duration}s)</li>
        ))}
      </ul>
    </div>
  );
}