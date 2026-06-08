export class KeyTransform {
  constructor(
    readonly pixelsPerKey: number,
    private readonly maxNoteNumber: number,
  ) {}

  getY(noteNumber: number) {
    return (this.maxNoteNumber - noteNumber) * this.pixelsPerKey
  }

  getNoteNumber(pixels: number) {
    return Math.ceil(this.getNoteNumberFractional(pixels))
  }

  getNoteNumberFractional(pixels: number) {
    return this.maxNoteNumber - pixels / this.pixelsPerKey
  }

  getDeltaNoteNumber(deltaPixels: number) {
    return -deltaPixels / this.pixelsPerKey
  }

  get numberOfKeys() {
    return this.maxNoteNumber + 1
  }

  getMaxY() {
    return this.numberOfKeys * this.pixelsPerKey
  }
}
