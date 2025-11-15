import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { createScope, ScopeProvider } from "jotai-scope"
import { Store } from "jotai/vanilla/store"
import { clamp } from "lodash"
import { SetStateAction, useEffect } from "react"
import { Layout } from "../Constants"
import { TickTransform } from "../entities/transform/TickTransform"
import { useMobxSelector } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

interface TickScrollConfig {
  readonly minScaleX: number
  readonly maxScaleX: number
}

export const createTickScrollScope = (parentStore: Store) =>
  createScope({
    atoms: new Set([
      scrollLeftTicksAtom,
      scaleXAtom,
      canvasWidthAtom,
      autoScrollAtom,
      minScaleXAtom,
      maxScaleXAtom,
      endTickAtom,
    ]),
    parentStore,
  })

type TickScrollScopedStore = ReturnType<typeof createTickScrollScope>

export function TickScrollProvider({
  scope,
  minScaleX,
  maxScaleX,
  children,
}: {
  scope: TickScrollScopedStore
  children: React.ReactNode
} & TickScrollConfig) {
  const { endOfSong } = useSong()
  const { isPlaying, position } = usePlayer()
  const triggerAutoScroll = useSetAtom(triggerAutoScrollAtom, { store: scope })
  const setEndTick = useSetAtom(endTickAtom, { store: scope })
  const setMinScaleX = useSetAtom(minScaleXAtom, { store: scope })
  const setMaxScaleX = useSetAtom(maxScaleXAtom, { store: scope })

  useEffect(() => setMinScaleX(minScaleX), [setMinScaleX, minScaleX])
  useEffect(() => setMaxScaleX(maxScaleX), [setMaxScaleX, maxScaleX])

  // keep endTick updated
  useEffect(() => {
    setEndTick(endOfSong)
  }, [setEndTick, endOfSong])

  useEffect(() => {
    if (isPlaying) {
      triggerAutoScroll(position)
    }
  }, [triggerAutoScroll, isPlaying, position])

  return <ScopeProvider scope={scope}>{children}</ScopeProvider>
}

export function useTickScroll(store = useStore()) {
  return {
    get autoScroll() {
      return useAtomValue(autoScrollAtom, { store })
    },
    get cursorX() {
      const { player } = useStores()
      const transform = useAtomValue(transformAtom, { store })
      return useMobxSelector(
        () => transform.getX(player.position),
        [transform, player],
      )
    },
    get scrollLeft() {
      return useAtomValue(scrollLeftAtom, { store })
    },
    get scrollLeftTicks() {
      return useAtomValue(scrollLeftTicksAtom, { store })
    },
    get scaleX() {
      return useAtomValue(scaleXAtom, { store })
    },
    get transform() {
      return useAtomValue(transformAtom, { store })
    },
    get canvasWidth() {
      return useAtomValue(canvasWidthAtom, { store })
    },
    get contentWidth() {
      return useAtomValue(contentWidthAtom, { store })
    },
    getTick: useSetAtom(getTickAtom, { store }),
    setCanvasWidth: useSetAtom(canvasWidthAtom, { store }),
    setScrollLeftInPixels: useSetAtom(setScrollLeftInPixelsAtom, { store }),
    // Unlike scrollLeft = tick, this method keeps the scroll position within the content area
    setScrollLeftInTicks: useSetAtom(setScrollLeftInTicksAtom, { store }),
    setScaleX: useSetAtom(setScaleXAtom, { store }),
    scaleAroundPointX: useSetAtom(scaleAroundPointXAtom, { store }),
    setAutoScroll: useSetAtom(autoScrollAtom, { store }),
  }
}

// atoms
const scrollLeftTicksAtom = atom(0)
const scaleXAtom = atom(1)
const canvasWidthAtom = atom(0)
const autoScrollAtom = atom(true)
const endTickAtom = atom(0) // bridge to Song.endOfSong
const minScaleXAtom = atom(0.15)
const maxScaleXAtom = atom(15)

// derived atoms
const transformAtom = atom(
  (get) => new TickTransform(Layout.pixelsPerTick * get(scaleXAtom)),
)
const scrollLeftAtom = atom((get) =>
  Math.round(get(transformAtom).getX(get(scrollLeftTicksAtom))),
)
const contentWidthAtom = atom((get) => {
  const transform = get(transformAtom)
  const canvasWidth = get(canvasWidthAtom)
  const scrollLeft = get(scrollLeftAtom)
  const trackEndTick = get(endTickAtom)
  const startTick = transform.getTick(scrollLeft)
  const widthTick = transform.getTick(canvasWidth)
  const endTick = startTick + widthTick
  return transform.getX(Math.max(trackEndTick, endTick))
})

// actions
const setScrollLeftInPixelsAtom = atom(
  null,
  (get, set, value: SetStateAction<number>) => {
    const x = typeof value === "function" ? value(get(scrollLeftAtom)) : value
    const transform = get(transformAtom)
    const canvasWidth = get(canvasWidthAtom)
    const contentWidth = get(contentWidthAtom)
    const maxX = contentWidth - canvasWidth
    const scrollLeft = clamp(x, 0, maxX)
    set(scrollLeftTicksAtom, transform.getTick(scrollLeft))
  },
)
const setScrollLeftInTicksAtom = atom(null, (get, set, ticks: number) => {
  const transform = get(transformAtom)
  set(setScrollLeftInPixelsAtom, transform.getX(ticks))
})
const triggerAutoScrollAtom = atom(null, (get, set, playerPosition: number) => {
  const transform = get(transformAtom)
  const scrollLeftTicks = get(scrollLeftTicksAtom)
  const canvasWidth = get(canvasWidthAtom)
  const autoScroll = get(autoScrollAtom)

  const playheadPosition = transform.getX(playerPosition - scrollLeftTicks)
  const playheadInScrollZone =
    playheadPosition < 0 || playheadPosition > canvasWidth * 0.7

  // if the user needs to scroll to comfortably view the playhead.
  if (autoScroll && playheadInScrollZone) {
    set(scrollLeftTicksAtom, playerPosition)
  }
})
const setScaleXAtom = atom(null, (get, set, scaleX: number) => {
  const minScaleX = get(minScaleXAtom)
  const maxScaleX = get(maxScaleXAtom)
  set(scaleXAtom, clamp(scaleX, minScaleX, maxScaleX))
})
const scaleAroundPointXAtom = atom(
  null,
  (get, set, scaleXDelta: number, pixelX: number) => {
    const minScaleX = get(minScaleXAtom)
    const maxScaleX = get(maxScaleXAtom)
    const transform = get(transformAtom)
    const scrollLeft = get(scrollLeftAtom)
    const pixelXInTicks0 = transform.getTick(scrollLeft + pixelX)
    set(scaleXAtom, (prev) =>
      clamp(prev * (1 + scaleXDelta), minScaleX, maxScaleX),
    )
    const updatedTransform = get(transformAtom)
    const updatedScrollLeft = get(scrollLeftAtom)
    const pixelXInTicks1 = updatedTransform.getTick(updatedScrollLeft + pixelX)
    const scrollInTicks = pixelXInTicks1 - pixelXInTicks0
    const scrollLeftTicks = get(scrollLeftTicksAtom)
    set(setScrollLeftInTicksAtom, scrollLeftTicks - scrollInTicks)
  },
)
const getTickAtom = atom(null, (get, _set, offsetX: number) => {
  const transform = get(transformAtom)
  const scrollLeft = get(scrollLeftAtom)
  return transform.getTick(offsetX + scrollLeft)
})
