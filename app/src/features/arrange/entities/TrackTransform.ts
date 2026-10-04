export class TrackTransform {
  constructor(private readonly pixelsPerTrack: number) {}

  getY(trackIndex: number): number {
    return trackIndex * this.pixelsPerTrack
  }

  getTrackIndex(y: number): number {
    return y / this.pixelsPerTrack
  }
}
