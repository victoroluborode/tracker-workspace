import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TrackerService } from './tracker.service';
import { EventNames } from '../enums/tracking.enums';

@Injectable({
    providedIn: "root"
})

export class AutoTrackerService implements OnDestroy{
    private subscriptions: Subscription[] = [];
    private isEnabled = false;

    constructor(
        private router: Router,
        private location: Location,
        private tracker: TrackerService
    ) { }
    
    enable(): void {
        if (this.isEnabled) return;

        this.isEnabled = true;
        this.setupNavigationTracking();
        this.setupClickTracking();
        this.setupFormTracking();
    }

    disable(): void {
        this.isEnabled = false;
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions = [];
    }

    private setupNavigationTracking(): void {
        const navSub = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
            // will write this later
        })
    }


    private setupClickTracking(): void {
        const clickSub = fromEvent(document, 'click')
            .subscribe((event: Event) => {
                const target = event.target as HTMLElement;

                if (this.shouldTrackElement(target)) {
                    // will write this after i've written the trackerservice
                }
            });
    }

    private shouldTrackElement(element: HTMLElement): boolean {
        const trackableTags = ['button', 'a', 'input'];
        const trackableTypes = ['button', 'submit', 'reset'];

        return trackableTags.includes(element.tagName.toLowerCase()) || (element.tagName.toLowerCase() === 'input' && trackableTypes.includes((element as HTMLInputElement).type))
    }

    private setupFormTracking(): void {
        const formSub = fromEvent(document, 'submit')
            .subscribe((event: Event) => {
                const form = event.target as HTMLFormElement;

                //will write this after i've written the trackerservice
        })
    }

    ngOnDestroy(): void {
        this.disable();
    }
}
