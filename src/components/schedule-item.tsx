import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { Clock, DotsSixVertical, Trash, DotsThreeVertical, PencilSimple } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
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
    event: IScheduleItem;
    index: number;
    isActive?: boolean;
    deleteSchedule: (id: string) => void;
    updateSchedule: (id: string, title: string, duration: number) => void;
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: props.event.id });
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(props.event.title);
    const [editDuration, setEditDuration] = useState(String(Math.floor(props.event.duration / 60)));

    const handleEdit = () => {
        setEditTitle(props.event.title);
        setEditDuration(String(Math.floor(props.event.duration / 60)));
        setIsEditDialogOpen(true);
    };
    const handleSaveEdit = () => {
        const duration = Number(editDuration);
        if (!editTitle.trim() || !Number.isInteger(duration) || duration < 1 || duration > 1440) return;
        props.updateSchedule(props.event.id, editTitle.trim(), duration * 60);
        setIsEditDialogOpen(false);
    };
    const durationLabel = props.event.duration < 60
        ? `${props.event.duration} sec`
        : `${Math.floor(props.event.duration / 60)} min`;

    return (
        <>
            <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn("service-item", props.isActive && "is-current", isDragging && "is-dragging")}>
                <button type="button" ref={setActivatorNodeRef} className="service-item-handle" aria-label={`Move ${props.event.title}`} {...attributes} {...listeners}><DotsSixVertical size={20} /></button>
                <span className="service-item-number" aria-hidden="true">{String(props.index + 1).padStart(2, "0")}</span>
                <div className="service-item-body">
                    <div className="service-item-title-row"><h3>{props.event.title}</h3>{props.isActive && <span className="service-item-current">Current</span>}</div>
                    <div className="service-item-duration"><Clock size={15} aria-hidden="true" />{durationLabel}</div>
                </div>
                <div className="service-item-actions">
                    <Button type="button" variant="ghost" size="icon" onClick={handleEdit} aria-label={`Edit ${props.event.title}`}><PencilSimple size={18} /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => props.deleteSchedule(props.event.id)} aria-label={`Delete ${props.event.title}`}><Trash size={18} /></Button>
                </div>
                <div className="service-item-mobile-actions"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${props.event.title}`}><DotsThreeVertical size={20} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={handleEdit}><PencilSimple size={16} /> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => props.deleteSchedule(props.event.id)} className="text-destructive"><Trash size={16} /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit service moment</DialogTitle><DialogDescription>Update this part of the Sunday service.</DialogDescription></DialogHeader>
                    <div className="grid gap-5 py-4"><div className="grid gap-2"><Label htmlFor={`edit-title-${props.event.id}`}>Moment title</Label><Input id={`edit-title-${props.event.id}`} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="e.g. Opening worship" /></div><div className="grid gap-2"><Label htmlFor={`edit-duration-${props.event.id}`}>Duration in minutes</Label><Input id={`edit-duration-${props.event.id}`} type="number" min="1" max="1440" value={editDuration} onChange={(event) => setEditDuration(event.target.value)} /></div></div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveEdit}>Save changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
