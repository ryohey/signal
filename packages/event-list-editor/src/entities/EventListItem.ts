import { EventController } from "./EventController"

// The event-list-facing item shape. Callers never see core's raw TrackEvent
// union or its `type`/`subtype` tags directly — `controller` already carries
// the per-subtype display/edit metadata computed by getEventController.
export interface EventListItem {
  id: number
  tick: number
  controller: EventController
}
