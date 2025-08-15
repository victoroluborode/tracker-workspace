import { Injectable, OnDestroy } from '@angular/core';
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
    private tracker: TrackerService
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
        this.tracker.track(EventNames.PAGE_VIEW, {
          url: event.url,
          urlAfterRedirects: event.urlAfterRedirects,
          timestamp: Date.now()
        });
      });
  }

  private setupClickTracking(): void {
    const clickSub = fromEvent(document, 'click').subscribe((event: Event) => {
      const target = event.target as HTMLElement;

      if (this.shouldTrackElement(target)) {
        // will write this after i've written the trackerservice
        this.tracker.track(EventNames.BUTTON_CLICK, {
          tag: target.tagName.toLowerCase(),
          text: target.textContent?.trim().substring(0, 100),
          classes: target.className,
          id: target.id,
          href: (target as HTMLAnchorElement).href,
          page: window.location.pathname,
          timestamp: Date.now(),
        });
      }
    });
    this.subscriptions.push(clickSub);
  }

  private shouldTrackElement(element: HTMLElement): boolean {
    const trackableTags = ['button', 'a', 'input'];
    const trackableTypes = ['button', 'submit', 'reset'];

    return (
      trackableTags.includes(element.tagName.toLowerCase()) ||
      (element.tagName.toLowerCase() === 'input' &&
        trackableTypes.includes((element as HTMLInputElement).type))
    );
  }

  private setupFormTracking(): void {
    const formSub = fromEvent(document, 'submit').subscribe((event: Event) => {
      const form = event.target as HTMLFormElement;

      //will write this after i've written the trackerservice
      this.tracker.track('form_submit', {
        formId: form.id,
        formName: form.name,
        formAction: form.action,
        formMethod: form.method,
        page: window.location.pathname,
        timestamp: Date.now(),
      });
    });
    this.subscriptions.push(formSub);
  }

  ngOnDestroy(): void {
    this.disable();
  }
}
