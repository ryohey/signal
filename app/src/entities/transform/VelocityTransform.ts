export class VelocityTransform {
  constructor(private readonly height: number) {}

  get maxHeight(): number {
    return this.height
  }

  getHeight(velocity: number): number {
    return (velocity / 127) * this.height
  }

  getY(velocity: number): number {
    return this.height - this.getHeight(velocity)
  }

  getVelocity(y: number): number {
    return Math.max(
      1,
      Math.round(Math.max(0, Math.min(1, 1 - y / this.height)) * 127)
    )
  }
}
