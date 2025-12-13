import { useEffect, useMemo, useRef } from "react"

// A hook that creates a disposable resource and disposes it when the component unmounts
export function useDisposable<T extends { dispose: () => void }>(
  factory: () => T
) {
  const eventViewRef = useRef<T | null>(null)

  const eventView = useMemo(() => {
    eventViewRef.current?.dispose()
    const instance = factory()
    eventViewRef.current = instance
    return instance
  }, [factory])

  useEffect(() => {
    return () => {
      if (eventViewRef.current) {
        eventViewRef.current.dispose()
        eventViewRef.current = null
      }
    }
  }, [])

  return eventView
}
