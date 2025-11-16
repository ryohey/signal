import { useStores } from "./useStores"

export function useCommands() {
  const { commands } = useStores()
  return commands
}
