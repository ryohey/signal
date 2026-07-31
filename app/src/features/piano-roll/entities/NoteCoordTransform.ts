import { NoteEvent } from "@signal-app/core"
import { Point } from "@signal-app/geometry"
import { TickTransform } from "../../../entities/transform/TickTransform"
import { KeyTransform } from "../entities/KeyTransform"
import { NotePoint } from "../entities/NotePoint"

export class NoteCoordTransform {
  constructor(
    private readonly tickTransform: TickTransform,
    private readonly keyTransform: KeyTransform,
  ) {}

  // pixels

  getX(tick: number) {
    return this.tickTransform.getX(tick)
  }

  getY(noteNumber: number) {
    return this.keyTransform.getY(noteNumber)
  }

  // ticks

  getTick(pixels: number) {
    return this.tickTransform.getTick(pixels)
  }

  getNoteNumber(pixels: number) {
    return this.keyTransform.getNoteNumber(pixels)
  }

  getNoteNumberFractional(pixels: number) {
    return this.keyTransform.getNoteNumberFractional(pixels)
  }

  getDeltaNoteNumber(deltaPixels: number) {
    return this.keyTransform.getDeltaNoteNumber(deltaPixels)
  }

  get numberOfKeys() {
    return this.keyTransform.numberOfKeys
  }

  get pixelsPerKey() {
    return this.keyTransform.pixelsPerKey
  }

  //

  getMaxY() {
    return this.keyTransform.getMaxY()
  }

  getRect(note: NoteEvent) {
    return {
      x: this.getX(note.tick),
      y: this.getY(note.noteNumber),
      width: this.getX(note.duration),
      height: this.keyTransform.pixelsPerKey,
    }
  }

  getDrumRect(note: NoteEvent) {
    return {
      x: this.getX(note.tick) - this.keyTransform.pixelsPerKey / 2,
      y: this.getY(note.noteNumber),
      width: this.keyTransform.pixelsPerKey,
      height: this.keyTransform.pixelsPerKey,
    }
  }

  getNotePoint(pos: Point): NotePoint {
    return {
      tick: this.getTick(pos.x),
      noteNumber: this.getNoteNumber(pos.y),
    }
  }

  getNotePointFractional(pos: Point): NotePoint {
    return {
      tick: this.getTick(pos.x),
      noteNumber: this.getNoteNumberFractional(pos.y),
    }
  }
}
