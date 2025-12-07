import { act, renderHook } from "@testing-library/react"
import { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import RootStore from "../stores/RootStore"
import { SongStore } from "../stores/SongStore"
import { StoreContext } from "./useStores"
import { useVolumeSlider } from "./useVolumeSlider"

// Mock dependencies that don't need real implementation
vi.mock("./useHistory", () => ({
  useHistory: () => ({
    pushHistory: vi.fn(),
  }),
}))

const sendEventMock = vi.fn()
vi.mock("./usePlayer", () => ({
  usePlayer: () => ({
    position: 0,
    sendEvent: sendEventMock,
  }),
}))

// Create mock rootStore with real songStore for testing value updates
const createMockRootStore = () => {
  const songStore = new SongStore()

  return {
    songStore,
    player: {
      position: 0,
    },
  } as any
}

// Create a shared mock store instance
let mockStore: ReturnType<typeof createMockRootStore> | null = null

// Mock usePianoRoll to return the track from the shared mock store
vi.mock("./usePianoRoll", () => ({
  usePianoRoll: () => ({
    get selectedTrack() {
      return mockStore?.songStore?.song?.tracks?.find(
        (track: any) => track.id === 1,
      )
    },
    selectedTrackId: 1,
  }),
}))

const StoreProvider = ({ children }: { children: ReactNode }) => {
  mockStore = createMockRootStore()
  return (
    <StoreContext.Provider value={mockStore as RootStore}>
      {children}
    </StoreContext.Provider>
  )
}

describe("useVolumeSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns correct default value", () => {
    const { result } = renderHook(() => useVolumeSlider(), {
      wrapper: StoreProvider,
    })

    expect(result.current.value).toBe(100) // DEFAULT_VOLUME
  })

  it("setValue updates the actual value returned by the hook", () => {
    const { result } = renderHook(() => useVolumeSlider(), {
      wrapper: StoreProvider,
    })

    // Initially should be default value
    expect(result.current.value).toBe(100)

    // Set a new value
    act(() => {
      result.current.setValue(80)
    })

    // The value should be updated through the real store
    expect(result.current.value).toBe(80)
  })

  it("setValue calls sendEvent when channel is set", () => {
    const { result } = renderHook(() => useVolumeSlider(), {
      wrapper: StoreProvider,
    })

    act(() => {
      result.current.setValue(90)
    })

    expect(sendEventMock).toHaveBeenCalledWith({
      type: "channel",
      subtype: "controller",
      deltaTime: 0,
      channel: 0,
      controllerType: 7,
      value: 90,
    })
  })

  it("provides onPointerDown and onPointerUp callbacks", () => {
    const { result } = renderHook(() => useVolumeSlider(), {
      wrapper: StoreProvider,
    })

    expect(typeof result.current.onPointerDown).toBe("function")
    expect(typeof result.current.onPointerUp).toBe("function")
  })
})
