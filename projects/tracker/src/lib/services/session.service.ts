import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class SessionService {
  private sessionId: string;
  private userId: string | null = null;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  getUserId(): string | null {
    return this.userId;
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  renewSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}