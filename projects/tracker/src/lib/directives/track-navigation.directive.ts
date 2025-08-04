import { Directive, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { filter } from "rxjs/operators";
import { NavigationEnd, Router } from "@angular/router";
import { TrackerService } from "../services";


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

    // Lifecycle hooks when the directive starts
    ngOnInit(): void {
        this.previousUrl = this.router.url;  // this.router.url gives the current url in the browser when the directive is first loaded
        this.navigationSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.trackNavigation(event);
            });
    }

    private trackNavigation(event: NavigationEnd): void {
        //write this after writing the trackerservice
    }

    ngOnDestroy(): void {
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
    }
 }