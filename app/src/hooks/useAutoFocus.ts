import { useEffect, useRef } from "react"

export function useAutoFocus<Element extends HTMLElement>(
  _ref?: React.RefObject<Element>,
) {
  const ref = _ref ?? useRef<Element>(null)

  useEffect(() => {
    console.log("useAutoFocus effect", ref.current)
    ref.current?.focus()
  }, [ref])

  return ref
}
