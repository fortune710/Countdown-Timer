// Removed listen as listener is now in App
import { cn, convertSecondsToMinutes } from "@/lib/utils";
import { Play, RotateCcw, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimerLoadingSkeleton from "./timer-loading-skeleton";
import ScreenExtendButton from "./screen-extend-button";

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
  extraTime: number;
  handlePlay: () => void;
  resetSchedule: () => void;
  moveToNextEvent: () => void;
  isExternalTimerOpen: boolean;
  onExternalTimerChange: (extended: boolean) => void;
}

// --- Use Props in the Component ---
export default function TimerPage({
  schedules,
  currentEventIndex,
  extraTime,
  timeLeft,
  isRunning,
  isLoaded,
  isTimeUp,
  handlePlay,
  resetSchedule,
  moveToNextEvent,
  isExternalTimerOpen,
  onExternalTimerChange
}: TimerPageProps) {

  // --- Render Logic (Uses props now) ---
  if (!isLoaded) {
    // Use isLoaded prop
    return <TimerLoadingSkeleton />
  }

  if (schedules.length === 0) {
    // Use schedules prop
    return <div>No schedules found. Please go to the Schedule Entry page to add some events.</div>;
  }

  // Use props for calculations and display
  const currentEvent = schedules[currentEventIndex];
  const displayTitle = currentEvent?.title || "Event";
  const canStartNext = currentEventIndex < schedules.length - 1;
  const isPlayDisabled = isRunning;

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-8 text-center bg-noise">
      <div className="glass-card rounded-[3rem] p-16 w-full max-w-4xl border-white/5 shadow-2xl shadow-black/40">
        <header className="mb-12">
          <div className="px-6 py-2 bg-primary/20 rounded-full border border-primary/20 inline-block text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 shadow-inner">
            Current Session
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
            {displayTitle}
          </h2>
        </header>

        <div className="my-16 relative">
          {/* Subtle glow behind time */}
          <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full -z-10" />

          {extraTime > 5 ? (
            <h1 className={cn("text-[12rem] font-black tracking-tighter text-destructive leading-none tabular-nums drop-shadow-2xl shadow-destructive/20")}>
              -{convertSecondsToMinutes(Number(extraTime))}
            </h1>
          ) : isTimeUp ? (
            <h1 className={cn("text-[10rem] font-black tracking-tighter text-destructive leading-none uppercase animate-in fade-in zoom-in-90 duration-200 ease-out drop-shadow-2xl shadow-destructive/20")}>
              TIME UP
            </h1>
          ) : (
            <h1 className={cn(
              "text-[12rem] font-black tracking-tighter leading-none tabular-nums transition-all duration-700 drop-shadow-2xl",
              timeLeft <= 300 && timeLeft > 0 ? "text-destructive shadow-destructive/20" : "text-white shadow-primary/20"
            )}>
              {convertSecondsToMinutes(Number(timeLeft))}
            </h1>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mb-16">
          <Button
            size="lg"
            onClick={handlePlay}
            disabled={isPlayDisabled}
            className={cn(
              "w-20 h-20 rounded-full shadow-2xl transition-all active:scale-90",
              isPlayDisabled
                ? "bg-white/5 text-zinc-600 cursor-not-allowed border-white/5"
                : "bg-primary hover:bg-primary/90 text-white shadow-primary/40 border-none"
            )}
          >
            <Play className="size-10 fill-current ml-1" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={resetSchedule}
            className="w-16 h-16 rounded-3xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
          >
            <RotateCcw className="text-white/60 size-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={moveToNextEvent}
            className="w-16 h-16 rounded-3xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
          >
            <StopCircle className="text-destructive/80 size-6" />
          </Button>

          <div className="w-[1px] h-8 bg-white/10 mx-1" />

          <ScreenExtendButton
            isExtended={isExternalTimerOpen}
            onExtendChange={onExternalTimerChange}
          />
        </div>

        <footer className="pt-10 border-t border-white/5">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Next Event</h3>
          {canStartNext ? (
            <div className="flex items-center justify-center gap-3 group">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
              <p className="text-2xl font-extrabold text-white tracking-tight">
                {schedules[currentEventIndex + 1].title}
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold text-zinc-600 italic">
              Timeline Complete
            </p>
          )}
        </footer>
      </div>
    </div>

  );
}
