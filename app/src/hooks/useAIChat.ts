import { atom, useAtomValue, useSetAtom } from "jotai"

const aiChatOpenAtom = atom(true) // Default open for MVP

export function useAIChat() {
  const isOpen = useAtomValue(aiChatOpenAtom)
  const setIsOpen = useSetAtom(aiChatOpenAtom)

  return {
    isOpen,
    setOpen: setIsOpen,
    toggle: () => setIsOpen((prev) => !prev),
  }
}
