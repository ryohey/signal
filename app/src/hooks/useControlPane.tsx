import { atom, useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { focusAtom } from "jotai-optics"
import { cloneDeep } from "lodash"
import {
  ControlMode,
  defaultControlModes,
} from "../entities/control/ControlMode"
import { ControlSelection } from "../entities/selection/ControlSelection"

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
    resetSelection: useSetAtom(resetSelectionAtom),
    setControlMode: useSetAtom(controlModeAtom),
    setControlModes: useSetAtom(controlModesAtom),
    setSelection: useSetAtom(selectionAtom),
    setSelectedEventIds: useSetAtom(selectedEventIdsAtom),
    setControlPencilMode: useSetAtom(controlPencilModeAtom),
    setControlCurveType: useSetAtom(controlCurveTypeAtom),
    serializeState: useSetAtom(serializeAtom),
    restoreState: useSetAtom(restoreAtom),
  }
}

// atoms
const controlModeAtom = atom<ControlMode>({ type: "velocity" })
const controlPencilModeAtom = atom<"pencil" | "line" | "curve">("pencil")
const controlCurveTypeAtom = atom<"linear" | "easeIn" | "easeOut">("easeIn")
const selectionAtom = atom<ControlSelection | null>(null)
const selectedEventIdsAtom = atom<number[]>([])
const storageAtom = atomWithStorage<{ controlModes: ControlMode[] }>(
  "ControlStore",
  {
    controlModes: defaultControlModes,
  },
)
const controlModesAtom = focusAtom(storageAtom, (optic) =>
  optic.prop("controlModes"),
)

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
  set(selectedEventIdsAtom, [])
})
const serializeAtom = atom(null, (get) => ({
  controlModes: cloneDeep(get(controlModesAtom)),
  selection: cloneDeep(get(selectionAtom)),
  selectedEventIds: cloneDeep(get(selectedEventIdsAtom)),
}))
const restoreAtom = atom(
  null,
  (
    _get,
    set,
    {
      controlModes,
      selection,
      selectedEventIds,
    }: {
      controlModes: ControlMode[]
      selection: ControlSelection | null
      selectedEventIds: number[]
    },
  ) => {
    set(controlModesAtom, controlModes)
    set(selectionAtom, selection)
    set(selectedEventIdsAtom, selectedEventIds)
  },
)
