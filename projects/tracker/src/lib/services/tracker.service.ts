import { Injectable, OnDestroy } from '@angular/core';
import { TrackingEvent, TrackerConfig, UserIdentity, EventBatch } from '../interfaces';
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
    batchSize: 10,
    flushInterval: 60000, // 1 minute
    apiEndpoint: 'https://api.example.com/track',
    debug: false,
  }
  
  private initialized = false;
  private flushSubscription?: Subscription;
  private currentUser: UserIdentity | null = null;

  constructor(
    private
  ) {}


  

  ngOnDestroy(): void {
      
  }
}