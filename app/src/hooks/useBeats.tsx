import { Beat } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { Store } from "jotai/vanilla/store"
import { createScope, ScopeProvider } from "jotai-scope"
import { useEffect } from "react"
import { useSong } from "./useSong"
import { useTickScroll } from "./useTickScroll"

export type BeatWithX = Beat & {
  readonly x: number
}

export const createBeatsScope = (parentStore: Store) =>
  createScope({
    atoms: [beatsAtom],
    parentStore,
  })

export function BeatsProvider({
  scope,
  children,
}: {
  scope: Store
  children: React.ReactNode
}) {
  const { transform, tickRange } = useTickScroll()
  const { measures, timebase } = useSong()
  const setBeats = useSetAtom(beatsAtom, { store: scope })

  // update beats when scroll, measures changed
  useEffect(() => {
    const beats = Beat.createInRange(measures, timebase, tickRange).map(
      (b) => ({
        ...b,
        x: Math.round(transform.getX(b.tick)),
      }),
    )
    setBeats(beats)
  }, [transform, tickRange, measures, timebase, setBeats])

  return <ScopeProvider scope={scope}>{children}</ScopeProvider>
}

export function useBeats(store: Store = useStore()) {
  return useAtomValue(beatsAtom, { store })
}

// atoms
const beatsAtom = atom<BeatWithX[]>([])
