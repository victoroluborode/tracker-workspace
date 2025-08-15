import { NgModule, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';


import { TrackerService } from './services/tracker.service';
import { AutoTrackerService } from './services/auto-tracker.service';
import { tracker } from './tracker.global';
import { TrackClickDirective } from './directives/track-click.directive';
import { TrackNavigationDirective } from './directives/track-navigation.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    TrackClickDirective,
    TrackNavigationDirective
  ],
    providers: [
    provideHttpClient(),
    TrackerService,
    AutoTrackerService
  ],
  exports: [
    TrackClickDirective,
    TrackNavigationDirective
  ]
})
export class TrackerModule {
  constructor(injector: Injector) {
    (window as any).ngInjector = injector;
    tracker._initAngularService(injector);
  }
 }