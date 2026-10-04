import type { Track, TrackEvent } from "@signal-app/core"
import { ObservableValue, type Unsubscribe } from "@signal-app/observable"
import { getEventController } from "./entities/EventController"
import type { EventListItem } from "./entities/EventListItem"
import { getEventsByIdsOrAll } from "./trackQueries/queries"

// Unlike the other domain editors (tempo/control/pianoroll/arrange), this
// editor's items are heterogeneous by design - it's a generic inspector over
// whatever TrackEvent subtype is currently in view - so there's no single
// simplified DTO to compose mutations from. A plain class is enough: each
// method is a thin, single-call delegation to an existing core Track mutator
// or query, not a point-free combinator built from smaller primitives.
export class TrackEventListEditor {
  private readonly _items = new ObservableValue<readonly EventListItem[]>([])
  private _selectedIds: readonly number[] = []
  // Recreated only in updateSelectedIds, not per checked event.
  private _matchesSelection: (e: TrackEvent) => boolean = () => true
  private readonly unsubscribeEventsChanged: Unsubscribe

  constructor(private readonly track: Track) {
    this.updateItems()
    this.unsubscribeEventsChanged = this.track.subscribeEventsChanged(
      (e) => this._matchesSelection(e),
      this.updateItems,
    )
  }

  dispose = () => {
    this.unsubscribeEventsChanged()
  }

  // ids: which events to show. Empty means show every event in the track.
  updateSelectedIds = (ids: readonly number[]) => {
    this._selectedIds = ids
    const idSet = new Set(ids)
    this._matchesSelection =
      ids.length > 0 ? (e) => idSet.has(e.id) : () => true
    this.updateItems()
  }

  private updateItems = () => {
    const events = getEventsByIdsOrAll(this._selectedIds)(this.track)
    this._items.set(
      events.map((e) => ({
        id: e.id,
        tick: e.tick,
        controller: getEventController(e),
      })),
    )
  }

  get items(): readonly EventListItem[] {
    return this._items.value
  }

  get onItemsChanged() {
    return this._items.onChanged
  }

  removeEvent = (id: number): void => {
    this.track.removeEvents([id])
  }

  updateEvent = (id: number, patch: Record<string, unknown>): void => {
    this.track.updateEvent(id, patch)
  }
}
