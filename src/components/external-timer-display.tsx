import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { cn, convertSecondsToMinutes } from "@/lib/utils";

interface ScheduleItem {
    title: string;
    duration: number;
    id?: string;
}

/**
 * A minimal, fullscreen timer display designed for the external monitor.
 * No navigation, no controls — just the event title and countdown.
 */
export default function ExternalTimerDisplay() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [_isRunning, setIsRunning] = useState(false);
    const [extraTimeUsed, setExtraTimeUsed] = useState(0);

    // Load schedules on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data: string = await invoke("load_schedules");
                const parsed = JSON.parse(data) as ScheduleItem[];
                setSchedules(parsed);
                if (parsed.length > 0) {
                    setTimeLeft(parsed[0].duration);
                }
            } catch (e) {
                console.error("External timer: Failed to load schedules", e);
            }
        };
        load();
    }, []);

    // Listen for timer-update events (same as main window)
    useEffect(() => {
        let isMounted = true;

        const setupListener = async () => {
            const unlistenFn = await listen("timer-update", (event: any) => {
                if (!isMounted) return;
                const payload = event.payload;
                setTimeLeft(payload);

                setIsRunning((currentIsRunning) => {
                    if (payload <= 0) {
                        if (currentIsRunning) {
                            setIsTimeUp(true);
                            return false;
                        } else {
                            setIsTimeUp(false);
                            return false;
                        }
                    } else {
                        setIsTimeUp(false);
                        return true;
                    }
                });
            });
            return unlistenFn;
        };

        const cleanupPromise = setupListener();
        return () => {
            isMounted = false;
            cleanupPromise.then((unlisten) => unlisten());
        };
    }, []);

    // Listen for schedule-update events to sync current event info
    useEffect(() => {
        let isMounted = true;

        const setupListener = async () => {
            const unlistenFn = await listen("schedule-update", (event: any) => {
                if (!isMounted) return;
                const payload = event.payload as { currentEventIndex: number; schedules: ScheduleItem[] };
                if (payload.schedules) setSchedules(payload.schedules);
                if (payload.currentEventIndex !== undefined) setCurrentEventIndex(payload.currentEventIndex);
            });
            return unlistenFn;
        };

        const cleanupPromise = setupListener();
        return () => {
            isMounted = false;
            cleanupPromise.then((unlisten) => unlisten());
        };
    }, []);

    // Extra time counter
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isTimeUp) {
            intervalId = setInterval(() => {
                setExtraTimeUsed((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (intervalId) {
                setExtraTimeUsed(0);
                clearInterval(intervalId);
            }
        };
    }, [isTimeUp]);

    const currentEvent = schedules[currentEventIndex];
    const displayTitle = currentEvent?.title || "Event";
    const canStartNext = currentEventIndex < schedules.length - 1;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground select-none cursor-none">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[200px] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Current session badge */}
                <div className="px-8 py-3 bg-primary/20 rounded-full border border-primary/20 inline-block text-sm font-black text-primary uppercase tracking-[0.25em] shadow-inner">
                    Current Session
                </div>

                {/* Event title */}
                <h2 className="text-7xl font-extrabold tracking-tight text-white leading-tight text-center max-w-[80vw]">
                    {displayTitle}
                </h2>

                {/* Timer display */}
                <div className="my-8 relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full -z-10" />

                    {extraTimeUsed > 5 ? (
                        <h1
                            className={cn(
                                "text-[16rem] font-black tracking-tighter text-destructive leading-none tabular-nums drop-shadow-2xl shadow-destructive/20"
                            )}
                        >
                            -{convertSecondsToMinutes(extraTimeUsed)}
                        </h1>
                    ) : isTimeUp ? (
                        <h1
                            className={cn(
                                "text-[14rem] font-black tracking-tighter text-destructive leading-none uppercase animate-in fade-in zoom-in-90 duration-200 ease-out drop-shadow-2xl shadow-destructive/20"
                            )}
                        >
                            TIME UP
                        </h1>
                    ) : (
                        <h1
                            className={cn(
                                "text-[16rem] font-black tracking-tighter leading-none tabular-nums transition-all duration-700 drop-shadow-2xl",
                                timeLeft <= 300 && timeLeft > 0
                                    ? "text-destructive shadow-destructive/20"
                                    : "text-white shadow-primary/20"
                            )}
                        >
                            {convertSecondsToMinutes(timeLeft)}
                        </h1>
                    )}
                </div>

                {/* Next event info */}
                <div className="mt-4 text-center">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">
                        Next Event
                    </h3>
                    {canStartNext ? (
                        <div className="flex items-center justify-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary/40" />
                            <p className="text-3xl font-extrabold text-white tracking-tight">
                                {schedules[currentEventIndex + 1]?.title}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xl font-bold text-zinc-600 italic">
                            Timeline Complete
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
