import {
  type DeserializedOrderedItem,
  OrderedArray,
  type SerializedOrderedArray,
} from "./OrderedArray"

export type DeserializedTickOrderedItem = DeserializedOrderedItem & {
  tick: number
}

export type SerializedTickOrderedArray<T> = SerializedOrderedArray<T> & {
  lastEventId?: number
}

export class TickOrderedArray<
  T extends { id: number; tick: number },
> extends OrderedArray<T, number> {
  private lastEventId = 0

  constructor(array: T[] = [], descending: boolean = false) {
    super(
      array,
      (item) => item.tick,
      descending,
      () => this.lastEventId++,
    )
  }

  override serialize() {
    return {
      ...super.serialize(),
      lastEventId: this.lastEventId,
    }
  }

  restoreLastEventId(lastEventId: number): void {
    this.lastEventId = lastEventId
  }
}

export function deserializeTickOrderedArray(
  json: unknown,
): TickOrderedArray<DeserializedTickOrderedItem> {
  const serialized =
    json as SerializedTickOrderedArray<DeserializedTickOrderedItem>
  const source = [...(serialized.lookupMap ?? serialized.array ?? [])]
  const array = new TickOrderedArray<DeserializedTickOrderedItem>(
    source,
    serialized.descending ?? false,
  )
  array.restoreLastEventId(serialized.lastEventId ?? 0)
  return array
}
