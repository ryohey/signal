export interface MouseGesture<Params extends any[] = [], Event = MouseEvent> {
  onMouseDown(e: Event, ...params: Params): void
  onMouseMove?(e: Event): void
  onMouseUp?(e: Event): void
}
