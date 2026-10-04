export type MouseDownHandler<
  Params extends unknown[] = [],
  Event = MouseEvent,
> = (e: Event, ...params: Params) => void

export interface MouseGesture<
  Params extends unknown[] = [],
  Event = MouseEvent,
> {
  onMouseDown: MouseDownHandler<Params, Event>
  onMouseMove?(e: Event): void
  onMouseUp?(e: Event): void
}
