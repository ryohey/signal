import { useEffect, useRef } from "react"

export function useAutoFocus<Element extends HTMLElement>(
  _ref?: React.RefObject<Element>,
) {
  const localRef = useRef<Element>(null)
  const ref = _ref ?? localRef

  useEffect(() => {
    ref.current?.focus()
  }, [ref])

  return ref
}
