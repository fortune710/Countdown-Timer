import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { Clock, GripVertical, Trash, MoreVertical, Edit } from "lucide-react"
import { cn, convertSecondsToMinutes } from "@/lib/utils"
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";

interface IScheduleItem {
    title: string;
    duration: number;
    id: string;
}

export function ScheduleItem(props: {
    event: IScheduleItem,
    index: number,
    deleteSchedule: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.event.id });

    const style = {
        transform: `translate3d(${transform?.x}px, ${transform?.y}px, 0)`,
        transition,
    };

    const deleteItem = () => {
        return props.deleteSchedule(props.event.id)
    }

    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {props.event.title} ({props.event.duration}s)

            <button onClick={deleteItem}>
                Delete
            </button>
        </li>
    );
}


export function ScheduleCard(props: {
    event: IScheduleItem,
    index: number,
    isActive?: boolean;
    deleteSchedule: (id: string) => void;
    updateSchedule: (id: string, title: string, duration: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.event.id });

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(props.event.title);
    const [editDuration, setEditDuration] = useState(String(Math.floor(props.event.duration / 60)));

    const deleteItem = () => {
        return props.deleteSchedule(props.event.id)
    }

    const handleEdit = () => {
        setEditTitle(props.event.title);
        setEditDuration(String(Math.floor(props.event.duration / 60)));
        setIsEditDialogOpen(true);
    }

    const handleSaveEdit = () => {
        if (editTitle && editDuration) {
            props.updateSchedule(props.event.id, editTitle, Number(editDuration) * 60);
            setIsEditDialogOpen(false);
        }
    }

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    return (
        <>
            <section
                ref={setNodeRef}
                style={style}
                className={cn(
                    "group relative border transition-all duration-300",
                    "rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/10 shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5",
                    props.isActive ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/20 ring-1 ring-primary/20" : "border-white/5",
                    isDragging ? "opacity-30 scale-[0.98] z-50 cursor-grabbing bg-white/10" : "cursor-grab"
                )}
                {...attributes}
            >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-white/20 group-hover:text-primary/40 transition-colors" {...listeners}>
                    <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex items-center p-5 pl-14">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "font-bold truncate text-lg tracking-tight transition-colors",
                                props.isActive ? "text-primary" : "text-white group-hover:text-primary"
                            )}>
                                {props.event.title}
                            </div>
                            {props.isActive && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-[10px] font-black text-primary animate-pulse">
                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                    RUNNING
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-500 group-hover:text-primary/60 transition-colors uppercase tracking-wider">
                                <Clock className="h-3 w-3" />
                                <span>
                                    {props.event.duration < 60
                                        ? `${props.event.duration}s`
                                        : `${convertSecondsToMinutes(Number(props.event.duration))}m`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all max-md:hidden">
                        <Button
                            onClick={handleEdit}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={deleteItem}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/40">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-lg border-white/10">
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Edit className="size-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={deleteItem} className="text-destructive focus:text-destructive">
                                    <Trash className="size-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </section>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-white/10 bg-black/80 backdrop-blur-3xl text-white rounded-[1rem] w-[95vw] max-w-lg z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Event</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Update the event title and duration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-3">
                            <Label htmlFor="edit-title" className="text-sm font-bold text-zinc-400 ml-1">Event Title</Label>
                            <Input
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Event Title"
                                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/40"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="edit-duration" className="text-sm font-bold text-zinc-400 ml-1">Duration (minutes)</Label>
                            <Input
                                id="edit-duration"
                                type="number"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                placeholder="Duration (minutes)"
                                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/40"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-white/10 hover:bg-white/5 rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

