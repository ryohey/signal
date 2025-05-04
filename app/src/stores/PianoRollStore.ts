import { Player } from "@signal-app/player"
import { clamp, cloneDeep } from "lodash"
import { action, computed, makeObservable, observable, reaction } from "mobx"
import { Layout } from "../Constants"
import { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { Point } from "../entities/geometry/Point"
import { Range } from "../entities/geometry/Range"
import { Rect } from "../entities/geometry/Rect"
import { Measure } from "../entities/measure/Measure"
import { KeySignature } from "../entities/scale/KeySignature"
import { Selection } from "../entities/selection/Selection"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import { isEventOverlapRange } from "../helpers/filterEvents"
import Quantizer from "../quantizer"
import Track, {
  NoteEvent,
  TrackEvent,
  TrackId,
  UNASSIGNED_TRACK_ID,
  isNoteEvent,
} from "../track"
import { RulerStore } from "./RulerStore"
import { SongStore } from "./SongStore"
import { TickScrollStore } from "./TickScrollStore"

export type PianoRollMouseMode = "pencil" | "selection"

export type PianoNoteItem = Rect & {
  id: number
  velocity: number
  isSelected: boolean
}

export type PianoRollDraggable =
  | {
      type: "selection"
      position: "center" | "left" | "right"
    }
  | {
      type: "note"
      position: "center" | "left" | "right"
      noteId: number
    }

export type DraggableArea = {
  tickRange?: Range
  noteNumberRange?: Range
}

export type SerializedPianoRollStore = Pick<
  PianoRollStore,
  "selection" | "selectedNoteIds" | "selectedTrackId"
>

export default class PianoRollStore {
  readonly rulerStore: RulerStore
  private readonly tickScrollStore: TickScrollStore

  scrollLeftTicks = 0
  scrollTopKeys = 70 // 中央くらいの音程にスクロールしておく
  SCALE_Y_MIN = 0.5
  SCALE_Y_MAX = 4
  notesCursor = "auto"
  mouseMode: PianoRollMouseMode = "pencil"
  scaleX = 1
  scaleY = 1
  autoScroll = true
  quantize = 8
  isQuantizeEnabled = true
  selectedTrackId: TrackId = UNASSIGNED_TRACK_ID
  selection: Selection | null = null
  selectedNoteIds: number[] = []
  lastNoteDuration: number | null = null
  openInstrumentBrowser = false
  instrumentBrowserSetting: InstrumentSetting = {
    isRhythmTrack: false,
    programNumber: 0,
  }
  notGhostTrackIds: ReadonlySet<TrackId> = new Set()
  canvasWidth: number = 0
  canvasHeight: number = 0
  showTrackList = false
  showEventList = false
  openTransposeDialog = false
  openVelocityDialog = false
  newNoteVelocity = 100
  keySignature: KeySignature | null = null
  previewingNoteNumbers: ReadonlySet<number> = new Set()

  constructor(
    private readonly songStore: SongStore,
    private readonly player: Player,
  ) {
    this.rulerStore = new RulerStore(this, this.songStore)
    this.tickScrollStore = new TickScrollStore(
      this,
      this.songStore,
      this.player,
      0.15,
      15,
    )

    makeObservable(this, {
      scrollLeftTicks: observable,
      scrollTopKeys: observable,
      notesCursor: observable,
      mouseMode: observable,
      scaleX: observable,
      scaleY: observable,
      autoScroll: observable,
      quantize: observable,
      isQuantizeEnabled: observable,
      selectedTrackId: observable,
      selection: observable.shallow,
      selectedNoteIds: observable,
      lastNoteDuration: observable,
      openInstrumentBrowser: observable,
      instrumentBrowserSetting: observable,
      notGhostTrackIds: observable,
      canvasWidth: observable,
      canvasHeight: observable,
      showTrackList: observable,
      showEventList: observable,
      openTransposeDialog: observable,
      openVelocityDialog: observable,
      newNoteVelocity: observable,
      keySignature: observable,
      previewingNoteNumbers: observable.ref,
      contentWidth: computed,
      contentHeight: computed,
      scrollLeft: computed,
      scrollTop: computed,
      transform: computed,
      windowedEvents: computed,
      allNoteBounds: computed,
      notes: computed,
      selectedTrackIndex: computed,
      ghostTrackIds: computed,
      selectionBounds: computed,
      currentVolume: computed,
      currentPan: computed,
      currentTempo: computed,
      currentMBTTime: computed,
      cursorX: computed,
      quantizer: computed,
      enabledQuantizer: computed,
      controlCursor: computed,
      selectedTrack: computed,
      setScrollLeftInPixels: action,
      setScrollTopInPixels: action,
      setScrollLeftInTicks: action,
      scaleAroundPointX: action,
      scaleAroundPointY: action,
      scrollBy: action,
    })
  }

  setUpAutorun() {
    this.tickScrollStore.setUpAutoScroll()

    // reset selection when change track or mouse mode
    reaction(
      () => ({
        selectedTrackId: this.selectedTrackId,
        mouseMode: this.mouseMode,
      }),
      () => {
        this.selection = null
        this.selectedNoteIds = []
      },
    )
  }

  serialize(): SerializedPianoRollStore {
    return {
      selection: this.selection ? { ...this.selection } : null,
      selectedNoteIds: cloneDeep(this.selectedNoteIds),
      selectedTrackId: this.selectedTrackId,
    }
  }

  restore(serialized: SerializedPianoRollStore) {
    this.selection = serialized.selection
    this.selectedNoteIds = serialized.selectedNoteIds
    this.selectedTrackId = serialized.selectedTrackId
  }

  get contentWidth(): number {
    return this.tickScrollStore.contentWidth
  }

  get contentHeight(): number {
    const { transform } = this
    return transform.getMaxY()
  }

  get scrollLeft(): number {
    return this.tickScrollStore.scrollLeft
  }

  get scrollTop(): number {
    return Math.round(this.transform.getY(this.scrollTopKeys))
  }

  setScrollLeftInPixels(x: number) {
    this.tickScrollStore.setScrollLeftInPixels(x)
  }

  setScrollTopInPixels(y: number) {
    const { transform, canvasHeight } = this
    const maxY = transform.getMaxY() - canvasHeight
    const scrollTop = clamp(y, 0, maxY)
    this.scrollTopKeys = this.transform.getNoteNumberFractional(scrollTop)
  }

  setScrollLeftInTicks(tick: number) {
    this.tickScrollStore.setScrollLeftInTicks(tick)
  }

  setScrollTopInKeys(keys: number) {
    this.setScrollTopInPixels(this.transform.getY(keys))
  }

  scrollBy(x: number, y: number) {
    this.setScrollLeftInPixels(this.scrollLeft - x)
    this.setScrollTopInPixels(this.scrollTop - y)
  }

  scaleAroundPointX(scaleXDelta: number, pixelX: number) {
    this.tickScrollStore.scaleAroundPointX(scaleXDelta, pixelX)
  }

  scaleAroundPointY(scaleYDelta: number, pixelY: number) {
    const pixelYInKeys0 = this.transform.getNoteNumberFractional(
      this.scrollTop + pixelY,
    )
    this.scaleY = clamp(
      this.scaleY * (1 + scaleYDelta),
      this.SCALE_Y_MIN,
      this.SCALE_Y_MAX,
    )

    const pixelYInKeys1 = this.transform.getNoteNumberFractional(
      this.scrollTop + pixelY,
    )
    const scrollInKeys = pixelYInKeys1 - pixelYInKeys0
    this.setScrollTopInKeys(this.scrollTopKeys - scrollInKeys)
  }

  get selectedTrackIndex(): number {
    return this.songStore.song.tracks.findIndex(
      (t) => t.id === this.selectedTrackId,
    )
  }

  set selectedTrackIndex(index: number) {
    this.selectedTrackId = this.songStore.song.tracks[index]?.id
  }

  get selectedTrack(): Track | undefined {
    return this.songStore.song.getTrack(this.selectedTrackId)
  }

  get transform(): NoteCoordTransform {
    return new NoteCoordTransform(
      Layout.pixelsPerTick * this.scaleX,
      Layout.keyHeight * this.scaleY,
      127,
    )
  }

  get windowedEvents(): TrackEvent[] {
    const { transform, scrollLeft, canvasWidth, selectedTrack: track } = this
    if (track === undefined) {
      return []
    }

    return track.events.filter(
      isEventOverlapRange(
        Range.fromLength(
          transform.getTick(scrollLeft),
          transform.getTick(canvasWidth),
        ),
      ),
    )
  }

  get allNoteBounds(): { bounds: Rect; note: NoteEvent }[] {
    const { transform, selectedTrack: track } = this
    if (track === undefined) {
      return []
    }
    const noteEvents = track.events.filter(isNoteEvent)
    const getRect = track.isRhythmTrack
      ? (e: NoteEvent) => transform.getDrumRect(e)
      : (e: NoteEvent) => transform.getRect(e)

    return noteEvents.map((e) => {
      const bounds = getRect(e)
      return {
        bounds,
        note: e,
      }
    })
  }

  get notes(): PianoNoteItem[] {
    const { scrollLeft, canvasWidth, allNoteBounds, selectedNoteIds } = this

    const range = Range.fromLength(scrollLeft, canvasWidth)
    return allNoteBounds
      .filter((n) =>
        Range.intersects(Range.fromLength(n.bounds.x, n.bounds.width), range),
      )
      .map((n) => {
        const isSelected = selectedNoteIds.includes(n.note.id)
        return {
          ...n.bounds,
          id: n.note.id,
          velocity: n.note.velocity,
          isSelected,
        }
      })
  }

  get ghostTrackIds(): TrackId[] {
    const song = this.songStore.song
    const { notGhostTrackIds, selectedTrackId } = this
    return song.tracks
      .filter(
        (track) =>
          track.id !== selectedTrackId && !notGhostTrackIds.has(track.id),
      )
      .map((track) => track.id)
  }

  // hit test notes in canvas coordinates
  getNotes(local: Point): PianoNoteItem[] {
    return this.notes.filter((n) => Rect.containsPoint(n, local))
  }

  // convert mouse position to the local coordinate on the canvas
  getLocal(e: { offsetX: number; offsetY: number }): Point {
    return {
      x: e.offsetX + this.scrollLeft,
      y: e.offsetY + this.scrollTop,
    }
  }

  get selectionBounds(): Rect | null {
    if (this.selection !== null) {
      return Selection.getBounds(this.selection, this.transform)
    }
    return null
  }

  get currentVolume(): number | undefined {
    return this.selectedTrack?.getVolume(this.player.position)
  }

  get currentPan(): number | undefined {
    return this.selectedTrack?.getPan(this.player.position)
  }

  get currentTempo(): number | undefined {
    return this.songStore.song.conductorTrack?.getTempo(this.player.position)
  }

  get currentMBTTime(): string {
    return Measure.getMBTString(
      this.songStore.song.measures,
      this.player.position,
      this.songStore.song.timebase,
    )
  }

  get cursorX(): number {
    return this.transform.getX(this.player.position)
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, this.isQuantizeEnabled)
  }

  get enabledQuantizer(): Quantizer {
    return new Quantizer(this.songStore, this.quantize, true)
  }

  get controlCursor(): string {
    return this.mouseMode === "pencil"
      ? `url("./cursor-pencil.svg") 0 20, pointer`
      : "auto"
  }
}
