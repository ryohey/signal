import { useEffect, useRef } from "react"

export function useAutoFocus<Element extends HTMLElement>(
  ref: React.RefObject<Element> = useRef<Element>(null)
) {
  useEffect(() => {
    ref.current?.focus()
  }, [ref])

  return ref
}
