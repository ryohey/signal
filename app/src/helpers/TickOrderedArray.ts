import { createModelSchema } from "serializr"
import { OrderedArray } from "./OrderedArray"

export class TickOrderedArray<
  T extends { id: number; tick: number },
> extends OrderedArray<T, number> {
  constructor(array: T[] = [], descending: boolean = false) {
    super(array, (item) => (item as any).tick, descending)
  }
}

createModelSchema(TickOrderedArray, {})
