import {
  emptySong,
  emptyTrack,
  isNoteEvent,
  NoteEvent,
  programChangeMidiEvent,
  Song,
  songFromMidi,
  songToMidi,
  TrackEventOf,
  TrackId,
} from "@signal-app/core"
import { TimeSignatureEvent } from "midifile-ts"
import { runInAction } from "mobx"

type Snapshot = {
  midi: Uint8Array
  name: string
}

export type NoteInput = {
  tick: number
  duration: number
  noteNumber: number
  velocity?: number
}

export type NoteUpdate = Partial<NoteInput> & { id: number }

const integer = (value: number, name: string) => {
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`)
  return value
}

const range = (value: number, name: string, min: number, max: number) => {
  integer(value, name)
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`)
  }
  return value
}

const positive = (value: number, name: string) => {
  integer(value, name)
  if (value < 1) throw new Error(`${name} must be positive`)
  return value
}

export class HeadlessSignal {
  private song: Song = emptySong()
  private undoStack: Snapshot[] = []
  private redoStack: Snapshot[] = []

  get midiBytes() {
    return new Uint8Array(songToMidi(this.song))
  }

  getState() {
    return {
      project: {
        name: this.song.name,
        timebase: this.song.timebase,
        endTick: this.song.endOfSong,
        tempo: this.song.conductorTrack?.getTempo(0) ?? 120,
        timeSignatures: this.song.timeSignatures.map((event) => ({
          tick: event.tick,
          numerator: event.numerator,
          denominator: event.denominator,
        })),
      },
      tracks: this.song.tracks.map((track, index) => ({
        id: track.id,
        index,
        name: track.name ?? "",
        channel: track.channel,
        isConductor: track.isConductorTrack,
        isRhythm: track.isRhythmTrack,
        volume: track.getVolume(0),
        pan: track.getPan(0),
        program: track.getProgramNumber(0),
        notes: track.events.filter(isNoteEvent).map((note) => ({
          id: note.id,
          tick: note.tick,
          duration: note.duration,
          noteNumber: note.noteNumber,
          velocity: note.velocity,
        })),
      })),
      history: {
        canUndo: this.undoStack.length > 0,
        canRedo: this.redoStack.length > 0,
      },
    }
  }

  newProject(name?: string) {
    this.song = emptySong()
    if (name !== undefined) runInAction(() => (this.song.name = name))
    this.undoStack = []
    this.redoStack = []
    return this.getState()
  }

  importMidi(bytes: Uint8Array, name?: string) {
    this.song = runInAction(() => songFromMidi(bytes))
    if (name !== undefined) runInAction(() => (this.song.name = name))
    this.undoStack = []
    this.redoStack = []
    return this.getState()
  }

  setProject(values: { name?: string; timebase?: number }) {
    this.pushHistory()
    runInAction(() => {
      if (values.name !== undefined) this.song.name = values.name
      if (values.timebase !== undefined) {
        this.song.timebase = positive(values.timebase, "timebase")
      }
    })
    return this.getState()
  }

  addTrack(values: { name?: string; channel?: number }) {
    this.pushHistory()
    const channel =
      values.channel ??
      Math.min(
        this.song.tracks.filter((track) => !track.isConductorTrack).length,
        15,
      )
    range(channel, "channel", 0, 15)
    const track = emptyTrack(channel)
    if (values.name !== undefined) track.setName(values.name)
    this.song.addTrack(track)
    return { trackId: track.id, state: this.getState() }
  }

  updateTrack(
    trackId: number,
    values: {
      name?: string
      channel?: number
      program?: number
      volume?: number
      pan?: number
    },
  ) {
    const track = this.editableTrack(trackId)
    this.pushHistory()
    if (values.name !== undefined) track.setName(values.name)
    const channel = values.channel
    if (channel !== undefined) {
      runInAction(() => (track.channel = range(channel, "channel", 0, 15)))
    }
    if (values.program !== undefined) {
      const program = range(values.program, "program", 0, 127)
      track.createOrUpdate({
        ...programChangeMidiEvent(0, track.channel ?? 0, program),
        tick: 0,
      })
    }
    if (values.volume !== undefined) {
      track.setVolume(range(values.volume, "volume", 0, 127), 0)
    }
    if (values.pan !== undefined) {
      track.setPan(range(values.pan, "pan", 0, 127), 0)
    }
    return this.getState()
  }

  duplicateTrack(trackId: number) {
    const source = this.editableTrack(trackId)
    this.pushHistory()
    const copy = source.clone()
    const index = this.song.tracks.findIndex((track) => track.id === source.id)
    this.song.insertTrack(copy, index + 1)
    return { trackId: copy.id, state: this.getState() }
  }

  deleteTrack(trackId: number) {
    this.editableTrack(trackId)
    if (
      this.song.tracks.filter((track) => !track.isConductorTrack).length <= 1
    ) {
      throw new Error("The final editable track cannot be deleted")
    }
    this.pushHistory()
    this.song.removeTrack(trackId as TrackId)
    return this.getState()
  }

  addNotes(trackId: number, inputs: NoteInput[]) {
    const track = this.editableTrack(trackId)
    const notes = inputs.map((input, index) =>
      this.validNote(input, `notes[${index}]`),
    )
    this.pushHistory()
    const created = track.addEvents<NoteEvent>(notes)
    return { noteIds: created.map((note) => note.id), state: this.getState() }
  }

  updateNotes(trackId: number, updates: NoteUpdate[]) {
    const track = this.editableTrack(trackId)
    const validated = updates.map((update, index) => {
      const current = track.getEventById(
        integer(update.id, `notes[${index}].id`),
      )
      if (!current || !isNoteEvent(current)) {
        throw new Error(`Note ${update.id} was not found on track ${trackId}`)
      }
      const merged = this.validNote(
        { ...current, ...update },
        `notes[${index}]`,
      )
      return { id: update.id, ...merged }
    })
    this.pushHistory()
    track.updateEvents<NoteEvent>(validated)
    track.updateEndOfTrack()
    return this.getState()
  }

  deleteNotes(trackId: number, noteIds: number[]) {
    const track = this.notesFor(trackId, noteIds).track
    this.pushHistory()
    track.removeEvents(noteIds)
    track.updateEndOfTrack()
    return this.getState()
  }

  duplicateNotes(trackId: number, noteIds: number[], deltaTick = 0) {
    const { track, notes } = this.notesFor(trackId, noteIds)
    integer(deltaTick, "deltaTick")
    const copies = notes.map((note) =>
      this.validNote(
        { ...note, tick: note.tick + deltaTick },
        "duplicated note",
      ),
    )
    this.pushHistory()
    const created = track.addEvents<NoteEvent>(copies)
    return { noteIds: created.map((note) => note.id), state: this.getState() }
  }

  transposeNotes(trackId: number, noteIds: number[], semitones: number) {
    const { track, notes } = this.notesFor(trackId, noteIds)
    integer(semitones, "semitones")
    const updates = notes.map((note) => ({
      id: note.id,
      noteNumber: range(
        note.noteNumber + semitones,
        "transposed noteNumber",
        0,
        127,
      ),
    }))
    this.pushHistory()
    track.updateEvents<NoteEvent>(updates)
    return this.getState()
  }

  quantizeNotes(trackId: number, noteIds: number[], gridTicks: number) {
    const { track, notes } = this.notesFor(trackId, noteIds)
    positive(gridTicks, "gridTicks")
    this.pushHistory()
    track.updateEvents<NoteEvent>(
      notes.map((note) => ({
        id: note.id,
        tick: Math.max(0, Math.round(note.tick / gridTicks) * gridTicks),
      })),
    )
    track.updateEndOfTrack()
    return this.getState()
  }

  setTempo(bpm: number, tick = 0) {
    if (!Number.isFinite(bpm) || bpm <= 0 || bpm > 999) {
      throw new Error("bpm must be between 0 and 999")
    }
    integer(tick, "tick")
    if (tick < 0) throw new Error("tick must be non-negative")
    this.pushHistory()
    this.song.conductorTrack?.setTempo(bpm, tick)
    return this.getState()
  }

  setTimeSignature(numerator: number, denominator: number, tick = 0) {
    positive(numerator, "numerator")
    positive(denominator, "denominator")
    integer(tick, "tick")
    if (tick < 0) throw new Error("tick must be non-negative")
    this.pushHistory()
    this.song.conductorTrack?.createOrUpdate<TrackEventOf<TimeSignatureEvent>>({
      type: "meta",
      subtype: "timeSignature",
      tick,
      numerator,
      denominator,
      metronome: 24,
      thirtyseconds: 8,
    })
    return this.getState()
  }

  undo() {
    const snapshot = this.undoStack.pop()
    if (!snapshot) throw new Error("Nothing to undo")
    this.redoStack.push(this.snapshot())
    this.restore(snapshot)
    return this.getState()
  }

  redo() {
    const snapshot = this.redoStack.pop()
    if (!snapshot) throw new Error("Nothing to redo")
    this.undoStack.push(this.snapshot())
    this.restore(snapshot)
    return this.getState()
  }

  private editableTrack(trackId: number) {
    const track = this.song.getTrack(integer(trackId, "trackId") as TrackId)
    if (!track || track.isConductorTrack) {
      throw new Error(`Editable track ${trackId} was not found`)
    }
    return track
  }

  private notesFor(trackId: number, noteIds: number[]) {
    const track = this.editableTrack(trackId)
    const notes = noteIds.map((id) => {
      const event = track.getEventById(integer(id, "noteId"))
      if (!event || !isNoteEvent(event)) {
        throw new Error(`Note ${id} was not found on track ${trackId}`)
      }
      return event
    })
    return { track, notes }
  }

  private validNote(input: NoteInput, prefix: string): Omit<NoteEvent, "id"> {
    return {
      type: "channel",
      subtype: "note",
      tick: range(input.tick, `${prefix}.tick`, 0, Number.MAX_SAFE_INTEGER),
      duration: positive(input.duration, `${prefix}.duration`),
      noteNumber: range(input.noteNumber, `${prefix}.noteNumber`, 0, 127),
      velocity: range(input.velocity ?? 100, `${prefix}.velocity`, 1, 127),
    }
  }

  private snapshot(): Snapshot {
    return { midi: this.midiBytes, name: this.song.name }
  }

  private pushHistory() {
    this.undoStack.push(this.snapshot())
    this.redoStack = []
  }

  private restore(snapshot: Snapshot) {
    this.song = runInAction(() => songFromMidi(snapshot.midi))
    runInAction(() => (this.song.name = snapshot.name))
  }
}
