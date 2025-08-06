import { Injectable } from '@angular/core';
import { TrackingEvent } from '../interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class EventQueueService {
  private queue: TrackingEvent[] = [];
  private readonly maxQueueSize: number = 150;
  private queueSizeSubject = new BehaviorSubject<number>(0);
  private queueSize$ = this.queueSizeSubject.asObservable();

  constructor () {}

  addEvent(event: TrackingEvent): void {
    this.queue.push(event)
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }
    this.queueSizeSubject.next(this.queue.length)
  }

  getEvents(): TrackingEvent[] {
    return [...this.queue]
  }

  getEventsAndClear(): TrackingEvent[] {
    const events = [...this.queue]
    this.queue = [];
    this.queueSizeSubject.next(0);
    return events
  }

  clearQueue(): void {
    this.queue = [];
  }

  getQueueSize(): number {
    return this.queue.length
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }

  hasEvents(): boolean {
    return this.queue.length > 0;
  }
}