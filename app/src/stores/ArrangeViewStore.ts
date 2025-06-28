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
import Quantizer from "../quantizer"
import { isNoteEvent, TrackId } from "../track"
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

  selection: ArrangeSelection | null = null
  selectedEventIds: { [key: number]: number[] } = {} // { trackIndex: [eventId] }
  quantize = 1
  selectedTrackIndex = 0

  constructor(
    private readonly songStore: SongStore,
    player: Player,
  ) {
    this.tickScrollStore = new TickScrollStore(this.songStore, player, 0.15, 15)
    this.trackScrollStore = new TrackScrollStore(this.songStore)
    this.rulerStore = new RulerStore(this, this.tickScrollStore, this.songStore)

    makeObservable(this, {
      selection: observable.shallow,
      selectedEventIds: observable,
      quantize: observable,
      selectedTrackIndex: observable,
      transform: computed,
      trackTransform: computed,
      notes: computed,
      selectionRect: computed,
      quantizer: computed,
      selectedTrackId: computed,
    })
  }

  setUpAutorun() {
    this.tickScrollStore.setUpAutoScroll()
  }

  serialize(): SerializedArrangeViewStore {
    return {
      selection: cloneDeep(this.selection),
      selectedEventIds: cloneDeep(this.selectedEventIds),
    }
  }

  restore(state: SerializedArrangeViewStore) {
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

  get selectionRect(): Rect | null {
    const { selection, trackTransform } = this
    const { transform } = this.tickScrollStore
    if (selection === null) {
      return null
    }
    const x = transform.getX(selection.fromTick)
    const right = transform.getX(selection.toTick)
    const y = trackTransform.getY(selection.fromTrackIndex)
    const bottom = trackTransform.getY(selection.toTrackIndex)
    return {
      x,
      width: right - x,
      y,
      height: bottom - y,
    }
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, true)
  }

  get selectedTrackId(): TrackId | undefined {
    return this.songStore.song.tracks[this.selectedTrackIndex]?.id
  }
}
