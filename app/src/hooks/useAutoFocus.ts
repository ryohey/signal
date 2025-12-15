import { useEffect, useRef } from "react"

export function useAutoFocus<Element extends HTMLElement>(
  _ref?: React.RefObject<Element>,
) {
  const ref = _ref ?? useRef<Element>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [ref])

  return ref
}
