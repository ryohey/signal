import { createModelSchema, primitive } from "serializr"
import { OrderedArray } from "./OrderedArray"

export class TickOrderedArray<
  T extends { id: number; tick: number },
> extends OrderedArray<T, number> {
  private lastEventId = 0

  constructor(array: T[] = [], descending: boolean = false) {
    super(
      array,
      (item) => item.tick,
      descending,
      () => this.lastEventId++
    )
  }
}

createModelSchema(TickOrderedArray, {
  lastEventId: primitive(),
})
