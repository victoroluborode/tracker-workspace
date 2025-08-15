// // 1. interfaces/tracking.interfaces.ts

// export interface UserIdentity {
//   userId: string;
//   email?: string;
//   name?: string;
//   organizationId?: string;
//   customProperties?: Record<string, any>;
// }

// export interface TrackingEvent {
//   eventId: string;
//   eventName: string;
//   userId?: string;
//   sessionId: string;
//   organizationId?: string;
//   timestamp: number;
//   properties?: Record<string, any>;
//   platform: string;
//   page?: string;
// }

// export interface TrackerConfig {
//   platform: string;
//   userIdentificationEndpoint: string,
//   eventIngestionEndpoint: string,
//   batchSize?: number;
//   flushInterval?: number;
//   debug?: boolean;
// }

// export interface EventBatch {
//   events: TrackingEvent[];
//   timestamp: number;
//   batchId: string;
// }

// // 2. enums/tracking.enums.ts

// export enum EventNames {
  
//   GET_ALL_TRANSACTIONS = 'get_all_transactions',
//   GET_TRANSACTION_DETAILS = 'get_transaction_details', 
//   CREATE_TRANSACTION = 'create_transaction',
//   UPDATE_TRANSACTION = 'update_transaction',
//   DELETE_TRANSACTION = 'delete_transaction',
  
  
//   GET_ALL_BUDGETS = 'get_all_budgets',
//   CREATE_BUDGET = 'create_budget',
//   UPDATE_BUDGET = 'update_budget',
  
  
//   USER_LOGIN = 'user_login',
//   USER_LOGOUT = 'user_logout',
//   PAGE_VIEW = 'page_view',
//   BUTTON_CLICK = 'button_click'
// }

// export enum Platform {
//   HUB = '390Hub',
//   WORK = '390Work',
//   LEARN = '390Learn'
// }

// // 3. services/session.service.ts

// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })

// export class SessionService {
//   private sessionId: string;
//   private userId: string | null = null;
//   private sessionStartTime: number;

//   constructor() {
//     this.sessionId = this.generateSessionId();
//     this.sessionStartTime = Date.now();
//   }

//   getSessionId(): string {
//     return this.sessionId;
//   }

//   setUserId(userId: string): void {
//     this.userId = userId
//   }

//   getUserId(): string | null {
//     return this.userId;
//   }

//   getSessionDuration(): number {
//     return Date.now() - this.sessionStartTime;
//   }

//   renewSession(): void {
//     this.sessionId = this.generateSessionId();
//     this.sessionStartTime = Date.now();
//   }

//   private generateSessionId(): string {
//     return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
//   }
// }

// // 4.  services/storage.service.ts

// import { Injectable } from "@angular/core";
// import { TrackingEvent } from "../interfaces";
// import { UserIdentity } from "../interfaces";

// @Injectable({
//   providedIn: 'root'
// })

// export class StorageService {
//   private readonly DB_NAME = 'TrackerDB';
//   private readonly DB_VERSION = 1;
//   private readonly EVENTS_STORE = 'events';
//   private readonly USER_STORE = 'user';
//   private readonly MAX_EVENTS = 50;
//   private db: IDBDatabase | null = null;  // holds reference to the indexedDB once it's successfully opened.

//   constructor() {
//     this.initDB();
//   }

//   //setting up the database
//   private async initDB(): Promise<void> {
//     return new Promise((resolve, reject) => {
//       // to open or create the database
//       const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
//       request.onerror = () => {
//         console.warn("Failed to open IndexedDB:", request.error);
//         reject(request.error)
//       }

//       request.onsuccess = () => {
//         this.db = request.result;
//         resolve();
//       }

//       //Database schema creation
//       request.onupgradeneeded = (event) => {
//         const db = (event.target as IDBOpenDBRequest).result;

//         //create the events store
//         if (!db.objectStoreNames.contains(this.EVENTS_STORE)) {
//           const eventsStore = db.createObjectStore(this.EVENTS_STORE, { keyPath: 'eventId' });
//           eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
//         }

//         //create the user store
//         if (!db.objectStoreNames.contains(this.USER_STORE)) {
//           db.createObjectStore(this.USER_STORE, {
//             keyPath: 'userId'
//           })
//         }
//       }
//     })
//   }
  
//   //Ensures database connection is open before any operation is attempted 
//   private async ensureDB(): Promise<IDBDatabase> {
//     if (!this.db) {
//       await this.initDB();
//     }
    
//     if (!this.db) {
//       throw new Error('Failed to initialize IndexedDB');
//     }

//     return this.db;
//   }


//   //Storing events

//   async saveEvents(events: TrackingEvent[]): Promise<void> {
//     try {
//       const db = await this.ensureDB();
//       const existingEvents = await this.getStoredEvents();
//       const allEvents = [...existingEvents, ...events];

//       const limitedEvents = allEvents
//         .sort((a, b) => b.timestamp - a.timestamp)
//         .slice(0, this.MAX_EVENTS);
      
//       //setting up a transaction in IndexedDB to modify the EVENTS_STORE
//       const transaction = db.transaction([this.EVENTS_STORE], 'readwrite');
//       const store = transaction.objectStore(this.EVENTS_STORE);

//       await this.clearStoredEvents();


//       //add new events
//       const promises = limitedEvents.map(event =>
//         new Promise<void>((resolve, reject) => {
//           const request = store.add(event);
//           request.onsuccess = () => resolve();
//           request.onerror = () => reject(request.error);
//         })
//       );

//       await Promise.all(promises);

//     } catch (error) {
//       console.warn('Failed to save events:', error);
//     }
//   }


//   async getStoredEvents(): Promise<TrackingEvent[]> {
//     try {
//       const db = await this.ensureDB();
//       const transaction = db.transaction([this.EVENTS_STORE], 'readonly');
//       const store = transaction.objectStore(this.EVENTS_STORE);
//       const index = store.index('timestamp');

//       return new Promise((resolve, reject) => {
//         const events: TrackingEvent[] = [];
//         const request = index.openCursor(null, 'prev');

//         request.onsuccess = () => {
//           const cursor = request.result;
//           if (cursor) {
//             events.push(cursor.value);
//             cursor.continue();
//           } else {
//             resolve(events);
//           }
//         }

//         request.onerror = () => {
//           console.warn('Failed to get stored events:', request.error);
//           reject(request.error);
//         }
//       })
//     } catch (error) {
//       console.warn('Failed to get stored events:', error);
//       return [];
//     }
//   };


//   async clearStoredEvents(): Promise<void> {
//     try {
// const db = await this.ensureDB();
//     const transaction = db.transaction([this.EVENTS_STORE], 'readwrite');
//     const store = transaction.objectStore(this.EVENTS_STORE);

//       return new Promise((resolve, reject) => {
//         const request = store.clear();
//         request.onsuccess = () => resolve();
//         request.onerror = () => {
//           console.warn('Failed to clear events:', request.error);
//           reject(request.error);
//         }
//       });
//     } catch (error) {
//       console.warn('Failed to clear events:', error);
//     }
//   }
  

//   async saveUser(user: UserIdentity): Promise<void> {
//     try {
//       const db = await this.ensureDB();
//       const transaction = db.transaction([this.USER_STORE], 'readwrite');
//       const store = transaction.objectStore(this.USER_STORE);

//       return new Promise((resolve, reject) => {
//         const request = store.put(user);
//         request.onsuccess = () => resolve();
//         request.onerror = () => {
//           console.warn('Failed to save user:', request.error);
//           reject(request.error);
//         };
//       });
//     } catch (error) {
//       console.warn('Failed to save user:', error);
//     }
//   }



//   async getStoredUser(): Promise<UserIdentity | null> {
//     try {
//       const db = await this.ensureDB();
//       const transaction = db.transaction([this.USER_STORE], 'readonly');
//       const store = transaction.objectStore(this.USER_STORE);

//       return new Promise((resolve, reject) => {
//         // Get the first (and should be only) user record
//         const request = store.openCursor();
        
//         request.onsuccess = () => {
//           const cursor = request.result;
//           if (cursor) {
//             resolve(cursor.value);
//           } else {
//             resolve(null);
//           }
//         };

//         request.onerror = () => {
//           console.warn('Failed to get stored user:', request.error);
//           reject(request.error);
//         };
//       });
//     } catch (error) {
//       console.warn('Failed to get stored user:', error);
//       return null;
//     }
//   }



//   async clearUser(): Promise<void> {
//     try {
//       const db = await this.ensureDB();
//       const transaction = db.transaction([this.USER_STORE], 'readwrite');
//       const store = transaction.objectStore(this.USER_STORE);

//       return new Promise((resolve, reject) => {
//         const request = store.clear();
//         request.onsuccess = () => resolve();
//         request.onerror = () => {
//           console.warn('Failed to clear user:', request.error);
//           reject(request.error);
//         };
//       });
//     } catch (error) {
//       console.warn('Failed to clear user:', error);
//     }
//   }


//   async getDatabaseInfo(): Promise<{ eventCount: number; userExists: boolean }> {
//     try {
//       const events = await this.getStoredEvents();
//       const user = await this.getStoredUser();
      
//       return {
//         eventCount: events.length,
//         userExists: user !== null
//       };
//     } catch (error) {
//       console.warn('Failed to get database info:', error);
//       return { eventCount: 0, userExists: false };
//     }
//   }
// }

// // 5. services/tracker-api.service.ts

// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { retry, catchError } from 'rxjs/operators';
// import { TrackingEvent, EventBatch, UserIdentity } from '../interfaces';

// @Injectable({
//   providedIn: 'root'
// })

// export class TrackerApiService {
//   constructor(private http: HttpClient) { }

//   sendEventBatch(batch: EventBatch, apiEndpoint: string): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json'
//     });

//     return this.http.post(`${apiEndpoint}/events/batch`, batch, { headers })
//       .pipe(
//         retry(3),
//         catchError(error => {
//           console.error('Tracker ApiService: Failed to send event batch:', error);
//           return of({success: false, error})
//         })
//     )
//   }

//   sendEvent(event: TrackingEvent, apiEndpoint: string): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-type': 'application/json'
//     });

//     return this.http.post(`${apiEndpoint}/events`, event, { headers })
//       .pipe(
//         retry(1),
//         catchError(error => {
//           console.error('Tracker ApiService: Failed to send single event:', error);
//           return of({ success: false, error });
//         })
//     )
//   }

//   sendUserIdentification(user: UserIdentity, apiEndpoint: string): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json'
//     });

//     return this.http.post(`${apiEndpoint}/identify`, user, { headers })
//       .pipe(
//         retry(1),
//         catchError(error => {
//           console.error('Tracker ApiService: Failed to send user identification:', error);
//           return of({ success: false, error });
//         })
//     )
//   }
//   }

// // 6. services/event-queue.service.ts
// import { Injectable } from '@angular/core';
// import { TrackingEvent } from '../interfaces';
// import { BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })

// export class EventQueueService {
//   private queue: TrackingEvent[] = [];
//   private readonly maxQueueSize: number = 150;
//   private queueSizeSubject = new BehaviorSubject<number>(0);
//   private queueSize$ = this.queueSizeSubject.asObservable();

//   constructor () {}

//   addEvent(event: TrackingEvent): void {
//     this.queue.push(event)
//     if (this.queue.length > this.maxQueueSize) {
//       this.queue.shift();
//     }
//     this.queueSizeSubject.next(this.queue.length)
//   }

//   getEvents(): TrackingEvent[] {
//     return [...this.queue]
//   }

//   getEventsAndClear(): TrackingEvent[] {
//     const events = [...this.queue]
//     this.queue = [];
//     this.queueSizeSubject.next(0);
//     return events
//   }

//   clearQueue(): void {
//     this.queue = [];
//   }

//   getQueueSize(): number {
//     return this.queue.length
//   }

//   isEmpty(): boolean {
//     return this.queue.length === 0
//   }

//   hasEvents(): boolean {
//     return this.queue.length > 0;
//   }
// }

// // 7. services/tracker.service.ts (Main Service)

// import { Injectable, OnDestroy } from '@angular/core';
// import { TrackingEvent, TrackerConfig, UserIdentity, EventBatch } from '../interfaces/tracking.interfaces';
// import { Platform } from '../enums';
// import {interval, Subscription} from 'rxjs';
// import { SessionService } from './session.service';
// import { StorageService } from './storage.service';
// import { TrackerApiService } from './tracker-api.service';
// import { EventQueueService } from './event-queue.service';


// @Injectable({
//   providedIn: 'root'
// })
// export class TrackerService implements OnDestroy{
//   private config: TrackerConfig = {
//     platform: Platform.WORK,
//     batchSize: 50,
//     flushInterval: 60000, // 1 minute
//     userIdentificationEndpoint: 'https://api.yourdomain.com/identify',
//     eventIngestionEndpoint: 'https://api.yourdomain.com/track',
//     debug: false,
//   }
  
//   private isInitialized = false;
//   private flushSubscription?: Subscription;
//   private currentUser: UserIdentity | null = null;

//   constructor(
//     private sessionService: SessionService,
//     private storageService: StorageService,
//     private apiService: TrackerApiService,
//     private eventQueue: EventQueueService
//   ) {}

//   //Accepts a partial configuration (callers don't need to provide all config keys, just what they want to override)
//   initialize(config: Partial<TrackerConfig>): void {
//     this.config = { ...this.config, ...config };
//     this.isInitialized = true;

//     if(this.config.debug) {
//     console.log('Tracker Initialized: ', this.config)
//     }
    
//     //starts the background timer to flush events to the backend
//     this.startAutoFlush();

//     //loads previously stored users
//     this.loadStoredUser();

//     //loads previously stored events from indexedDB
//     this.loadStoredEvents();
//   }


//   //This saves the user's identity, updates the session service, persists user to indexedDB and sends it to the Backend
//   identify(userInfo: UserIdentity): void {
//       if(!this.isInitialized) {
//       console.warn('Tracker not initialized');
//       return;
//     }
  
//     this.currentUser = userInfo;
//     this.sessionService.setUserId(userInfo.userId);
//     this.storageService.saveUser(userInfo);

//     if (this.config.userIdentificationEndpoint) {
//       this.apiService.sendUserIdentification(userInfo, this.config.userIdentificationEndpoint)
//         .subscribe(response => {
//           if (this.config.debug) {
//             console.log('User identification sent: ', response);
//         }
//       })
//     }
//   }


//   // Tracks events, queues them for sending.
//   track(eventName: string, properties?: Record<string, any>): void {
//     if (!this.isInitialized) {
//       console.warn('Tracker not initialized');
//       return;
//     }

//     const event: TrackingEvent = {
//       eventId: this.generateEventId(),
//       eventName,
//       userId: this.sessionService.getUserId() || undefined,
//       sessionId: this.sessionService.getSessionId(),
//       organizationId: this.currentUser?.organizationId,
//       timestamp: Date.now(),
//       properties,
//       platform: this.config.platform,
//       page: this.getCurrentPage()
//     };

//     this.eventQueue.addEvent(event);

//     if (this.config.debug) {
//       console.log('Event tracked:', event);
//     }

//     if (this.eventQueue.getQueueSize() >= (this.config.batchSize || 30)) {
//       this.flush();
//     }
//   }


//   // Flushes events to the Api
//   flush(): void {
//     if (!this.eventQueue.hasEvents()) {
//       return;
//     }

//     const events = this.eventQueue.getEventsAndClear();
//     this.storageService.saveEvents(events);

//     if (this.config.eventIngestionEndpoint) {
//       const batch: EventBatch = {
//         events,
//         timestamp: Date.now(),
//         batchId: this.generateBatchId()
//       };

//       this.apiService.sendEventBatch(batch, this.config.eventIngestionEndpoint)
//         .subscribe(response => {
//           if (this.config.debug) {
//             console.log('Event batch sent:', response);
//           }
          
//           if (response.success) {
//             this.storageService.clearStoredEvents;
//           }
//         });
//     }
//   }

// //resets the current session info and user
//   reset(): void {
//     this.currentUser = null;
//     this.eventQueue.clearQueue();
//     this.sessionService.renewSession();
//     this.storageService.clearUser();
//     this.storageService.clearStoredEvents();

//     if (this.config.debug) {
//       console.log('Tracker reset'); 
//     }
//   }



//   // Returns the currently tracked user
//   getCurrentUser(): UserIdentity | null {
//     return this.currentUser;
//   };

//   // Checks if the tracker is ready
//   isReady(): boolean {
//     return this.isInitialized;
//   }

//   // Get queue size
//   getQueueSize(): number {
//     return this.eventQueue.getQueueSize();
//   }


//   // Flushes events every 60000 milliseconds
//   private startAutoFlush(): void {
//     if (this.flushSubscription) {
//       this.flushSubscription.unsubscribe();
//     }

//     this.flushSubscription = interval(this.config.flushInterval || 60000)
//       .subscribe(() => {
//         if (this.eventQueue.hasEvents()) {
//           this.flush();
//         }
//       });
//   }

// // Loads previously saved user data if it exists
//   private async loadStoredUser(): Promise<void> {
//     this.storageService.getStoredUser().then((storedUser) => {
//       if (storedUser) {
//         this.currentUser = storedUser;
//         this.sessionService.setUserId(storedUser.userId)
//       }
//     }); 
//   }

//   // Loads unsent events from a previous session
//   private async loadStoredEvents(): Promise<void> {
//     this.storageService.getStoredEvents().then((storedEvents) => {
//       if (storedEvents.length > 0) {
//         storedEvents.forEach(event => this.eventQueue.addEvent(event));
//         this.storageService.clearStoredEvents();

//         if (this.config.debug) {
//           console.log(`Loaded ${storedEvents.length} stored events`)
//         }
//       }
//     })
//   }

//   private generateEventId(): string {
//     return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
//   }

//   private generateBatchId(): string {
//     return `batch_${Date.now}_${Math.random().toString(36).substring(2,9)}`
//   }


//   private getCurrentPage(): string {
//     if (typeof window === 'undefined') return 'server';
//     return window.location.pathname;
//   }

//   private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
//     const sanitized: Record<string, any> = {};

//     Object.keys(properties).forEach(key => {
//       const value = properties[key];
//       if (value !== null && value !== undefined && typeof value !== 'function') {
//         sanitized[key] = typeof value === 'string' ? value.substring(0, 500) : value;
//       }
//     });
//     return sanitized;
//   }

//   ngOnDestroy(): void {
//     if (this.flushSubscription) {
//        this.flushSubscription.unsubscribe
//     }
//     this.flush();
//   }
// }

// // 8. tracker.module.ts

// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { provideHttpClient } from '@angular/common/http';
// import { RouterModule } from '@angular/router';

// // Services
// import { TrackerService } from './services/tracker.service';
// import { AutoTrackerService } from './services/auto-tracker.service';

// // Directives
// import { TrackClickDirective } from './directives/track-click.directive';
// import { TrackNavigationDirective } from './directives/track-navigation.directive';

// @NgModule({
//   declarations: [
    
//   ],
//   imports: [
//     CommonModule,
//     RouterModule,
//     TrackClickDirective,
//     TrackNavigationDirective
//   ],
//     providers: [
//     provideHttpClient(),
//     TrackerService,
//     AutoTrackerService
//   ],
//   exports: [
//     TrackClickDirective,
//     TrackNavigationDirective
//   ]
// })
// export class TrackerModule { }


// // 9. directives/track-click.directive.ts 
// import { Directive, ElementRef, HostListener, Input } from '@angular/core';
// import { TrackerService } from '../services/tracker.service';
// import { EventNames } from '../enums/tracking.enums';


// // Tells Angular that this is a directive
// @Directive({
//     selector: '[trackClick]'
// })

// export class TrackClickDirective {
//     @Input() trackClick: string = ''; // Let's you pass a custom event name into the directive
//     @Input() trackProperties: Record<string, any> = {}; //This lets you attach additional data to the tracking event
//     @Input() trackEventName: EventNames = EventNames.BUTTON_CLICK; //A fallback to use one of the enum values if trackClick is not provided

//     constructor(
//         private tracker: TrackerService,
//         private el: ElementRef
//     ) { }
    
//     // Listening for Clicks: 

//     @HostListener('click', ['$event'])
//     onClick(event: MouseEvent): void {
//         const element = this.el.nativeElement; // retrieves the raw html element

//         const elementInfo = {
//             tag: element.tagName.toLowerCase(),
//             text: element.textContent?.trim().substring(0, 100) || '',
//             classes: element.className || '',
//             id: element.id || '',
//             href: element.href || '',
//             ...this.trackProperties
//         };


//         const eventName = this.trackClick || this.trackEventName


//         this.tracker.track(eventName, {
//             element: elementInfo,
//             page: window.location.pathname,
//             timestamp: Date.now(),
//             clickPosition: {
//                 x: event.clientX,
//                 y: event.clientY
//             }
//         });
//     }

    
// }

// // 10. directives/track-navigation.directive.ts
// import { Directive, OnInit, OnDestroy } from "@angular/core";
// import { Subscription } from 'rxjs';
// import { filter } from "rxjs/operators";
// import { NavigationEnd, Router } from "@angular/router";
// import { TrackerService } from "../services";
// import { EventNames } from "../enums";


// @Directive({
//     selector: '[trackNavigation]'
// })

// export class TrackNavigationDirective implements OnInit, OnDestroy {
//     private navigationSubscription?: Subscription;  //stores the subscription so we can later unsubscribe in ngOnDestroy
//     private previousUrl: string = '';

//     constructor(
//         private router: Router,
//         private tracker: TrackerService
//     ) { }

//     // Lifecycle hooks when the directive starts
//     ngOnInit(): void {
//         this.previousUrl = this.router.url;  // this.router.url gives the current url in the browser when the directive is first loaded
//         this.navigationSubscription = this.router.events
//             .pipe(filter(event => event instanceof NavigationEnd))
//             .subscribe((event: NavigationEnd) => {
//                 this.trackNavigation(event);
//             });
//     }

//     private trackNavigation(event: NavigationEnd): void {
//         //write this after writing the trackerservice
//         this.tracker.track(EventNames.PAGE_VIEW, {
//             currenturl: event.url,
//             previous: this.previousUrl,
//             urlAfterRedirects: event.urlAfterRedirects,
//             navigationId: event.id,
//             timestamp: Date.now(),
//             referrer: document.referrer
//         });

//         this.previousUrl = event.url;
//     }

//     ngOnDestroy(): void {
//         if (this.navigationSubscription) {
//             this.navigationSubscription.unsubscribe();
//         }
//     }
// }
 