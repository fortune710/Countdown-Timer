import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Import the Skeleton component

export default function TimerLoadingSkeleton() {
  return (
    // Keep the overall layout structure
    <div className="flex flex-col items-center justify-center h-screen p-5 text-center">

      {/* Optional placeholder for "Currently Happening" using Skeleton */}
      {/* <Skeleton className="h-8 w-48 mb-10" /> */}

      <div className="my-10 w-full max-w-md flex flex-col items-center">
        {/* Placeholder for Event Title using Skeleton */}
        <Skeleton className="h-10 w-3/4 mb-4" />

        {/* Placeholder for Time Display using Skeleton */}
        <Skeleton className="h-24 w-1/2" />
      </div>

      <div className="flex gap-4">
        {/* Keep Button placeholders as they represent interactive elements */}
        <Button variant="outline" size="icon" disabled className="opacity-50 cursor-not-allowed">
          {/* Use Skeleton for the icon shape if preferred, or keep the gray icon */}
          {/* <Skeleton className="h-6 w-6 rounded-full" /> */}
           <Play className="size-6 text-gray-400" />
        </Button>
        <Button variant="outline" size="icon" disabled className="opacity-50 cursor-not-allowed">
          {/* <Skeleton className="h-6 w-6 rounded-full" /> */}
           <RotateCcw className="text-gray-400 size-6" />
        </Button>
      </div>

      <div className="mt-10 w-full max-w-md flex flex-col items-center">
        {/* Placeholder for "Next Event:" heading using Skeleton */}
        <Skeleton className="h-6 w-32 mb-2" />

        {/* Placeholder for Next Event Title/Text using Skeleton */}
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  );
}