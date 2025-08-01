import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { TrackingEvent, EventBatch, UserIdentity } from '../interfaces';

@Injectable({
  providedIn: 'root'
})

export class TrackerApiService {
  constructor(private http: HttpClient) { }

  sendEventBatch(batch: EventBatch, apiEndpoint: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${apiEndpoint}/events/batch`, batch, { headers })
      .pipe(
        retry(3),
        catchError(error => {
          console.error('Tracker ApiService: Failed to send event batch:', error);
          return of({success: false, error})
        })
    )
  }

  sendEvent(event: TrackingEvent, apiEndpoint: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-type': 'application/json'
    });

    return this.http.post(`${apiEndpoint}/events`, event, { headers })
      .pipe(
        retry(1),
        catchError(error => {
          console.error('Tracker ApiService: Failed to send single event:', error);
          return of({ success: false, error });
        })
    )
  }

  sendUserIdentification(user: UserIdentity, apiEndpoint: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${apiEndpoint}/identify`, user, { headers })
      .pipe(
        retry(1),
        catchError(error => {
          console.error('Tracker ApiService: Failed to send user identification:', error);
          return of({ success: false, error });
        })
    )
  }
  }

