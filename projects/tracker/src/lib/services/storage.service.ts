import { Injectable } from "@angular/core";
import { TrackingEvent } from "../interfaces";
import { UserIdentity } from "../interfaces";

@Injectable({
  providedIn: 'root'
})

export class StorageService {
  private readonly DB_NAME = 'TrackerDB';
  private readonly DB_VERSION = 1;
  private readonly EVENTS_STORE = 'events';
  private readonly USER_STORE = 'user';
  private readonly MAX_EVENTS = 50;
  private db: IDBDatabase | null = null;  // holds reference to the indexedDB once it's successfully opened.

  constructor() {
    this.initDB();
  }

  //setting up the database
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      // to open or create the database
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.warn("Failed to open IndexedDB:", request.error);
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      }

      //Database schema creation
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        //create the events store
        if (!db.objectStoreNames.contains(this.EVENTS_STORE)) {
          const eventsStore = db.createObjectStore(this.EVENTS_STORE, { keyPath: 'eventId' });
          eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        //create the user store
        if (!db.objectStoreNames.contains(this.USER_STORE)) {
          db.createObjectStore(this.USER_STORE, {
            keyPath: 'userId'
          })
        }
      }
    })
  }
  
  //Ensures database connection is open before any operation is attempted 
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }

    return this.db;
  }


  //Storing events

  async saveEvents(events: TrackingEvent[]): Promise<void> {
    try {
      const db = await this.ensureDB();
      const existingEvents = await this.getStoredEvents();
      const allEvents = [...existingEvents, ...events];

      const limitedEvents = allEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_EVENTS);
      
      //setting up a transaction in IndexedDB to modify the EVENTS_STORE
      const transaction = db.transaction([this.EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(this.EVENTS_STORE);

      await this.clearStoredEvents();


      //add new events
      const promises = limitedEvents.map(event =>
        new Promise<void>((resolve, reject) => {
          const request = store.add(event);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      );

      await Promise.all(promises);

    } catch (error) {
      console.warn('Failed to save events:', error);
    }
  }


  async getStoredEvents(): Promise<TrackingEvent[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(this.EVENTS_STORE);
      const index = store.index('timestamp');

      return new Promise((resolve, reject) => {
        const events: TrackingEvent[] = [];
        const request = index.openCursor(null, 'prev');

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            events.push(cursor.value);
            cursor.continue();
          } else {
            resolve(events);
          }
        }

        request.onerror = () => {
          console.warn('Failed to get stored events:', request.error);
          reject(request.error);
        }
      })
    } catch (error) {
      console.warn('Failed to get stored events:', error);
      return [];
    }
  };


  async clearStoredEvents(): Promise<void> {
    try {
const db = await this.ensureDB();
    const transaction = db.transaction([this.EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(this.EVENTS_STORE);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('Failed to clear events:', request.error);
          reject(request.error);
        }
      });
    } catch (error) {
      console.warn('Failed to clear events:', error);
    }
  }
  

  async saveUser(user: UserIdentity): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.USER_STORE], 'readwrite');
      const store = transaction.objectStore(this.USER_STORE);

      return new Promise((resolve, reject) => {
        const request = store.put(user);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('Failed to save user:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('Failed to save user:', error);
    }
  }



  async getStoredUser(): Promise<UserIdentity | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.USER_STORE], 'readonly');
      const store = transaction.objectStore(this.USER_STORE);

      return new Promise((resolve, reject) => {
        // Get the first (and should be only) user record
        const request = store.openCursor();
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            resolve(cursor.value);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn('Failed to get stored user:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('Failed to get stored user:', error);
      return null;
    }
  }



  async clearUser(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.USER_STORE], 'readwrite');
      const store = transaction.objectStore(this.USER_STORE);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('Failed to clear user:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('Failed to clear user:', error);
    }
  }


  async getDatabaseInfo(): Promise<{ eventCount: number; userExists: boolean }> {
    try {
      const events = await this.getStoredEvents();
      const user = await this.getStoredUser();
      
      return {
        eventCount: events.length,
        userExists: user !== null
      };
    } catch (error) {
      console.warn('Failed to get database info:', error);
      return { eventCount: 0, userExists: false };
    }
  }
}

