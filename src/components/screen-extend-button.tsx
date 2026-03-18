import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Monitor, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MonitorInfo {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ScreenExtendButtonProps {
    isExtended: boolean;
    onExtendChange: (extended: boolean) => void;
}

export default function ScreenExtendButton({ isExtended, onExtendChange }: ScreenExtendButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (isExtended) {
            // Close external timer
            try {
                await invoke("close_external_timer");
                onExtendChange(false);
                toast.success("External display closed");
            } catch (e) {
                console.error("Failed to close external timer:", e);
                toast.error("Failed to close external display");
            }
            return;
        }

        setIsLoading(true);
        try {
            // Detect monitors
            toast.info("Detecting monitors on backend...");
            const monitors = await invoke<MonitorInfo[]>("get_monitors");
            console.log("Detected monitors:", monitors);
            toast.info(`Detected ${monitors.length} monitor(s)`);

            if (monitors.length < 2) {
                toast.error("No second monitor detected", {
                    description: "Connect a second monitor or projector to use screen extend.",
                });
                return;
            }

            // Find the secondary monitor (not the primary one at 0,0)
            const secondaryMonitor = monitors.find((m) => m.x !== 0 || m.y !== 0) || monitors[1];

            // Open external timer on the secondary monitor
            toast.info(`Opening timer on monitor: ${secondaryMonitor.name}`);
            await invoke("open_external_timer", {
                monitorX: secondaryMonitor.x,
                monitorY: secondaryMonitor.y,
            });

            onExtendChange(true);
            toast.success("Timer extended to second screen", {
                description: secondaryMonitor.name || "External display",
            });
        } catch (e) {
            console.error("Failed to open external timer:", e);
            toast.error("Failed to extend to second screen");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
                "w-16 h-16 rounded-3xl border-white/5 transition-all active:scale-90",
                isExtended
                    ? "bg-primary/20 hover:bg-primary/30 border-primary/30 hover:border-primary/40 text-primary"
                    : "bg-white/5 hover:bg-white/10 hover:border-white/10"
            )}
            title={isExtended ? "Stop extending to second screen" : "Extend timer to second screen"}
        >
            {isExtended ? (
                <MonitorOff className="size-6" />
            ) : (
                <Monitor className="size-6 text-white/60" />
            )}
        </Button>
    );
}
