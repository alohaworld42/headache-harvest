
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRandomColor(): string {
  const colors = [
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F97316", // Orange
    "#22C55E", // Green
    "#0EA5E9", // Blue
    "#F43F5E", // Red
    "#84CC16", // Lime
    "#14B8A6", // Teal  
    "#6366F1", // Indigo
    "#D946EF"  // Fuchsia
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
