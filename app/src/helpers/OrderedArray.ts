import { makeObservable, observable } from "mobx"

/**
 * A class that efficiently maintains array order using a key extractor
 */
export class OrderedArray<
  T extends { id: number },
  K extends number | string = number,
> {
  readonly array: T[]
  private keyExtractor: (item: T) => K
  private descending: boolean
  private idToIndexMap: Map<number, number>

  constructor(
    array: T[],
    keyExtractor: (item: T) => K,
    descending: boolean = false,
  ) {
    this.array = array
    this.keyExtractor = keyExtractor
    this.descending = descending
    this.idToIndexMap = new Map()
    this.sort()
    this.updateIdToIndexMap()

    makeObservable(this, {
      array: observable.shallow,
    })
  }

  getArray(): T[] {
    return this.array
  }

  /**
   * Get an element by its id in O(1) time
   */
  get(id: number): T | undefined {
    const index = this.idToIndexMap.get(id)
    return index !== undefined ? this.array[index] : undefined
  }

  private updateIdToIndexMap(): void {
    this.idToIndexMap.clear()
    for (let i = 0; i < this.array.length; i++) {
      this.idToIndexMap.set(this.array[i].id, i)
    }
  }

  private findInsertionIndex(element: T): number {
    const elementKey = this.keyExtractor(element)
    let low = 0
    let high = this.array.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const midKey = this.keyExtractor(this.array[mid])

      let comparison: number
      if (elementKey < midKey) {
        comparison = -1
      } else if (elementKey > midKey) {
        comparison = 1
      } else {
        comparison = 0
      }

      if (this.descending) {
        comparison = -comparison
      }

      if (comparison < 0) {
        high = mid - 1
      } else if (comparison > 0) {
        low = mid + 1
      } else {
        if ("id" in element && "id" in this.array[mid]) {
          const idComparison = element.id - this.array[mid].id
          if (idComparison < 0) {
            high = mid - 1
          } else if (idComparison > 0) {
            low = mid + 1
          } else {
            return mid
          }
        } else {
          return mid
        }
      }
    }

    return low
  }

  add(element: T): T[] {
    const insertionIndex = this.findInsertionIndex(element)
    this.array.splice(insertionIndex, 0, element)
    this.updateIdToIndexMap()
    return this.array
  }

  remove(id: number): T[] {
    const index = this.idToIndexMap.get(id)
    if (index !== undefined) {
      this.array.splice(index, 1)
      this.updateIdToIndexMap()
    }
    return this.array
  }

  update(id: number, updatedElement: Partial<T>): T[] {
    const index = this.idToIndexMap.get(id)
    if (index !== undefined) {
      const originalElement = this.array[index]
      this.array.splice(index, 1)

      const updatedItem = { ...originalElement, ...updatedElement } as T

      const newIndex = this.findInsertionIndex(updatedItem)
      this.array.splice(newIndex, 0, updatedItem)
      this.updateIdToIndexMap()
    }
    return this.array
  }

  private sort(): void {
    this.array.sort((a, b) => {
      const keyA = this.keyExtractor(a)
      const keyB = this.keyExtractor(b)

      let comparison: number
      if (keyA < keyB) {
        comparison = -1
      } else if (keyA > keyB) {
        comparison = 1
      } else {
        comparison = a.id - b.id
      }

      return this.descending ? -comparison : comparison
    })
  }
}
