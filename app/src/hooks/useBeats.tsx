import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { createScope, ScopeProvider } from "jotai-scope"
import { Store } from "jotai/vanilla/store"
import { useEffect, useMemo } from "react"
import { BeatWithX } from "../entities/beat/BeatWithX"
import { useSong } from "./useSong"
import { useTickScroll } from "./useTickScroll"

const createBeatsScope = (parentStore: Store) =>
  createScope({
    atoms: [beatsAtom],
    parentStore,
  })

export function BeatsProvider({ children }: { children: React.ReactNode }) {
  const store = useStore()
  const scope = useMemo(() => createBeatsScope(store), [store])
  const { scrollLeft, transform, canvasWidth } = useTickScroll()
  const { measures, timebase } = useSong()

  const setBeats = useSetAtom(beatsAtom, { store: scope })

  // update beats when scrollLeft, transform, canvasWidth, measures, or timebase changes
  useEffect(() => {
    const beats = BeatWithX.createInRange(
      measures,
      transform,
      timebase,
      scrollLeft,
      canvasWidth,
    )
    setBeats(beats)
  }, [scrollLeft, transform, canvasWidth, measures, timebase, setBeats])

  return <ScopeProvider scope={scope}>{children}</ScopeProvider>
}

export function useBeats(store: Store = useStore()) {
  return useAtomValue(beatsAtom, { store })
}

// atoms
const beatsAtom = atom<BeatWithX[]>([])
