import { useEffect, useState } from "react";
import { emitTo, listen } from "@tauri-apps/api/event";
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
                const payload = event.payload as {
                    currentEventIndex: number;
                    schedules: ScheduleItem[];
                    timeLeft: number;
                    isRunning: boolean;
                    isTimeUp: boolean;
                    extraTimeUsed: number;
                };
                setSchedules(payload.schedules);
                setCurrentEventIndex(payload.currentEventIndex);
                setTimeLeft(payload.timeLeft);
                setIsRunning(payload.isRunning);
                setIsTimeUp(payload.isTimeUp);
                setExtraTimeUsed(payload.extraTimeUsed);
            });
            emitTo('main', 'external-timer-ready').catch(console.error);
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
    const displayTitle = currentEvent?.title || "Service moment";
    const canStartNext = currentEventIndex < schedules.length - 1;

    return (
        <main className="external-display">
            <div className="external-display-content">
                <div className="external-eyebrow">CURRENT MOMENT</div>
                <h1 className="external-title">{displayTitle}</h1>
                <div className={cn("external-countdown", (isTimeUp || (timeLeft <= 300 && timeLeft > 0)) && "is-urgent", isTimeUp && extraTimeUsed <= 5 && "is-time-up")} role="timer" aria-live="off">
                    {extraTimeUsed > 5 ? `-${convertSecondsToMinutes(extraTimeUsed)}` : isTimeUp ? "TIME UP" : convertSecondsToMinutes(timeLeft)}
                </div>
                <div className="external-next">
                    <span>NEXT IN SERVICE</span>
                    <p>{canStartNext ? schedules[currentEventIndex + 1]?.title : "Service complete"}</p>
                </div>
            </div>
        </main>
    );
}
