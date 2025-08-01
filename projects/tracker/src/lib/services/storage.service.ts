import { Injectable } from "@angular/core";
import { TrackingEvent } from "../interfaces";
import { UserIdentity } from "../interfaces";

@Injectable({
  providedIn: 'root'
})

export class StorageService {
  private readonly EVENTS_KEY = 'tracker_events';
  private readonly USER_KEY = 'tracker_user';
  private readonly MAX_EVENTS = 50;

  constructor() { }
  
  saveEvents(events: TrackingEvent[]): void {
    try {
      const existingEvents = this.getStoredEvents();
      const allEvents = [...existingEvents, ...events]
      const limitedEvents = allEvents.slice(-this.MAX_EVENTS);
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(limitedEvents))
    } catch (error) {
      console.warn('Tracker StorageService: Failed to save events:', error);
    }
  }

  getStoredEvents(): TrackingEvent[] {
    try {
      const data = localStorage.getItem(this.EVENTS_KEY);
    return data ? JSON.parse(data) : []; 
    } catch (error) {
      console.warn('Tracker StorageService: Failed to get stored events:', error);
      return [];
    } 
  }

  clearStoredEvents(): void {
    try {
      localStorage.removeItem(this.EVENTS_KEY);
    } catch (error) {
      console.warn('Tracker StorageService: Failed to clear events:', error);
    }
  }

  saveUser(user: UserIdentity[]): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.warn('Tracker StorageService: Failed to save user:', error);
    }
  }

  getStoredUser(): UserIdentity | null {
    try {
      const data = localStorage.getItem(this.EVENTS_KEY);
    return data ? JSON.parse(data) : null; 
    } catch (error) {
      console.warn('Tracker StorageService: Failed to get stored user:', error);
      return null;
    } 
  }

  clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.warn('Tracker StorageService: Failed to clear user:', error);
    }
  }
}