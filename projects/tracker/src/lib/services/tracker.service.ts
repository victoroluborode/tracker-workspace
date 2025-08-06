import { Injectable, OnDestroy } from '@angular/core';
import { TrackingEvent, TrackerConfig, UserIdentity, EventBatch } from '../interfaces/tracking.interfaces';
import { Platform } from '../enums';
import {interval, Subscription} from 'rxjs';
import { SessionService } from './session.service';
import { StorageService } from './storage.service';
import { TrackerApiService } from './tracker-api.service';
import { EventQueueService } from './event-queue.service';


@Injectable({
  providedIn: 'root'
})
export class TrackerService implements OnDestroy{
  private config: TrackerConfig = {
    platform: Platform.WORK,
    batchSize: 50,
    flushInterval: 60000, // 1 minute
    userIdentificationEndpoint: 'https://api.yourdomain.com/identify',
    eventIngestionEndpoint: 'https://api.yourdomain.com/track',
    debug: false,
  }
  
  private isInitialized = false;
  private flushSubscription?: Subscription;
  private currentUser: UserIdentity | null = null;

  constructor(
    private sessionService: SessionService,
    private storageService: StorageService,
    private apiService: TrackerApiService,
    private eventQueue: EventQueueService
  ) {}

  //Accepts a partial configuration (callers don't need to provide all config keys, just what they want to override)
  initialize(config: Partial<TrackerConfig>): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;

    if(this.config.debug) {
    console.log('Tracker Initialized: ', this.config)
    }
    
    //starts the background timer to flush events to the backend
    this.startAutoFlush();

    //loads previously stored users
    this.loadStoredUser();

    //loads previously stored events from indexedDB
    this.loadStoredEvents();
  }


  //This saves the user's identity, updates the session service, persists user to indexedDB and sends it to the Backend
  identify(userInfo: UserIdentity): void {
      if(!this.isInitialized) {
      console.warn('Tracker not initialized');
      return;
    }
  
    this.currentUser = userInfo;
    this.sessionService.setUserId(userInfo.userId);
    this.storageService.saveUser(userInfo);

    if (this.config.userIdentificationEndpoint) {
      this.apiService.sendUserIdentification(userInfo, this.config.userIdentificationEndpoint)
        .subscribe(response => {
          if (this.config.debug) {
            console.log('User identification sent: ', response);
        }
      })
    }
  }


  // Tracks events, queues them for sending.
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Tracker not initialized');
      return;
    }

    const event: TrackingEvent = {
      eventId: this.generateEventId(),
      eventName,
      userId: this.sessionService.getUserId() || undefined,
      sessionId: this.sessionService.getSessionId(),
      organizationId: this.currentUser?.organizationId,
      timestamp: Date.now(),
      properties,
      platform: this.config.platform,
      page: this.getCurrentPage()
    };

    this.eventQueue.addEvent(event);

    if (this.config.debug) {
      console.log('Event tracked:', event);
    }

    if (this.eventQueue.getQueueSize() >= (this.config.batchSize || 30)) {
      this.flush();
    }
  }


  // Flushes events to the Api
  flush(): void {
    if (!this.eventQueue.hasEvents()) {
      return;
    }

    const events = this.eventQueue.getEventsAndClear();
    this.storageService.saveEvents(events);

    if (this.config.eventIngestionEndpoint) {
      const batch: EventBatch = {
        events,
        timestamp: Date.now(),
        batchId: this.generateBatchId()
      };

      this.apiService.sendEventBatch(batch, this.config.eventIngestionEndpoint)
        .subscribe(response => {
          if (this.config.debug) {
            console.log('Event batch sent:', response);
          }
          
          if (response.success) {
            this.storageService.clearStoredEvents;
          }
        });
    }
  }

//resets the current session info and user
  reset(): void {
    this.currentUser = null;
    this.eventQueue.clearQueue();
    this.sessionService.renewSession();
    this.storageService.clearUser();
    this.storageService.clearStoredEvents();

    if (this.config.debug) {
      console.log('Tracker reset'); 
    }
  }



  // Returns the currently tracked user
  getCurrentUser(): UserIdentity | null {
    return this.currentUser;
  };

  // Checks if the tracker is ready
  isReady(): boolean {
    return this.isInitialized;
  }

  // Get queue size
  getQueueSize(): number {
    return this.eventQueue.getQueueSize();
  }


  // Flushes events every 60000 milliseconds
  private startAutoFlush(): void {
    if (this.flushSubscription) {
      this.flushSubscription.unsubscribe();
    }

    this.flushSubscription = interval(this.config.flushInterval || 60000)
      .subscribe(() => {
        if (this.eventQueue.hasEvents()) {
          this.flush();
        }
      });
  }

// Loads previously saved user data if it exists
  private async loadStoredUser(): Promise<void> {
    this.storageService.getStoredUser().then((storedUser) => {
      if (storedUser) {
        this.currentUser = storedUser;
        this.sessionService.setUserId(storedUser.userId)
      }
    }); 
  }

  // Loads unsent events from a previous session
  private async loadStoredEvents(): Promise<void> {
    this.storageService.getStoredEvents().then((storedEvents) => {
      if (storedEvents.length > 0) {
        storedEvents.forEach(event => this.eventQueue.addEvent(event));
        this.storageService.clearStoredEvents();

        if (this.config.debug) {
          console.log(`Loaded ${storedEvents.length} stored events`)
        }
      }
    })
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private generateBatchId(): string {
    return `batch_${Date.now}_${Math.random().toString(36).substring(2,9)}`
  }


  private getCurrentPage(): string {
    if (typeof window === 'undefined') return 'server';
    return window.location.pathname;
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.keys(properties).forEach(key => {
      const value = properties[key];
      if (value !== null && value !== undefined && typeof value !== 'function') {
        sanitized[key] = typeof value === 'string' ? value.substring(0, 500) : value;
      }
    });
    return sanitized;
  }

  ngOnDestroy(): void {
    if (this.flushSubscription) {
       this.flushSubscription.unsubscribe
    }
    this.flush();
  }
}