import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random 6-digit code
 */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Format date for display
 */
export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/**
 * Check if event is currently active
 */
export function isEventActive(eventDate: Date): boolean {
  const now = new Date()
  const eventStart = new Date(eventDate)
  // Event is active if it's within 24 hours before the event date
  const dayBefore = new Date(eventStart)
  dayBefore.setDate(dayBefore.getDate() - 1)
  
  return now >= dayBefore && now <= eventStart
}

/**
 * Check if event is in the future
 */
export function isFutureEvent(eventDate: Date): boolean {
  const now = new Date()
  const dayBefore = new Date(eventDate)
  dayBefore.setDate(dayBefore.getDate() - 1)
  
  return now < dayBefore
}

