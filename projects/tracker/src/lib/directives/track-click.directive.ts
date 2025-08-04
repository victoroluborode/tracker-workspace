import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { TrackerService } from '../services/tracker.service';
import { EventNames } from '../enums/tracking.enums';


// Tells Angular that this is a directive
@Directive({
    selector: '[trackClick]'
})

export class TrackClickDirective {
    @Input() trackClick: string = ''; // Let's you pass a custom event name into the directive
    @Input() trackProperties: Record<string, any> = {}; //This lets you attach additional data to the tracking event
    @Input() trackEventName: EventNames = EventNames.BUTTON_CLICK; //A fallback to use one of the enum values if trackClick is not provided

    constructor(
        private tracker: TrackerService,
        private el: ElementRef
    ) { }
    
    // Listening for Clicks: 

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent): void {
        const element = this.el.nativeElement; // retrieves the raw html element

        const elementInfo = {
            tag: element.tagName.toLowerCase(),
            text: element.textContent?.trim().substring(0, 100) || '',
            classes: element.className || '',
            id: element.id || '',
            href: element.href || '',
            ...this.trackProperties
        };


        const eventName = this.trackClick || this.trackEventName

        // Tracking the Click, I'll do this after i've written the tracker service
    }

    
}