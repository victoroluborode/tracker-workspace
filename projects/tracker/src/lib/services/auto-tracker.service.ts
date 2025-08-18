import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TrackerService } from './tracker.service';
import { EventNames } from '../enums/tracking.enums';

@Injectable({
  providedIn: 'root',
})
export class AutoTrackerService implements OnDestroy {
  private subscriptions: Subscription[] = [];
  private isEnabled = false;

  constructor(
    private router: Router,
    private location: Location,
    private tracker: TrackerService,
    private ngZone: NgZone 
  ) {}

  enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.setupNavigationTracking();
    this.setupClickTracking();
    this.setupFormTracking();
  }

  disable(): void {
    this.isEnabled = false;
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  private setupNavigationTracking(): void {
    const navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        try {
          this.tracker.track(EventNames.PAGE_VIEW, {
            url: event.url,
            urlAfterRedirects: event.urlAfterRedirects,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.warn('AutoTracker: Navigation tracking failed', err);
        }
      });

    this.subscriptions.push(navSub);
  }

  private setupClickTracking(): void {
    this.ngZone.runOutsideAngular(() => {
      const clickSub = fromEvent(document, 'click', { passive: true })
        .subscribe((event: Event) => {
          const target = event.target as HTMLElement;

          if (this.shouldTrackElement(target)) {
            try {
              this.tracker.track(EventNames.BUTTON_CLICK, {
                tag: target.tagName.toLowerCase(),
                text: target.textContent?.trim().substring(0, 100),
                classes: target.className,
                id: target.id,
                href: (target as HTMLAnchorElement).href,
                page: window.location.pathname,
                timestamp: Date.now(),
              });
            } catch (err) {
              console.warn('AutoTracker: Click tracking failed', err);
            }
          }
        });

      this.subscriptions.push(clickSub); 
    });
  }

  private shouldTrackElement(element: HTMLElement): boolean {
    
    if (element.closest('[data-track-ignore]')) {
      return false;
    }

    const trackableTags = ['button', 'a', 'input'];
    const trackableTypes = ['button', 'submit', 'reset'];

    return (
      trackableTags.includes(element.tagName.toLowerCase()) ||
      (element.tagName.toLowerCase() === 'input' &&
        trackableTypes.includes((element as HTMLInputElement).type))
    );
  }

  private setupFormTracking(): void {
    this.ngZone.runOutsideAngular(() => {
      const formSub = fromEvent(document, 'submit', { passive: true }) 
        .subscribe((event: Event) => {
          const form = event.target as HTMLFormElement;

          if (form && !form.hasAttribute('data-track-ignore')) {
            try {
              this.tracker.track('form_submit', {
                formId: form.id,
                formName: form.name,
                formAction: form.action,
                formMethod: form.method,
                page: window.location.pathname,
                timestamp: Date.now(),
              });
            } catch (err) {
              console.warn('AutoTracker: Form tracking failed', err);
            }
          }
        });

      this.subscriptions.push(formSub);
    });
  }

  ngOnDestroy(): void {
    this.disable();
  }
}
