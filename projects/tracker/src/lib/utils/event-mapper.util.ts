import { ValidationUtil } from './validation.util';

export class EventMapper {
  /** Creates a tracking event object */
  static createEvent(name: string, properties?: Record<string, unknown>): any {
    if (!ValidationUtil.isValidString(name)) {
      throw new Error('Invalid event name');
    }

    return {
      name: ValidationUtil.sanitizeString(name),
      properties: {
        ...properties,
        clientTimestamp: Date.now() // Add client timestamp
      },
      timestamp: Date.now()
    };
  }

  /** Validates an event object */
  static validateEvent(event: any): boolean {
    return event &&
      ValidationUtil.isValidString(event.name) &&
      typeof event.properties === 'object' &&
      typeof event.timestamp === 'number';
  }
}