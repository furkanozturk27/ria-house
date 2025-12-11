/**
 * Mock Data for Development and Demonstration
 * Realistic event data for the luxury nightclub system
 */

import { Event, Code, Application } from './types'

// Mock Events
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Saturday Night Fever',
    description: 'An exclusive rooftop party featuring world-class DJs and premium cocktails. Dress code: Elegant Black.',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    is_active: true,
    is_archived: false,
    location: 'Rooftop Lounge, Downtown',
  },
  {
    id: '2',
    title: 'Midnight Masquerade',
    description: 'A mysterious evening of elegance and intrigue. Masks required. Premium bottle service available.',
    event_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (past event)
    is_active: false,
    is_archived: true,
    location: 'Grand Ballroom',
  },
  {
    id: '3',
    title: 'Exclusive Rooftop Party',
    description: 'VIP access to our signature summer event. Live performances and curated selection of premium spirits.',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow (current/active)
    is_active: true,
    is_archived: false,
    location: 'Sky Terrace',
  },
  {
    id: '4',
    title: 'New Year\'s Eve Gala',
    description: 'Ring in the new year with an unforgettable celebration. Champagne toast at midnight.',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    is_active: false,
    is_archived: false,
    location: 'Main Hall',
  },
]

// Mock Codes
export const mockCodes: Code[] = [
  { id: 'c1', event_id: '3', code: '123456', is_used: false, assigned_to_application_id: null },
  { id: 'c2', event_id: '3', code: '234567', is_used: false, assigned_to_application_id: null },
  { id: 'c3', event_id: '3', code: '345678', is_used: true, assigned_to_application_id: 'a1' },
  { id: 'c4', event_id: '3', code: '456789', is_used: false, assigned_to_application_id: null },
  { id: 'c5', event_id: '3', code: '567890', is_used: false, assigned_to_application_id: null },
]

// Mock Applications
export const mockApplications: Application[] = [
  {
    id: 'a1',
    event_id: '3',
    instagram_handle: '@johndoe',
    status: 'approved',
    approved_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assigned_code: '345678',
  },
  {
    id: 'a2',
    event_id: '3',
    instagram_handle: '@janedoe',
    status: 'pending',
    approved_at: null,
    assigned_code: null,
  },
  {
    id: 'a3',
    event_id: '3',
    instagram_handle: '@luxury_lifestyle',
    status: 'pending',
    approved_at: null,
    assigned_code: null,
  },
  {
    id: 'a4',
    event_id: '3',
    instagram_handle: '@nightlife_enthusiast',
    status: 'rejected',
    approved_at: null,
    assigned_code: null,
  },
]

/**
 * Get applications for a specific event
 */
export function getApplicationsForEvent(eventId: string): Application[] {
  return mockApplications.filter(app => app.event_id === eventId)
}

/**
 * Get codes for a specific event
 */
export function getCodesForEvent(eventId: string): Code[] {
  return mockCodes.filter(code => code.event_id === eventId)
}

/**
 * Get unused codes for a specific event
 */
export function getUnusedCodesForEvent(eventId: string): Code[] {
  return mockCodes.filter(code => code.event_id === eventId && !code.is_used)
}

/**
 * Find application by Instagram handle
 */
export function findApplicationByHandle(handle: string, eventId: string): Application | undefined {
  return mockApplications.find(
    app => app.instagram_handle.toLowerCase() === handle.toLowerCase() && app.event_id === eventId
  )
}

