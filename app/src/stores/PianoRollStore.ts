import { clamp, cloneDeep, max, min } from "lodash"
import { action, computed, makeObservable, observable, reaction } from "mobx"
import { Layout, MaxNoteNumber } from "../Constants"
import { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { Point } from "../entities/geometry/Point"
import { Range } from "../entities/geometry/Range"
import { Rect } from "../entities/geometry/Rect"
import { Measure } from "../entities/measure/Measure"
import { KeySignature } from "../entities/scale/KeySignature"
import { Selection } from "../entities/selection/Selection"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import { NotePoint } from "../entities/transform/NotePoint"
import { isNotUndefined } from "../helpers/array"
import { isEventOverlapRange } from "../helpers/filterEvents"
import Quantizer from "../quantizer"
import Track, {
  TrackEvent,
  TrackId,
  UNASSIGNED_TRACK_ID,
  isNoteEvent,
} from "../track"
import RootStore from "./RootStore"
import { RulerStore } from "./RulerStore"
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
  notGhostTrackIds: Set<TrackId> = new Set()
  canvasWidth: number = 0
  canvasHeight: number = 0
  showTrackList = false
  showEventList = false
  openTransposeDialog = false
  openVelocityDialog = false
  newNoteVelocity = 100
  keySignature: KeySignature | null = null
  previewingNoteNumbers: Set<number> = new Set()

  constructor(readonly rootStore: RootStore) {
    this.rulerStore = new RulerStore(this, rootStore.songStore)
    this.tickScrollStore = new TickScrollStore(this, 0.15, 15)

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
      previewingNoteNumbers: observable,
      contentWidth: computed,
      contentHeight: computed,
      scrollLeft: computed,
      scrollTop: computed,
      transform: computed,
      windowedEvents: computed,
      allNotes: computed,
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
      controlCursor: computed,
      selectedTrack: computed,
      setScrollLeftInPixels: action,
      setScrollTopInPixels: action,
      setScrollLeftInTicks: action,
      scaleAroundPointX: action,
      scaleAroundPointY: action,
      scrollBy: action,
      toggleTool: action,
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
        this.resetSelection()
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

  toggleTool() {
    this.mouseMode = this.mouseMode === "pencil" ? "selection" : "pencil"
  }

  resetSelection() {
    this.selection = null
    this.selectedNoteIds = []
  }

  get selectedTrackIndex(): number {
    return this.rootStore.song.tracks.findIndex(
      (t) => t.id === this.selectedTrackId,
    )
  }

  set selectedTrackIndex(index: number) {
    this.selectedTrackId = this.rootStore.song.tracks[index]?.id
  }

  get selectedTrack(): Track | undefined {
    return this.rootStore.song.getTrack(this.selectedTrackId)
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

  get allNotes(): PianoNoteItem[] {
    const { transform, selectedTrack: track, selectedNoteIds } = this
    if (track === undefined) {
      return []
    }
    const noteEvents = track.events.filter(isNoteEvent)

    return noteEvents.map((e): PianoNoteItem => {
      const rect = track.isRhythmTrack
        ? transform.getDrumRect(e)
        : transform.getRect(e)
      const isSelected = selectedNoteIds.includes(e.id)
      return {
        ...rect,
        id: e.id,
        velocity: e.velocity,
        isSelected,
      }
    })
  }

  get notes(): PianoNoteItem[] {
    const { scrollLeft, canvasWidth, selectedTrack: track, allNotes } = this
    if (track === undefined) {
      return []
    }

    const range = Range.fromLength(scrollLeft, canvasWidth)
    return allNotes.filter((n) =>
      Range.intersects(Range.fromLength(n.x, n.width), range),
    )
  }

  get ghostTrackIds(): TrackId[] {
    const song = this.rootStore.song
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
    return this.selectedTrack?.getVolume(this.rootStore.player.position)
  }

  get currentPan(): number | undefined {
    return this.selectedTrack?.getPan(this.rootStore.player.position)
  }

  get currentTempo(): number | undefined {
    return this.rootStore.song.conductorTrack?.getTempo(
      this.rootStore.player.position,
    )
  }

  get currentMBTTime(): string {
    return Measure.getMBTString(
      this.rootStore.song.measures,
      this.rootStore.player.position,
      this.rootStore.song.timebase,
    )
  }

  get cursorX(): number {
    return this.transform.getX(this.rootStore.player.position)
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.rootStore, this.quantize, this.isQuantizeEnabled)
  }

  get enabledQuantizer(): Quantizer {
    return new Quantizer(this.rootStore, this.quantize, true)
  }

  get controlCursor(): string {
    return this.mouseMode === "pencil"
      ? `url("./cursor-pencil.svg") 0 20, pointer`
      : "auto"
  }

  getDraggablePosition(draggable: PianoRollDraggable): NotePoint | null {
    switch (draggable.type) {
      case "note": {
        const { selectedTrack } = this
        if (selectedTrack === undefined) {
          return null
        }
        const note = selectedTrack.getEventById(draggable.noteId)
        if (note === undefined || !isNoteEvent(note)) {
          return null
        }
        switch (draggable.position) {
          case "center":
            return note
          case "left":
            return note
          case "right":
            return {
              tick: note.tick + note.duration,
              noteNumber: note.noteNumber,
            }
        }
        break
      }
      case "selection": {
        const { selection } = this
        if (selection === null) {
          return null
        }
        switch (draggable.position) {
          case "center":
            return Selection.getFrom(selection)
          case "left":
            return Selection.getFrom(selection)
          case "right":
            return Selection.getTo(selection)
        }
        break
      }
    }
  }

  updateDraggable(draggable: PianoRollDraggable, position: Partial<NotePoint>) {
    switch (draggable.type) {
      case "note": {
        const { selectedTrack } = this
        if (selectedTrack === undefined) {
          return
        }
        const note = selectedTrack.getEventById(draggable.noteId)
        if (note === undefined || !isNoteEvent(note)) {
          return
        }
        switch (draggable.position) {
          case "center": {
            selectedTrack.updateEvent(note.id, position)
            break
          }
          case "left": {
            if (position.tick === undefined) {
              return
            }
            selectedTrack.updateEvent(note.id, {
              tick: position.tick,
              duration: note.duration + note.tick - position.tick,
            })
            break
          }
          case "right": {
            if (position.tick === undefined) {
              return
            }
            selectedTrack.updateEvent(note.id, {
              duration: position.tick - note.tick,
            })
            break
          }
        }
        break
      }
      case "selection": {
        const { selection } = this
        if (selection === null) {
          return
        }
        switch (draggable.position) {
          case "center": {
            const from = Selection.getFrom(selection)
            const defaultedPosition = { ...from, ...position }
            const delta = NotePoint.sub(defaultedPosition, from)
            this.selection = Selection.moved(
              selection,
              delta.tick,
              delta.noteNumber,
            )
            break
          }
          case "left": {
            if (position.tick === undefined) {
              return
            }
            this.selection = {
              ...selection,
              fromTick: position.tick,
            }
            break
          }
          case "right": {
            if (position.tick === undefined) {
              return
            }
            this.selection = {
              ...selection,
              toTick: position.tick,
            }
            break
          }
        }
        break
      }
    }
  }

  getDraggableArea(
    draggable: PianoRollDraggable,
    minLength: number = 0,
  ): DraggableArea | null {
    const { selectedTrack } = this
    if (selectedTrack === undefined) {
      return null
    }
    switch (draggable.type) {
      case "note": {
        const note = selectedTrack.getEventById(draggable.noteId)
        if (note === undefined || !isNoteEvent(note)) {
          return null
        }
        const notes = this.selectedNoteIds
          .map((id) => selectedTrack.getEventById(id))
          .filter(isNotUndefined)
          .filter(isNoteEvent)
        const minTick = min(notes.map((n) => n.tick)) ?? 0
        const tickLowerBound = note.tick - minTick
        switch (draggable.position) {
          case "center": {
            const maxNoteNumber = max(notes.map((n) => n.noteNumber)) ?? 0
            const minNoteNumber = min(notes.map((n) => n.noteNumber)) ?? 0
            const noteNumberLowerBound = note.noteNumber - minNoteNumber
            const noteNumberUpperBound =
              MaxNoteNumber - (maxNoteNumber - note.noteNumber)
            return {
              tickRange: Range.create(tickLowerBound, Infinity),
              noteNumberRange: Range.create(
                noteNumberLowerBound,
                noteNumberUpperBound,
              ),
            }
          }
          case "left":
            return {
              tickRange: Range.create(
                tickLowerBound,
                note.tick + note.duration - minLength,
              ),
              noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
            }
          case "right":
            return {
              tickRange: Range.create(note.tick + minLength, Infinity),
              noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
            }
        }
        break
      }
      case "selection": {
        const { selection } = this
        if (selection === null) {
          return null
        }
        const notes = this.selectedNoteIds
          .map((id) => selectedTrack.getEventById(id))
          .filter(isNotUndefined)
          .filter(isNoteEvent)
        const minTick = min(notes.map((n) => n.tick)) ?? 0
        // The length of the note that protrudes from the left end of the selection
        const tickOffset = selection.fromTick - minTick
        switch (draggable.position) {
          case "center": {
            const height = selection.fromNoteNumber - selection.toNoteNumber
            return {
              tickRange: Range.create(tickOffset, Infinity),
              noteNumberRange: Range.create(height - 1, MaxNoteNumber + 1),
            }
          }
          case "left": {
            // Limit the movement of the left end of the selection
            // - Within the screen range
            // - Make sure that the longest note is not shorter than minLength
            // - Do not move up and down
            // - Do not exceed the right edge
            // - Make sure the selection is at least minLength
            const maxDuration = max(notes.map((n) => n.duration)) ?? 0
            const selectionSmallestLeft = selection.toTick - minLength
            const noteSmallestLeft =
              selection.fromTick + (maxDuration - minLength)
            return {
              tickRange: Range.create(
                tickOffset,
                Math.min(selectionSmallestLeft, noteSmallestLeft),
              ),
              noteNumberRange: Range.point(selection.fromNoteNumber), // allow to move only vertically
            }
          }
          case "right": {
            // Limit the movement of the right end of the selection
            // - Within the screen range
            // - Make sure that the longest note is not shorter than minLength
            // - Do not move up and down
            // - Do not exceed the left edge
            // - Make sure the selection is at least minLength
            const maxDuration = max(notes.map((n) => n.duration)) ?? 0
            const selectionSmallestRight = selection.fromTick + minLength
            const noteSmallestRight =
              selection.toTick - (maxDuration - minLength)
            return {
              tickRange: Range.create(
                Math.max(selectionSmallestRight, noteSmallestRight),
                Infinity,
              ),
              noteNumberRange: Range.point(selection.fromNoteNumber), // allow to move only vertically
            }
          }
        }
      }
    }
  }
}
