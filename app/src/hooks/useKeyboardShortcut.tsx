import { useCallback } from "react"
import { isFocusable } from "../helpers/isFocusable"

export interface Action {
  code: KeyboardEvent["code"]
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  enabled?: () => boolean
  run: (e: KeyboardEvent) => void
}

export interface KeyboardShortcutProps {
  actions: Action[]
  onCut?: (e: ClipboardEvent) => void
  onCopy?: (e: ClipboardEvent) => void
  onPaste?: (e: ClipboardEvent) => void
}

export function useKeyboardShortcut({
  actions,
  onCopy: _onCopy,
  onCut: _onCut,
  onPaste: _onPaste,
}: KeyboardShortcutProps) {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target !== null && isFocusable(e.target)) {
        return
      }
      const action = actions.find(
        (action) =>
          (action.enabled?.() ?? true) &&
          e.code === action.code &&
          e.altKey === (action.altKey ?? false) &&
          e.shiftKey === (action.shiftKey ?? false) &&
          (e.ctrlKey || e.metaKey) === (action.metaKey ?? false),
      )
      if (action !== undefined) {
        action.run(e.nativeEvent)
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [actions],
  )

  const onCopy = useCallback(
    (e: React.ClipboardEvent) => _onCopy?.(e.nativeEvent),
    [_onCopy],
  )

  const onCut = useCallback(
    (e: React.ClipboardEvent) => _onCut?.(e.nativeEvent),
    [_onCut],
  )

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => _onPaste?.(e.nativeEvent),
    [_onPaste],
  )

  return {
    onKeyDown,
    onCopy,
    onCut,
    onPaste,
  }
}
