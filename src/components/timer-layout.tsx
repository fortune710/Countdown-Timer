// Removed listen as listener is now in App
import { cn, convertSecondsToMinutes } from "@/lib/utils";
import { Play, ArrowCounterClockwise, StopCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import TimerLoadingSkeleton from "./timer-loading-skeleton";
import ScreenExtendButton from "./screen-extend-button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { CalendarBlank } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

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
    return <main className="timer-page"><header className="page-heading"><div><p className="page-eyebrow">SUNDAY SERVICE</p><h1>Service timer</h1><p>Keep each moment of worship on time.</p></div></header><Empty className="timer-empty"><EmptyMedia><CalendarBlank size={24} /></EmptyMedia><EmptyHeader><EmptyTitle>The service timer is ready</EmptyTitle><EmptyDescription>Add a moment to the order of service to begin.</EmptyDescription></EmptyHeader><EmptyContent><Button asChild><Link to="/">Plan the service</Link></Button></EmptyContent></Empty></main>;
  }

  // Use props for calculations and display
  const currentEvent = schedules[currentEventIndex];
  const displayTitle = currentEvent?.title || "Event";
  const canStartNext = currentEventIndex < schedules.length - 1;
  const isPlayDisabled = isRunning;

  return (
    <main className="timer-page">
      <header className="page-heading"><div><p className="page-eyebrow">SUNDAY SERVICE</p><h1>Service timer</h1><p>Guide the gathering, one moment at a time.</p></div><span className="page-count">{currentEventIndex + 1} / {schedules.length}</span></header>
      <section className="timer-workspace" aria-label="Current service timer">
        <div className="timer-main">
          <div className="timer-topline"><span className="section-index">CURRENT MOMENT / {String(currentEventIndex + 1).padStart(2, "0")}</span><span className={cn("timer-status", isRunning && "is-running")}>{isRunning ? "Running" : isTimeUp ? "Time up" : "Ready"}</span></div>
          <h2 className="timer-event-title">{displayTitle}</h2>
          <div className={cn("timer-digits", (isTimeUp || (timeLeft <= 300 && timeLeft > 0)) && "is-urgent")} role="timer" aria-live="off">{extraTime > 5 ? `-${convertSecondsToMinutes(Number(extraTime))}` : isTimeUp ? "TIME UP" : convertSecondsToMinutes(Number(timeLeft))}</div>
          <div className="timer-controls"><Button onClick={handlePlay} disabled={isPlayDisabled} aria-label="Start timer" className="timer-primary-control"><Play size={20} weight="fill" />{isRunning ? "Running" : isTimeUp ? "Start next moment" : "Start timer"}</Button><Button variant="outline" onClick={resetSchedule} aria-label="Reset service timer"><ArrowCounterClockwise size={20} />Reset</Button><Button variant="outline" onClick={moveToNextEvent} aria-label="Skip to next service moment"><StopCircle size={20} />Skip</Button></div>
        </div>
        <aside className="timer-side"><div><span className="section-index">NEXT IN SERVICE</span><h3>{canStartNext ? schedules[currentEventIndex + 1].title : "Service complete"}</h3><p>{canStartNext ? "The next part of the service is ready when this moment ends." : "You have reached the end of the order of service."}</p></div><div className="external-control"><span className="section-index">PROJECTOR DISPLAY</span><ScreenExtendButton isExtended={isExternalTimerOpen} onExtendChange={onExternalTimerChange} /></div></aside>
      </section>
    </main>
  );
}
