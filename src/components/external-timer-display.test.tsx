import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import ExternalTimerDisplay from "./external-timer-display";

type Moment = { id: string; title: string; duration: number };
type EventCallback = (event: { payload: unknown }) => void;

const ipc = vi.hoisted(() => {
  const listeners = new Map<string, Set<EventCallback>>();
  const moments: Moment[] = [
    { id: "opening", title: "Opening worship", duration: 300 },
    { id: "message", title: "Message", duration: 1200 },
  ];

  const dispatch = (name: string, payload?: unknown) => {
    for (const callback of listeners.get(name) ?? []) callback({ payload });
  };

  return {
    listeners,
    moments,
    dispatch,
    invoke: vi.fn(async (command: string) => {
      if (command === "load_schedules") return JSON.stringify(moments);
    }),
    emitTo: vi.fn(async (_target: string, name: string, payload?: unknown) => {
      dispatch(name, payload);
    }),
  };
});

vi.mock("@tauri-apps/api/core", () => ({ invoke: ipc.invoke }));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async (name: string, callback: EventCallback) => {
    const callbacks = ipc.listeners.get(name) ?? new Set<EventCallback>();
    callbacks.add(callback);
    ipc.listeners.set(name, callbacks);
    return () => callbacks.delete(callback);
  }),
  emitTo: ipc.emitTo,
}));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ label: "main" }),
}));

// The timer page contains monitor controls; this keeps the test focused on the
// real App state, event bridge, and external display without opening a monitor.
vi.mock("@/components/timer-layout", () => ({
  default: ({
    currentEventIndex,
    isTimeUp,
    handlePlay,
  }: {
    currentEventIndex: number;
    isTimeUp: boolean;
    handlePlay: () => void;
  }) => (
    <section>
      <output aria-label="Current moment number">{currentEventIndex + 1}</output>
      <output aria-label="Timer status">{isTimeUp ? "Time up" : "Ready or running"}</output>
      <button onClick={handlePlay}>Start moment</button>
    </section>
  ),
}));
vi.mock("@/pages/schedule-entry", () => ({ default: () => null }));

function sendTimerTick(seconds: number) {
  act(() => ipc.dispatch("timer-update", seconds));
}

async function renderMainWindow() {
  render(<App />);
  await waitFor(() => expect(ipc.invoke).toHaveBeenCalledWith("load_schedules"));
  await waitFor(() => expect(ipc.listeners.get("external-timer-ready")?.size).toBe(1));
  await waitFor(() => expect(screen.getByRole("button", { name: "Start moment" })).toBeEnabled());
}

async function advanceToMessage(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Start moment" }));
  sendTimerTick(0);
  await screen.findByText("Time up");
  await user.click(screen.getByRole("button", { name: "Start moment" }));
  await waitFor(() => expect(screen.getByLabelText("Current moment number")).toHaveTextContent("2"));
}

beforeEach(() => {
  ipc.listeners.clear();
  ipc.invoke.mockClear();
  ipc.emitTo.mockClear();
  ipc.moments.splice(0, ipc.moments.length,
    { id: "opening", title: "Opening worship", duration: 300 },
    { id: "message", title: "Message", duration: 1200 },
  );
  window.history.replaceState({}, "", "/timer");
});

describe("external timer display", () => {
  it("shows the active moment's title and remaining duration, then follows timer ticks", async () => {
    const user = userEvent.setup();
    await renderMainWindow();
    await advanceToMessage(user);

    render(<ExternalTimerDisplay />);

    expect(await screen.findByRole("heading", { name: "Message" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("20:00");
    expect(screen.getByText("Service complete")).toBeInTheDocument();

    sendTimerTick(1199);
    expect(screen.getByRole("timer")).toHaveTextContent("19:59");
  });

  it("requests fresh state after the external display disconnects and reopens", async () => {
    const user = userEvent.setup();
    await renderMainWindow();
    const firstDisplay = render(<ExternalTimerDisplay />);
    expect(await screen.findByRole("heading", { name: "Opening worship" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");

    firstDisplay.unmount();
    await advanceToMessage(user);
    render(<ExternalTimerDisplay />);

    expect(await screen.findByRole("heading", { name: "Message" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Opening worship" })).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("20:00");
    expect(ipc.emitTo).toHaveBeenCalledWith("main", "external-timer-ready");
  });

  it("shows the first scheduled moment at full duration when nothing is running", async () => {
    await renderMainWindow();
    render(<ExternalTimerDisplay />);

    expect(await screen.findByRole("heading", { name: "Opening worship" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");

    sendTimerTick(0); // A reset, not the end of a running moment.
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByRole("timer")).not.toHaveTextContent("TIME UP");
  });

  it("shows a neutral fallback when the service has no moments", async () => {
    ipc.moments.splice(0);
    await renderMainWindow();
    render(<ExternalTimerDisplay />);

    expect(await screen.findByRole("heading", { name: "Service moment" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByText("Service complete")).toBeInTheDocument();
  });
});
