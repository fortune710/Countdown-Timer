import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { Clock, GripVertical, Trash } from "lucide-react"
import { cn, convertSecondsToMinutes } from "@/lib/utils"
import { Button } from "./ui/button";

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
    deleteSchedule: (id: string) => void;  
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.event.id });
    
  
    const deleteItem = () => {
        return props.deleteSchedule(props.event.id)
    }

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    return (
        <section
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative cursor-grab border-l-4 mb-3 shadow-xs transition-all",
                "rounded-md border",
                isDragging && "shadow-sm opacity-75",
            )}
            {...attributes}
            >
            <div className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab p-1 text-muted-foreground" {...listeners}>
                <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex items-center p-3 ml-6">
                <div>
                    <div className="font-medium">{props.event.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{convertSecondsToMinutes(Number(props.event.duration))} minutes</span>
                    </div>
                </div>

                <Button onClick={deleteItem} className="ml-auto" variant="ghost" size="icon">
                    <Trash className="text-destructive size-3"/>
                </Button>
            </div>
        </section>
    )
}

