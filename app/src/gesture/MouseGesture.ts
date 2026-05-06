export type MouseDownHandler<Params extends any[] = [], Event = MouseEvent> = (
  e: Event,
  ...params: Params
) => void

export interface MouseGesture<Params extends any[] = [], Event = MouseEvent> {
  onMouseDown: MouseDownHandler<Params, Event>
  onMouseMove?(e: Event): void
  onMouseUp?(e: Event): void
}
