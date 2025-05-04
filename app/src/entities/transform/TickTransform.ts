export class TickTransform implements TickTransform {
  constructor(private readonly pixelsPerTick: number) {}

  getX(tick: number) {
    return tick * this.pixelsPerTick
  }

  getTick(x: number) {
    return x / this.pixelsPerTick
  }

  // Unique integer representing the horizontal transformation
  get id(): number {
    return this.pixelsPerTick
  }
}
