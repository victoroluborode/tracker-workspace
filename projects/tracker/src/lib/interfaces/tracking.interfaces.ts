export interface UserIdentity {
  userId: string;
  email?: string;
  name?: string;
  organizationId?: string;
  customProperties?: Record<string, any>;
}

export interface TrackingEvent {
  eventId: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  organizationId?: string;
  timestamp: number;
  properties?: Record<string, any>;
  platform: string;
  page?: string;
}

export interface TrackerConfig {
  platform: string;
  userIdentificationEndpoint: string,
  eventIngestionEndpoint: string,
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
  autocapture?: boolean;
}

export interface EventBatch {
  events: TrackingEvent[];
  timestamp: number;
  batchId: string;
}