import { atom, useAtomValue, useSetAtom } from "jotai"

export function useEventList() {
  return {
    get isOpen() {
      return useAtomValue(showEventListAtom)
    },
    setOpen: useSetAtom(showEventListAtom),
  }
}

// atoms
const showEventListAtom = atom<boolean>(false)
