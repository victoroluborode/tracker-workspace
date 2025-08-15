import { Injector } from '@angular/core';
import { TrackerService } from './services/tracker.service';

class GlobalTracker {
  private trackerService?: TrackerService;
  private isReady = false;

  _initAngularService(injector: Injector) {
    try {
      this.trackerService = injector.get(TrackerService);
      this.isReady = true;
    } catch (error) {
      console.error('Failed to init global tracker', error);
    }
  }

  init(config: any) {
    this._ensureReady();
    this.trackerService!.initialize(config);
  }

  identify(user: any) {
    this._ensureReady();
    this.trackerService!.identify(user);
  }

  track(event: string, props?: any) {
    this._ensureReady();
    this.trackerService!.track(event, props);
  }

  reset() {
    this._ensureReady();
    this.trackerService!.reset();
  }

  getUser() {
    this._ensureReady();
    return this.trackerService!.getCurrentUser();
  }

  isInitialized() {
    return this.isReady && this.trackerService!.isReady();
  }

  private _ensureReady() {
    if (!this.isReady) throw new Error('Global tracker not yet initialized with Angular Injector');
  }
}

export const tracker = new GlobalTracker();