export interface ArrangePoint {
  readonly tick: number
  readonly trackIndex: number
}

export namespace ArrangePoint {
  export function sub(v1: ArrangePoint, v2: ArrangePoint) {
    return {
      tick: v1.tick - v2.tick,
      trackIndex: v1.trackIndex - v2.trackIndex,
    }
  }

  export function clamp(point: ArrangePoint, maxTrackIndex: number) {
    return {
      tick: Math.max(0, point.tick),
      trackIndex: Math.max(0, Math.min(maxTrackIndex, point.trackIndex)),
    }
  }
}