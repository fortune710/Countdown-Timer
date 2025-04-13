// Removed listen as listener is now in App
import { cn, convertSecondsToMinutes } from "@/lib/utils";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Keep the interface definition if needed locally, or import from App/types file
interface ScheduleItem {
    title: string,
    duration: number
    id?: string
}

// --- Define Props Interface ---
interface TimerPageProps {
    schedules: Array<ScheduleItem>;
    currentEventIndex: number;
    timeLeft: number;
    isRunning: boolean;
    isLoaded: boolean;
    isTimeUp: boolean;
    handlePlay: () => void;
    resetSchedule: () => void;
}

// --- Use Props in the Component ---
export default function TimerPage({
    schedules,
    currentEventIndex,
    timeLeft,
    isRunning,
    isLoaded,
    isTimeUp,
    handlePlay,
    resetSchedule
}: TimerPageProps) { // Destructure props

  // --- Render Logic (Uses props now) ---
  if (!isLoaded) {
    // Use isLoaded prop
    return <div>Loading schedules...</div>;
  }

  if (schedules.length === 0) {
    // Use schedules prop
    return <div>No schedules found. Please go to the Schedule Entry page to add some events.</div>;
  }

  // Use props for calculations and display
  const currentEvent = schedules[currentEventIndex];
  const displayTitle = currentEvent?.title || "Event";
  const canStartNext = currentEventIndex < schedules.length - 1;
  const isPlayDisabled = isRunning || (isTimeUp && !canStartNext);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-5 text-center">

      <div className="my-6">
        <h2 className="event-title">{displayTitle}</h2>
        {/* Use isTimeUp prop */}
        {isTimeUp ? (
          <h1 className={cn("time-display", "time-up-text")}>
            TIME UP
          </h1>
        ) : (
          // Use timeLeft prop
          <h1 className={cn(
              "time-display",
              timeLeft <= 300 && timeLeft > 0 && "time-display-low"
          )}>
            {convertSecondsToMinutes(Number(timeLeft))}
          </h1>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlay} // Use handlePlay prop
          disabled={isPlayDisabled}
          className={cn(
            isPlayDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Play className="size-6 text-zinc-800" />
        </Button>
        <Button variant="outline" size="icon" onClick={resetSchedule}> {/* Use resetSchedule prop */}
          <RotateCcw className="text-destructive size-6" />
        </Button>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-medium mb-2">Next Event:</h3>
        {/* Use schedules and currentEventIndex props */}
        {canStartNext ? (
          <p className="text-2xl font-semibold">
            {schedules[currentEventIndex + 1].title}
          </p>
        ) : (
          <p className="text-lg text-muted-foreground">
            {currentEventIndex >= schedules.length - 1 && schedules.length > 0 ? "Last event" : "No more events"}
          </p>
        )}
      </div>
    </div>
  );
}