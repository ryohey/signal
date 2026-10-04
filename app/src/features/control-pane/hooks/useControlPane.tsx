import { atom, useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { focusAtom } from "jotai-optics"
import { historyAtom } from "../../../hooks/historyAtom"
import { type ControlMode, defaultControlModes } from "../entities/ControlMode"
import type { ControlSelection } from "../entities/ControlSelection"

export function useControlPane() {
  return {
    get controlMode() {
      return useAtomValue(controlModeAtom)
    },
    get controlModes() {
      return useAtomValue(controlModesAtom)
    },
    get selection() {
      return useAtomValue(selectionAtom)
    },
    get selectedEventIds() {
      return useAtomValue(selectedEventIdsAtom)
    },
    get controlPencilMode() {
      return useAtomValue(controlPencilModeAtom)
    },
    get controlCurveType() {
      return useAtomValue(controlCurveTypeAtom)
    },
    get valueDialogEventId() {
      return useAtomValue(valueDialogEventIdAtom)
    },
    resetSelection: useSetAtom(resetSelectionAtom),
    setControlMode: useSetAtom(controlModeAtom),
    setControlModes: useSetAtom(controlModesAtom),
    setSelection: useSetAtom(selectionAtom),
    setSelectedEventIds: useSetAtom(selectedEventIdsAtom),
    setControlPencilMode: useSetAtom(controlPencilModeAtom),
    setControlCurveType: useSetAtom(controlCurveTypeAtom),
    setValueDialogEventId: useSetAtom(valueDialogEventIdAtom),
  }
}

// atoms
const controlModeAtom = atom<ControlMode>({ type: "velocity" })
const controlPencilModeAtom = atom<"pencil" | "line" | "curve">("pencil")
const controlCurveTypeAtom = atom<"linear" | "easeIn" | "easeOut">("easeIn")
const selectionAtom = historyAtom(atom<ControlSelection | null>(null))
const selectedEventIdsAtom = historyAtom(atom<number[]>([]))
// id of the event whose value is being edited in the value dialog
const valueDialogEventIdAtom = atom<number | null>(null)
const storageAtom = atomWithStorage<{ controlModes: ControlMode[] }>(
  "ControlStore",
  {
    controlModes: defaultControlModes,
  },
)
const controlModesAtom = historyAtom(
  focusAtom(storageAtom, (optic) => optic.prop("controlModes")),
)

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
  set(selectedEventIdsAtom, [])
})
