import { IArrayDidChange } from "mobx"

// Get changed items from mobx array change. This works with observe() on IObservableArray
export function getChangedItems<T>(change: IArrayDidChange<T>): T[] {
  switch (change.type) {
    case "update":
      return [change.newValue]
    case "splice":
      if (change.addedCount > 0) {
        return change.added
      } else if (change.removedCount > 0) {
        return change.removed
      }
      break
  }
  return []
}
