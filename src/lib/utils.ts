import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function convertSecondsToMinutes(timeLeft: number) {
  return `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String((timeLeft % 60)).padStart(2, '0')}`
}