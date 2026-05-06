import { autorun, toJS } from "mobx"
import { Observable } from "./observable"

export function mobxToObservable<Key extends string>(
  mobxObject: { [K in Key]: unknown },
  key: Key,
): Observable
export function mobxToObservable<MobxObject extends object, Key extends string>(
  mobxObject: MobxObject,
  key: Key,
): Observable
export function mobxToObservable(mobxObject: object, key: string): Observable {
  return {
    subscribe: (listener: () => void) => {
      const disposer = autorun(() => {
        ;(mobxObject as Record<string, unknown>)[key]
        listener()
      })
      return disposer
    },
  }
}

export function mobxToObservableDeep<Key extends string>(
  mobxObject: { [K in Key]: unknown },
  key: Key,
): Observable
export function mobxToObservableDeep<
  MobxObject extends object,
  Key extends string,
>(mobxObject: MobxObject, key: Key): Observable
export function mobxToObservableDeep(
  mobxObject: object,
  key: string,
): Observable {
  return {
    subscribe: (listener: () => void) => {
      const disposer = autorun(() => {
        toJS((mobxObject as Record<string, unknown>)[key])
        listener()
      })
      return disposer
    },
  }
}
