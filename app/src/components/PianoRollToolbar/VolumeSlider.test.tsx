import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { VolumeSlider } from "./VolumeSlider"

const setTrackVolumeMock = vi.fn()
vi.mock("../../hooks/useVolumeSlider", () => ({
  useVolumeSlider: vi.fn(() => ({
    value: 42,
    setValue: setTrackVolumeMock,
  })),
}))

describe("VolumeSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.HTMLElement.prototype.hasPointerCapture = vi.fn()
    window.HTMLElement.prototype.releasePointerCapture = vi.fn()
    window.HTMLElement.prototype.setPointerCapture = vi.fn()
  })

  it("renders the slider with the correct initial value", () => {
    render(<VolumeSlider />)
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuenow", "42") // equals currentVolume
  })

  it("calls setTrackVolume when the slider value changes", async () => {
    const user = userEvent.setup()
    render(<VolumeSlider />)
    const slider = screen.getByRole("slider")
    await user.click(slider) // focus the slider
    await user.keyboard("[ArrowRight]")
    await user.keyboard("[ArrowLeft]")
    expect(setTrackVolumeMock).toHaveBeenNthCalledWith(1, 43) // arrow right: currentVolume + 1
    expect(setTrackVolumeMock).toHaveBeenNthCalledWith(2, 41) // arrow left: currentVolume - 1
  })
})
