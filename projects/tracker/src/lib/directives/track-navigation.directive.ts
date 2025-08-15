import { Directive, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { filter } from "rxjs/operators";
import { NavigationEnd, Router } from "@angular/router";
import { TrackerService } from "../services";
import { EventNames } from "../enums";


@Directive({
    selector: '[trackNavigation]'
})

export class TrackNavigationDirective implements OnInit, OnDestroy {
    private navigationSubscription?: Subscription;  //stores the subscription so we can later unsubscribe in ngOnDestroy
    private previousUrl: string = '';

    constructor(
        private router: Router,
        private tracker: TrackerService
    ) { }

    ngOnInit(): void {
        this.previousUrl = this.router.url;  // this.router.url gives the current url in the browser when the directive is first loaded
        this.navigationSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.trackNavigation(event);
            });
    }
    private trackNavigation(event: NavigationEnd): void {
        this.tracker.track(EventNames.PAGE_VIEW, {
            currenturl: event.url,
            previous: this.previousUrl,
            urlAfterRedirects: event.urlAfterRedirects,
            navigationId: (event as any).id,
            timestamp: Date.now(),
            referrer: typeof document !== 'undefined' ? document.referrer : ''
        });

        this.previousUrl = event.url;
    }

    ngOnDestroy(): void {
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
    }
 }