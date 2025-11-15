import { atom, SetStateAction, useAtomValue, useSetAtom } from "jotai"
import { createScope } from "jotai-scope"
import { Store } from "jotai/vanilla/store"
import { clamp } from "lodash"
import { createContext, useContext, useEffect } from "react"
import { BAR_WIDTH } from "../components/inputs/ScrollBar"
import { Layout } from "../Constants"
import { TrackTransform } from "../entities/transform/TrackTransform"
import { useMobxSelector } from "./useMobxSelector"
import { useStores } from "./useStores"

const DEFAULT_TRACK_HEIGHT = 64
const SCALE_Y_MIN = 0.5
const SCALE_Y_MAX = 4

export const createTrackScrollScope = (parentStore: Store) =>
  createScope({
    atoms: new Set([
      canvasHeightAtom,
      contentHeightAtom,
      scaleYAtom,
      scrollTopAtom,
      trackHeightAtom,
      trackCountAtom,
    ]),
    parentStore,
  })

const TrackScrollContext = createContext<Store>(null!)

export function TrackScrollProvider({
  scope,
  children,
}: {
  scope: Store
  children: React.ReactNode
}) {
  const { songStore } = useStores()
  const trackCount = useMobxSelector(
    () => songStore.song.tracks.length,
    [songStore],
  )
  const setTrackCount = useSetAtom(trackCountAtom, { store: scope })

  // keep trackCountAtom updated
  useEffect(() => {
    setTrackCount(trackCount)
  }, [trackCount, setTrackCount])

  return (
    <TrackScrollContext.Provider value={scope}>
      {children}
    </TrackScrollContext.Provider>
  )
}

// Vertical scroll for ArrangeView
export function useTrackScroll(store = useContext(TrackScrollContext)) {
  return {
    get canvasHeight() {
      return useAtomValue(canvasHeightAtom, { store })
    },
    get contentHeight() {
      return useAtomValue(contentHeightAtom, { store })
    },
    get scaleY() {
      return useAtomValue(scaleYAtom, { store })
    },
    get scrollTop() {
      return useAtomValue(scrollTopAtom, { store })
    },
    get trackHeight() {
      return useAtomValue(trackHeightAtom, { store })
    },
    get transform() {
      return useAtomValue(transformAtom, { store })
    },
    setCanvasHeight: useSetAtom(canvasHeightAtom, { store }),
    setScaleY: useSetAtom(setScaleYAtom, { store }),
    setScrollTop: useSetAtom(setScrollTopAtom, { store }),
  }
}

// atoms
const canvasHeightAtom = atom(0)
const scaleYAtom = atom(1)
const scrollTopAtom = atom(0)
const trackCountAtom = atom(0) // bridge atom to get track count from SongStore

// derived atoms
const trackHeightAtom = atom((get) => DEFAULT_TRACK_HEIGHT * get(scaleYAtom))
const transformAtom = atom((get) => new TrackTransform(get(trackHeightAtom)))
const contentHeightAtom = atom((get) => {
  const transform = get(transformAtom)
  const trackCount = get(trackCountAtom)
  return transform.getY(trackCount)
})

// actions
const setScrollTopAtom = atom(
  null,
  (get, set, value: SetStateAction<number>) => {
    const scrollTop =
      typeof value === "function" ? value(get(scrollTopAtom)) : value
    const maxOffset =
      get(contentHeightAtom) +
      Layout.rulerHeight +
      BAR_WIDTH -
      get(canvasHeightAtom)
    set(scrollTopAtom, clamp(scrollTop, 0, maxOffset))
  },
)
const setScaleYAtom = atom(null, (get, set, scaleY: number) => {
  set(scaleYAtom, clamp(scaleY, SCALE_Y_MIN, SCALE_Y_MAX))
  set(setScrollTopAtom, get(scrollTopAtom))
})
