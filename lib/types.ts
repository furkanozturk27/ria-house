/**
 * TypeScript interfaces for the Event Access System
 * Enterprise-grade type definitions for type safety
 * 
 * These interfaces match the Supabase database schema exactly
 */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

/**
 * Event interface matching the database schema
 * Table: public.events
 */
export interface Event {
  id: string
  title: string
  date: Date | string  // Note: DB uses 'date', not 'event_date'
  description: string | null
  location: string
  is_active: boolean
  created_at: Date | string
}

/**
 * Code interface matching the database schema
 * Table: public.codes
 */
export interface Code {
  id: string
  event_id: string
  code: string  // 6-character alphanumeric
  assigned_to_application_id: string | null
  created_at: Date | string
}

/**
 * Application interface matching the database schema
 * Table: public.applications
 */
export interface Application {
  id: string
  event_id: string
  instagram_handle: string
  status: ApplicationStatus
  device_info: string | null
  client_secret: string | null
  created_at: Date | string
}

/**
 * Application with assigned code (for display purposes)
 */
export interface ApplicationWithCode extends Application {
  assigned_code: string | null
}

/**
 * Event with related data
 */
export interface EventWithDetails extends Event {
  codes: Code[]
  applications: ApplicationWithCode[]
}

