import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { TrackingEvent, EventBatch, UserIdentity } from '../interfaces';
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

@Injectable({
  providedIn: 'root'
})

export class TrackerApiService {
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  }
  constructor(private http: HttpClient) { }

  sendEventBatch(batch: EventBatch, apiEndpoint: string, config?: Partial<RetryConfig>): Observable<any> {
  const retryConfig = { ...this.defaultRetryConfig, ...config };
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.post(`${apiEndpoint}/events/batch`, batch, { headers }).pipe(
    retry({
      count: retryConfig.maxRetries ?? 3,
      delay: (error, retryCount) => {
        if (!this.shouldRetry(error)) {
          throw error; 
        }
        
        const backoffTime = Math.min(
          retryConfig.baseDelay * Math.pow(2, retryCount - 1),
          retryConfig.maxDelay
        );
        return timer(backoffTime);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('TrackerAPI: Failed to send event batch after retries:', {
        error: error.message,
        status: error.status,
        batchId: batch.batchId,
        eventCount: batch.events.length
      });

      return of({
        success: false,
        error: error.message,
        shouldRetry: this.shouldRetry(error),
        batchId: batch.batchId
      });
    })
  );
}



sendEvent(event: TrackingEvent, apiEndpoint: string, config?: Partial<RetryConfig>): Observable<any> {
  const retryConfig = { ...this.defaultRetryConfig, ...config };
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.post(`${apiEndpoint}/events`, event, { headers }).pipe(
    retry({
      count: retryConfig.maxRetries ?? 1, 
      delay: (error, retryCount) => {
        if (!this.shouldRetry(error)) {
          throw error;
        }

        const backoffTime = Math.min(
          retryConfig.baseDelay * Math.pow(2, retryCount - 1),
          retryConfig.maxDelay
        );
        return timer(backoffTime);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('TrackerAPI: Failed to send single event after retries:', {
        error: error.message,
        status: error.status,
        eventId: event.eventId
      });

      return of({
        success: false,
        error: error.message,
        shouldRetry: this.shouldRetry(error),
        eventId: event.eventId
      });
    })
  );
}


  sendUserIdentification(user: UserIdentity, apiEndpoint: string): Observable<any> {
  const retryConfig = { ...this.defaultRetryConfig, maxRetries: 2 };
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.post(`${apiEndpoint}/identify`, user, { headers }).pipe(
    retry({
      count: retryConfig.maxRetries,
      delay: (error, retryCount) => {
        if (!this.shouldRetry(error)) {
          throw error; 
        }

        return timer(retryConfig.baseDelay);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('TrackerAPI: Failed to send user identification:', {
        error: error.message,
        status: error.status,
        userId: user.userId
      });

      return of({ 
        success: false, 
        error: error.message,
        userId: user.userId
      });
    })
  );
}


  private shouldRetry(error: HttpErrorResponse): boolean {
  
    if (error.status >= 400 && error.status < 500) {
      return error.status === 429 || error.status === 408;
    }
    
    if (error.status >= 500 || error.status === 0) {
      return true;
    }
    
    return false;
  }
}

