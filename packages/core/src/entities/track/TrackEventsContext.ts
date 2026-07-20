export declare const trackEventsBrand: unique symbol

export interface TrackEventsContext {
  readonly [trackEventsBrand]: true
}

declare module "../../data/OrdererdArray/TickOrderedArray" {
  interface TickOrderedArray<T extends { id: number; tick: number }> {
    readonly [trackEventsBrand]: true
  }
}
