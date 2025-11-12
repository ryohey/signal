import { Player } from "@signal-app/player"
import { cloneDeep } from "lodash"
import { computed, makeObservable, observable } from "mobx"
import { MaxNoteNumber } from "../Constants"
import { Range } from "../entities/geometry/Range"
import { Rect } from "../entities/geometry/Rect"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { ArrangeCoordTransform } from "../entities/transform/ArrangeCoordTransform"
import { KeyTransform } from "../entities/transform/KeyTransform"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import { isEventOverlapRange } from "../helpers/filterEvents"
import { isNoteEvent, TrackId } from "../track"
import QuantizerStore from "./QuantizerStore"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"
import { TrackScrollStore } from "./TrackScrollStore"

const NOTE_RECT_HEIGHT = 1

export type SerializedArrangeViewStore = Pick<
  ArrangeViewStore,
  "selection" | "selectedEventIds"
>

export default class ArrangeViewStore {
  readonly rulerStore: RulerStore
  readonly tickScrollStore: TickScrollStore
  readonly trackScrollStore: TrackScrollStore
  readonly quantizerStore: QuantizerStore

  selection: ArrangeSelection | null = null
  selectedEventIds: { [key: number]: number[] } = {} // { trackIndex: [eventId] }
  selectedTrackIndex = 0
  openTransposeDialog = false
  openVelocityDialog = false

  constructor(
    private readonly songStore: SongStore,
    player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(this.songStore, player, 0.15, 15)
    this.trackScrollStore = new TrackScrollStore(this.songStore)
    this.rulerStore = new RulerStore(this.tickScrollStore, this.songStore)
    this.quantizerStore = new QuantizerStore(this.songStore, 1)

    makeObservable(this, {
      selection: observable.shallow,
      selectedEventIds: observable,
      selectedTrackIndex: observable,
      openTransposeDialog: observable,
      openVelocityDialog: observable,
      transform: computed,
      trackTransform: computed,
      notes: computed,
      selectedTrackId: computed,
    })
  }

  serialize = (): SerializedArrangeViewStore => {
    return {
      selection: cloneDeep(this.selection),
      selectedEventIds: cloneDeep(this.selectedEventIds),
    }
  }

  restore = (state: SerializedArrangeViewStore) => {
    this.selection = state.selection
    this.selectedEventIds = state.selectedEventIds
  }

  get transform(): NoteCoordTransform {
    const bottomBorderWidth = 1
    const keyTransform = new KeyTransform(
      (this.trackScrollStore.trackHeight - bottomBorderWidth) / MaxNoteNumber,
      MaxNoteNumber,
    )
    return new NoteCoordTransform(this.tickScrollStore.transform, keyTransform)
  }

  get trackTransform(): ArrangeCoordTransform {
    const { transform } = this.tickScrollStore
    const { transform: trackTransform } = this.trackScrollStore
    return new ArrangeCoordTransform(transform, trackTransform)
  }

  get notes(): Rect[] {
    const { transform, trackTransform } = this
    const { canvasWidth, scrollLeft } = this.tickScrollStore

    return this.songStore.song.tracks
      .map((t, i) =>
        t.events
          .filter(
            isEventOverlapRange(
              Range.fromLength(
                transform.getTick(scrollLeft),
                transform.getTick(canvasWidth),
              ),
            ),
          )
          .filter(isNoteEvent)
          .map((e) => {
            const rect = transform.getRect(e)
            return {
              ...rect,
              height: NOTE_RECT_HEIGHT,
              y: trackTransform.getY(i) + rect.y,
            }
          }),
      )
      .flat()
  }

  get selectedTrackId(): TrackId | undefined {
    return this.songStore.song.tracks[this.selectedTrackIndex]?.id
  }
}
